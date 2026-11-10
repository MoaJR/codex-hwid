'use client';
import {useMemo,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import type {PatientBookingAppointment,PatientBookingOptions,PatientRequestSummary} from '@/modules/scheduling/types';

const modeNames={IN_PERSON:'Presencial',ONLINE:'Online'} as const;
function formatInstant(value:string){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'full',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(value));}
function formatDay(value:string){return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));}
function formatTime(value:string){return new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date(value));}

/**
 * Área de agendamento do paciente: solicita horário real do catálogo, retira a
 * própria pendência e cancela a própria consulta confirmada. Nenhuma ação é
 * apresentada como concluída antes da resposta do servidor.
 */
export function PatientBooking({options}:{options:PatientBookingOptions}){
  const router=useRouter();
  const [serviceId,setServiceId]=useState(options.services[0]?.id??'');
  const [day,setDay]=useState('');
  const [slot,setSlot]=useState('');
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [confirmWithdraw,setConfirmWithdraw]=useState('');
  const [confirmCancel,setConfirmCancel]=useState('');
  const intent=useRef<{fingerprint:string;key:string}|null>(null);
  const lock=useRef(false);
  const service=options.services.find(item=>item.id===serviceId)??options.services[0];
  const days=useMemo(()=>[...new Set((service?.slots??[]).map(item=>item.date))],[service]);
  const slots=useMemo(()=>(service?.slots??[]).filter(item=>item.date===day),[service,day]);
  async function send(path:string,init:RequestInit,success:string){
    if(lock.current)return false;
    lock.current=true;setBusy(path);setError('');setMessage('');
    try{
      const response=await fetch(path,init);
      const payload=await response.json().catch(()=>null) as {error?:{message?:string}}|null;
      if(!response.ok)throw new Error(payload?.error?.message??'Não foi possível concluir a operação.');
      setMessage(success);router.refresh();return true;
    }catch(reason){setError(reason instanceof Error?reason.message:'Não foi possível concluir a operação.');return false;}
    finally{lock.current=false;setBusy('');}
  }
  async function requestSlot(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    const selected=slots.find(item=>item.startsAt===slot);
    if(!selected||!service){setError('Escolha um horário disponível.');return;}
    const fingerprint=`${service.id}:${selected.startsAt}`;
    if(intent.current?.fingerprint!==fingerprint)intent.current={fingerprint,key:crypto.randomUUID()};
    const ok=await send('/api/paciente/appointment-requests',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':intent.current.key},body:JSON.stringify({serviceId:service.id,date:selected.date,time:selected.time})},'Solicitação enviada. A equipe confirma o horário e ele aparece como confirmado nesta página.');
    if(ok){intent.current=null;setSlot('');}
  }
  async function withdraw(item:PatientRequestSummary){
    const ok=await send(`/api/paciente/appointment-requests/${item.id}/withdraw`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:item.version})},'Solicitação retirada.');
    if(ok)setConfirmWithdraw('');
  }
  async function cancel(item:PatientBookingAppointment){
    const ok=await send(`/api/paciente/appointments/${item.id}/cancel`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:item.version})},'Consulta cancelada. O horário foi liberado.');
    if(ok)setConfirmCancel('');
  }
  const hasSlots=(service?.slots.length??0)>0;
  return <div className="patient-booking" aria-busy={!!busy}>
    {(message||error)&&<div className={error?'notice schedule-error':'form-success'} role={error?'alert':'status'}>{error||message}</div>}

    <section className="panel">
      <p className="eyebrow">Solicitar horário</p>
      <h2>Escolha um horário disponível.</h2>
      <p>A solicitação é enviada à equipe e não reserva o horário até a confirmação. O estado fica visível nesta página.</p>
      {options.services.length===0?<p className="notice">O catálogo de atendimentos ainda não está disponível. Procure a equipe responsável.</p>:<form onSubmit={requestSlot}>
        <div className="form-grid">
          <label>Atendimento<select value={service?.id??''} onChange={event=>{setServiceId(event.target.value);setDay('');setSlot('');intent.current=null;}}>{options.services.map(item=><option key={item.id} value={item.id}>{item.label} · {modeNames[item.mode]}</option>)}</select></label>
          <label>Dia disponível<select value={day} onChange={event=>{setDay(event.target.value);setSlot('');intent.current=null;}} required><option value="">Selecione</option>{days.map(item=><option key={item} value={item}>{formatDay(item)}</option>)}</select></label>
        </div>
        {!hasSlots?<p className="notice">Nenhum horário livre nesta janela. Tente novamente mais tarde ou fale com a equipe.</p>:day?<fieldset className="booking-slots-field"><legend>Horários em {formatDay(day)}</legend>
          <div className="booking-slots">{slots.map(item=><label className="booking-slot" key={item.startsAt}><input type="radio" name="slot" value={item.startsAt} checked={slot===item.startsAt} onChange={()=>{setSlot(item.startsAt);intent.current=null;}}/><span>{formatTime(item.startsAt)}</span></label>)}</div>
        </fieldset>:<p className="booking-hint">Escolha um dia para ver os horários livres.</p>}
        <div className="form-actions"><button className="button" type="submit" disabled={!!busy||!slot}>{busy==='/api/paciente/appointment-requests'?'Enviando…':'Enviar solicitação'}</button></div>
      </form>}
    </section>

    {options.requests.length>0&&<section className="panel">
      <p className="eyebrow">Aguardando confirmação</p>
      <h2>Solicitações enviadas.</h2>
      <div className="patient-appointment-list">{options.requests.map(item=><article className="patient-appointment" key={item.id}>
        <div><span className="status-badge status-pending">Em análise</span><h3>{item.serviceLabel}</h3><p>{formatInstant(item.startsAt)} · {modeNames[item.mode]}</p></div>
        {confirmWithdraw===item.id?<div className="patient-booking-confirm" role="group" aria-label="Confirmar retirada da solicitação">
          <button className="button" type="button" disabled={!!busy} onClick={()=>withdraw(item)}>Confirmar retirada</button>
          <button className="button button-outline" type="button" disabled={!!busy} onClick={()=>setConfirmWithdraw('')}>Voltar</button>
        </div>:<button className="text-button danger-button" type="button" disabled={!!busy} onClick={()=>setConfirmWithdraw(item.id)} aria-label={`Retirar solicitação de ${item.serviceLabel} em ${formatInstant(item.startsAt)}`}>Retirar solicitação</button>}
      </article>)}</div>
    </section>}

    <section className="panel">
      <p className="eyebrow">Próximos atendimentos</p>
      <h2>Sua agenda.</h2>
      {options.appointments.length===0?<p className="portal-list-empty">Nenhum atendimento confirmado está vinculado à sua conta.</p>:<div className="patient-appointment-list">{options.appointments.map(item=><article className="patient-appointment" key={item.id}>
        <div><span className="status-badge status-confirmed">Confirmada</span><h3>{item.serviceLabel}</h3><p>{formatInstant(item.startsAt)} · {modeNames[item.mode]}</p></div>
        {confirmCancel===item.id?<div className="patient-booking-confirm" role="group" aria-label="Confirmar cancelamento da consulta">
          <button className="button" type="button" disabled={!!busy} onClick={()=>cancel(item)}>Confirmar cancelamento</button>
          <button className="button button-outline" type="button" disabled={!!busy} onClick={()=>setConfirmCancel('')}>Voltar</button>
        </div>:<button className="text-button danger-button" type="button" disabled={!!busy} onClick={()=>setConfirmCancel(item.id)} aria-label={`Cancelar consulta de ${item.serviceLabel} em ${formatInstant(item.startsAt)}`}>Cancelar consulta</button>}
      </article>)}</div>}
    </section>
  </div>;
}

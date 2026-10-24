'use client';
import {useMemo,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {generateAvailableSlots} from '@/modules/scheduling/availability.mjs';
import type {ScheduleAppointment,SchedulingWorkspace} from '@/modules/scheduling/types';

const weekdayNames=['','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
const statusNames={CONFIRMED:'Confirmada',CANCELLED:'Cancelada',COMPLETED:'Concluída',NO_SHOW:'Ausência'} as const;
const modeNames={IN_PERSON:'Presencial',ONLINE:'Online'} as const;
function minuteLabel(value:number){return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}
function formatInstant(value:string){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(value));}
function formatDate(value:string){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));}
function slotLabel(slot:{startsAt:string}){return new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date(slot.startsAt));}

export function ScheduleWorkspace({workspace,canManageAvailability,canManageAppointments,referenceNow}:{workspace:SchedulingWorkspace;canManageAvailability:boolean;canManageAppointments:boolean;referenceNow:string}){
  const router=useRouter();
  const [serviceId,setServiceId]=useState(workspace.services[0]?.id??'');
  const [slotDate,setSlotDate]=useState('');
  const [slot,setSlot]=useState('');
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [editingId,setEditingId]=useState('');
  const [rescheduleSlot,setRescheduleSlot]=useState('');
  const submitLock=useRef(false);
  const mutationLock=useRef(false);
  const intent=useRef<{fingerprint:string;key:string}|null>(null);
  const activeAppointments=workspace.appointments.filter(item=>item.status!=='CANCELLED');
  function slotsFor(selectedServiceId:string,excludeId?:string){
    const service=workspace.services.find(item=>item.id===selectedServiceId);if(!service)return [];
    return generateAvailableSlots({
      from:workspace.from,to:workspace.to,timeZone:workspace.doctor.timeZone,service,rules:workspace.rules,
      exceptions:workspace.exceptions,appointments:activeAppointments.filter(item=>item.id!==excludeId),
    }).filter(item=>new Date(item.startsAt).getTime()>new Date(referenceNow).getTime());
  }
  const available=useMemo(()=>slotsFor(serviceId),[serviceId,workspace,referenceNow]);
  const availableDates=useMemo(()=>[...new Set(available.map(item=>item.date))],[available]);
  const availableForDate=useMemo(()=>available.filter(item=>item.date===slotDate),[available,slotDate]);
  const editingAppointment=workspace.appointments.find(item=>item.id===editingId);
  const rescheduleOptions=useMemo(()=>editingAppointment?slotsFor(editingAppointment.serviceId,editingAppointment.id).filter(item=>item.startsAt!==editingAppointment.startsAt):[],[editingAppointment,workspace,referenceNow]);
  async function mutate(path:string,init:RequestInit,success:string){
    if(mutationLock.current)return false;
    mutationLock.current=true;
    setBusy(path);setError('');setMessage('');
    try{
      const response=await fetch(path,init);const payload=await response.json().catch(()=>null) as {error?:{message?:string}}|null;
      if(!response.ok)throw new Error(payload?.error?.message??'Não foi possível concluir a operação.');
      setMessage(success);router.refresh();return true;
    }catch(reason){setError(reason instanceof Error?reason.message:'Não foi possível concluir a operação.');return false;}
    finally{mutationLock.current=false;setBusy('');}
  }
  async function create(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(submitLock.current)return;
    const data=new FormData(event.currentTarget);const selected=available.find(item=>item.startsAt===slot);
    if(!selected){setError('Escolha um horário disponível.');return;}
    const patientId=String(data.get('patientId')??'');const fingerprint=`${patientId}:${serviceId}:${slot}`;
    if(intent.current?.fingerprint!==fingerprint)intent.current={fingerprint,key:crypto.randomUUID()};
    submitLock.current=true;
    try{
      const ok=await mutate('/api/medico/appointments',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':intent.current.key},body:JSON.stringify({patientId,serviceId,date:selected.date,time:selected.time})},'Consulta confirmada e registrada na agenda.');
      if(ok){intent.current=null;setSlot('');setSlotDate('');}
    }finally{submitLock.current=false;}
  }
  async function createRule(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const data=Object.fromEntries(new FormData(form));
    const ok=await mutate('/api/medico/availability',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'RULE',weekday:Number(data.weekday),startTime:data.startTime,endTime:data.endTime,validFrom:data.validFrom,validUntil:data.validUntil||null})},'Regra semanal adicionada.');
    if(ok)form.reset();
  }
  async function createException(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const data=Object.fromEntries(new FormData(form));
    const ok=await mutate('/api/medico/availability',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'EXCEPTION',kind:data.kind,date:data.date,startTime:data.startTime,endTime:data.endTime})},'Exceção adicionada à agenda.');
    if(ok)form.reset();
  }
  async function cancel(item:ScheduleAppointment){
    if(!window.confirm(`Cancelar a consulta de ${item.patientName}?`))return;
    await mutate(`/api/medico/appointments/${item.id}/cancel`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:item.version})},'Consulta cancelada. O horário foi liberado.');
  }
  async function move(item:ScheduleAppointment){
    const next=rescheduleOptions.find(candidate=>candidate.startsAt===rescheduleSlot);
    if(!next){setError('Escolha um novo horário disponível.');return;}
    const ok=await mutate(`/api/medico/appointments/${item.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:next.date,time:next.time,version:item.version})},'Consulta reagendada.');
    if(ok){setEditingId('');setRescheduleSlot('');}
  }
  return <div className="schedule-workspace" aria-busy={!!busy}>
    {(message||error)&&<div className={error?'notice schedule-error':'form-success'} role={error?'alert':'status'}>{error||message}</div>}
    <section className="schedule-summary" aria-label="Resumo da agenda">
      <div className="panel"><strong>{workspace.appointments.filter(item=>item.status==='CONFIRMED').length}</strong><span>consultas confirmadas na janela</span></div>
      <div className="panel"><strong>{workspace.rules.length}</strong><span>regras semanais ativas</span></div>
      <div className="panel"><strong>{workspace.exceptions.length}</strong><span>exceções na janela</span></div>
      <div className="panel"><strong>{workspace.patients.length}</strong><span>pacientes provisionados</span></div>
    </section>

    {canManageAppointments&&<section className="panel schedule-section">
      <div className="section-heading"><div><p className="eyebrow">Nova consulta</p><h2>Confirmar um horário.</h2></div><p>A confirmação só ocorre depois da gravação transacional no banco.</p></div>
      {workspace.patients.length===0?<p className="notice">Nenhuma conta de paciente foi provisionada. Cadastre primeiro uma identidade de teste pelo fluxo confiável da equipe.</p>:workspace.services.length===0?<p className="notice">O catálogo de atendimentos ainda não está disponível.</p>:<form onSubmit={create}>
        <div className="form-grid"><label>Paciente<select name="patientId" required>{workspace.patients.map(patient=><option key={patient.id} value={patient.id}>{patient.name}</option>)}</select></label><label>Atendimento<select value={serviceId} onChange={event=>{setServiceId(event.target.value);setSlotDate('');setSlot('');intent.current=null;}}>{workspace.services.map(service=><option key={service.id} value={service.id}>{service.name} · {modeNames[service.mode]}</option>)}</select></label><label>Data disponível<select value={slotDate} onChange={event=>{setSlotDate(event.target.value);setSlot('');intent.current=null;}} required><option value="">Selecione</option>{availableDates.map(date=><option key={date} value={date}>{formatDate(date)}</option>)}</select></label><label>Horário livre<select value={slot} onChange={event=>{setSlot(event.target.value);intent.current=null;}} required><option value="">Selecione</option>{availableForDate.map(item=><option key={item.startsAt} value={item.startsAt}>{slotLabel(item)}</option>)}</select></label></div>
        {available.length===0&&<p className="notice">Nenhum horário livre. Cadastre uma regra semanal ou uma abertura excepcional.</p>}
        <div className="form-actions"><button className="button" disabled={!!busy||!slot} type="submit">{busy==='/api/medico/appointments'?'Confirmando…':'Confirmar consulta'}</button></div>
      </form>}
    </section>}

    <section className="panel schedule-section">
      <div className="section-heading"><div><p className="eyebrow">Agenda operacional</p><h2>Consultas na janela.</h2></div><p>{formatDate(workspace.from)} a {formatDate(workspace.to)}</p></div>
      <div className="schedule-list">{workspace.appointments.map(item=><article className="schedule-appointment" key={item.id}><div><span className={`status-badge status-${item.status.toLowerCase()}`}>{statusNames[item.status]}</span><h3>{item.patientName}</h3><p>{item.serviceLabel} · {modeNames[item.mode]} · {item.durationMinutes} min</p><strong>{formatInstant(item.startsAt)}–{new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date(item.endsAt))} · horário de Brasília</strong></div>{item.status==='CONFIRMED'&&canManageAppointments&&<div className="schedule-appointment-actions">{editingId===item.id?<><label><span className="sr-only">Novo horário para {item.patientName}</span><select value={rescheduleSlot} onChange={event=>setRescheduleSlot(event.target.value)}><option value="">Novo horário</option>{rescheduleOptions.map(candidate=><option key={candidate.startsAt} value={candidate.startsAt}>{slotLabel(candidate)}</option>)}</select></label><button className="button button-outline" type="button" disabled={!!busy||!rescheduleSlot} onClick={()=>move(item)} aria-label={`Confirmar reagendamento de ${item.patientName}`}>Confirmar</button><button className="text-button" type="button" onClick={()=>{setEditingId('');setRescheduleSlot('');}}>Fechar</button></>:<button className="button button-outline" type="button" disabled={!!busy} onClick={()=>{setEditingId(item.id);setRescheduleSlot('');}} aria-label={`Escolher novo horário para ${item.patientName}`}>Reagendar</button>}<button className="text-button danger-button" type="button" disabled={!!busy} onClick={()=>cancel(item)} aria-label={`Cancelar consulta de ${item.patientName}`}>Cancelar</button></div>}</article>)}{workspace.appointments.length===0&&<p className="notice">Nenhuma consulta registrada nesta janela.</p>}</div>
    </section>

    <section className="schedule-columns">
      <div className="panel schedule-section"><div className="section-heading"><div><p className="eyebrow">Disponibilidade recorrente</p><h2>Semana padrão.</h2></div></div>
        <div className="schedule-list">{workspace.rules.map(rule=><div className="schedule-rule" key={rule.id}><span><strong>{weekdayNames[rule.weekday]}</strong><small>{minuteLabel(rule.startMinute)}–{minuteLabel(rule.endMinute)} · {formatDate(rule.validFrom)}{rule.validUntil?` a ${formatDate(rule.validUntil)}`:' em diante'}</small></span>{canManageAvailability&&<button className="text-button" type="button" disabled={!!busy} onClick={()=>mutate(`/api/medico/availability/${rule.id}?kind=rule`,{method:'DELETE'},'Regra desativada.')} aria-label={`Desativar regra de ${weekdayNames[rule.weekday]} das ${minuteLabel(rule.startMinute)} às ${minuteLabel(rule.endMinute)}`}>Desativar</button>}</div>)}{workspace.rules.length===0&&<p className="notice">Nenhuma regra semanal ativa.</p>}</div>
        {canManageAvailability&&<form className="schedule-form" onSubmit={createRule}><div className="form-grid"><label>Dia<select name="weekday" defaultValue="1">{weekdayNames.slice(1).map((name,index)=><option key={name} value={index+1}>{name}</option>)}</select></label><label>Válida a partir de<input name="validFrom" type="date" defaultValue={workspace.from} required/></label><label>Início<input name="startTime" type="time" defaultValue="09:00" required/></label><label>Fim<input name="endTime" type="time" defaultValue="12:00" required/></label></div><label>Válida até <small>(opcional)</small><input name="validUntil" type="date"/></label><button className="button" disabled={!!busy} type="submit">Adicionar regra</button></form>}
      </div>
      <div className="panel schedule-section"><div className="section-heading"><div><p className="eyebrow">Exceções</p><h2>Aberturas e bloqueios.</h2></div></div>
        <div className="schedule-list">{workspace.exceptions.map(item=><div className="schedule-rule" key={item.id}><span><strong>{item.kind==='BLOCKED'?'Bloqueado':'Abertura extra'}</strong><small>{formatInstant(item.startsAt)}–{new Intl.DateTimeFormat('pt-BR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Sao_Paulo'}).format(new Date(item.endsAt))}</small></span>{canManageAvailability&&<button className="text-button" type="button" disabled={!!busy} onClick={()=>mutate(`/api/medico/availability/${item.id}?kind=exception`,{method:'DELETE'},'Exceção removida.')} aria-label={`Remover ${item.kind==='BLOCKED'?'bloqueio':'abertura extra'} de ${formatInstant(item.startsAt)}`}>Remover</button>}</div>)}{workspace.exceptions.length===0&&<p className="notice">Nenhuma exceção nesta janela.</p>}</div>
        {canManageAvailability&&<form className="schedule-form" onSubmit={createException}><div className="form-grid"><label>Tipo<select name="kind" defaultValue="BLOCKED"><option value="BLOCKED">Bloqueio</option><option value="AVAILABLE">Abertura extra</option></select></label><label>Data<input name="date" type="date" defaultValue={workspace.from} required/></label><label>Início<input name="startTime" type="time" defaultValue="09:00" required/></label><label>Fim<input name="endTime" type="time" defaultValue="12:00" required/></label></div><button className="button" disabled={!!busy} type="submit">Adicionar exceção</button></form>}
      </div>
    </section>
  </div>;
}

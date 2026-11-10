'use client';
import {useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import type {PendingRequestSummary} from '@/modules/scheduling/types';

const modeNames={IN_PERSON:'Presencial',ONLINE:'Online'} as const;
function formatInstant(value:string){return new Intl.DateTimeFormat('pt-BR',{dateStyle:'full',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(value));}

/**
 * Fila de solicitações do paciente para a equipe. A aprovação executa o mesmo
 * caminho transacional da agenda; um conflito de horário retorna 409 e a
 * solicitação permanece na fila sem alteração.
 */
export function AppointmentRequestsPanel({requests}:{requests:PendingRequestSummary[]}){
  const router=useRouter();
  const [busy,setBusy]=useState('');
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [confirmReject,setConfirmReject]=useState('');
  const lock=useRef(false);
  async function decide(action:'approve'|'reject',item:PendingRequestSummary){
    if(lock.current)return;
    lock.current=true;setBusy(item.id);setError('');setMessage('');
    try{
      const response=await fetch(`/api/medico/appointment-requests/${item.id}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:item.version})});
      const payload=await response.json().catch(()=>null) as {error?:{message?:string}}|null;
      if(!response.ok)throw new Error(payload?.error?.message??'Não foi possível concluir a decisão.');
      setMessage(action==='approve'?'Solicitação aprovada e consulta confirmada.':'Solicitação recusada. A equipe pode orientar o paciente pelos canais oficiais.');
      setConfirmReject('');router.refresh();
    }catch(reason){setError(reason instanceof Error?reason.message:'Não foi possível concluir a decisão.');}
    finally{lock.current=false;setBusy('');}
  }
  return <section className="panel schedule-section" aria-busy={!!busy}>
    <div className="section-heading"><div><p className="eyebrow">Solicitações do paciente</p><h2>Aguardando confirmação.</h2></div><p>A aprovação revalida o horário no banco antes de confirmar.</p></div>
    {(message||error)&&<div className={error?'notice schedule-error':'form-success'} role={error?'alert':'status'}>{error||message}</div>}
    {requests.length===0?<p className="notice">Nenhuma solicitação aguardando confirmação.</p>:<div className="schedule-list">{requests.map(item=><article className="schedule-appointment" key={item.id}>
      <div><span className="status-badge status-pending">Em análise</span><h3>{item.patientName}</h3><p>{item.serviceLabel} · {modeNames[item.mode]}</p><strong>{formatInstant(item.startsAt)}</strong></div>
      <div className="schedule-appointment-actions">
        <button className="button" type="button" disabled={!!busy} onClick={()=>decide('approve',item)} aria-label={`Aprovar solicitação de ${item.patientName}`}>Aprovar</button>
        {confirmReject===item.id?<><button className="text-button danger-button" type="button" disabled={!!busy} onClick={()=>decide('reject',item)} aria-label={`Confirmar recusa da solicitação de ${item.patientName}`}>Confirmar recusa</button><button className="text-button" type="button" disabled={!!busy} onClick={()=>setConfirmReject('')}>Voltar</button></>:<button className="text-button danger-button" type="button" disabled={!!busy} onClick={()=>setConfirmReject(item.id)} aria-label={`Recusar solicitação de ${item.patientName}`}>Recusar</button>}
      </div>
    </article>)}</div>}
  </section>;
}

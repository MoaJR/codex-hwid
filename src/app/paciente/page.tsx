import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {getPatientDashboard,type PatientAppointmentSummary} from '@/modules/account/patient-dashboard';
import {requirePatientPage} from '@/server/auth/panel-access';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Meu acompanhamento | Dr. Douglas Vaz',robots:{index:false,follow:false}};
const statusLabel={CONFIRMED:'Confirmada',CANCELLED:'Cancelada',COMPLETED:'Concluída',NO_SHOW:'Não realizada'} as const;
const modeLabel={IN_PERSON:'Presencial',ONLINE:'Online'} as const;
function appointmentDate(item:PatientAppointmentSummary){
  const timeZone=item.timeZone==='America/Sao_Paulo'?item.timeZone:'America/Sao_Paulo';
  return new Intl.DateTimeFormat('pt-BR',{dateStyle:'full',timeStyle:'short',timeZone}).format(new Date(item.startsAt));
}
function AppointmentList({items,empty}:{items:PatientAppointmentSummary[];empty:string}){
  if(items.length===0)return <p className="portal-list-empty">{empty}</p>;
  return <div className="patient-appointment-list">{items.map(item=><article className="patient-appointment" key={`${item.startsAt}-${item.endsAt}-${item.serviceLabel}`}><div><span className={`status-badge status-${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span><h3>{item.serviceLabel}</h3><p>{appointmentDate(item)} · {modeLabel[item.mode]}</p></div></article>)}</div>;
}

export default async function PatientPage(){
  const context=await requirePatientPage();
  const dashboard=await getPatientDashboard(context.actor.userId);
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Área do paciente</span><h1>Meu acompanhamento.</h1><p>Consulte os atendimentos vinculados com segurança à sua conta.</p><div className="form-actions"><Link className="button button-outline" href="/painel">Voltar ao painel</Link><Link className="button button-outline" href="/conta">Minha conta</Link></div></section><section className="container section patient-dashboard">{!dashboard.profileLinked?<div className="panel portal-empty"><h2>Perfil ainda não vinculado.</h2><p>Sua conta está ativa, mas o perfil de paciente ainda precisa ser associado pela equipe responsável.</p></div>:<><section className="panel"><p className="eyebrow">Próximos atendimentos</p><h2>Sua agenda</h2><AppointmentList items={dashboard.upcoming} empty="Nenhum atendimento futuro está vinculado à sua conta."/></section><section className="panel"><p className="eyebrow">Últimos 90 dias</p><h2>Histórico recente</h2><AppointmentList items={dashboard.recent} empty="Nenhum atendimento recente foi encontrado."/></section></>}<p className="notice context-notice">Esta área exibe somente informações de agenda. Prontuário, prescrições e mensagens clínicas não estão disponíveis neste módulo.</p></section></main><SiteFooter/></>;
}

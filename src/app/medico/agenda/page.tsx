import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteFooter,SiteHeader} from '@/components/site/site-shell';
import {ScheduleWorkspace} from '@/components/scheduling/schedule-workspace';
import {currentSchedulingWindow,listSchedulingWorkspace} from '@/modules/scheduling/store';
import {requireSchedulingPage} from '@/server/auth/scheduling-access';
import {can} from '@/server/authorization';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Agenda | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default async function SchedulePage(){
  const {context,doctor}=await requireSchedulingPage('appointment.read');
  const range=currentSchedulingWindow();const workspace=await listSchedulingWorkspace(doctor,range.from,range.to);
  const resource={appointmentDoctorUserId:doctor.userId};
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Área operacional</span><h1>Agenda do Dr. Douglas Vaz.</h1><p>Disponibilidade, consultas e alterações persistidas com fuso de São Paulo, auditoria e proteção contra horários sobrepostos.</p><div className="form-actions"><Link className="button button-outline" href="/painel">Painel</Link><Link className="button button-outline" href="/conta">Minha conta</Link>{can(context.actor,'content.read')&&<Link className="button button-outline" href="/medico/conteudos">Conteúdos</Link>}</div></section><section className="container section schedule-container"><div className="notice context-notice"><strong>Acesso restrito.</strong> Cadastre somente informações necessárias e autorizadas pela operação da clínica.</div><ScheduleWorkspace workspace={workspace} canManageAvailability={can(context.actor,'availability.write',resource)} canManageAppointments={can(context.actor,'appointment.write',resource)} referenceNow={new Date().toISOString()}/></section></main><SiteFooter/></>;
}

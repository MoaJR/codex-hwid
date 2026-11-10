import type {Metadata} from 'next';
import {PageHeader} from '@/components/dashboard/page-header';
import {ScheduleWorkspace} from '@/components/scheduling/schedule-workspace';
import {AppointmentRequestsPanel} from '@/components/scheduling/appointment-requests-panel';
import {currentSchedulingWindow,listPendingRequests,listSchedulingWorkspace} from '@/modules/scheduling/store';
import {requireSchedulingPage} from '@/server/auth/scheduling-access';
import {can} from '@/server/authorization';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Agenda | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default async function SchedulePage(){
  const {context,doctor}=await requireSchedulingPage('appointment.read');
  const range=currentSchedulingWindow();const workspace=await listSchedulingWorkspace(doctor,range.from,range.to);
  const requests=await listPendingRequests(doctor);
  const resource={appointmentDoctorUserId:doctor.userId};
  return <>
    <PageHeader eyebrow="Atendimento" title="Agenda" description="Disponibilidade, consultas e alterações persistidas com fuso de São Paulo, auditoria e proteção contra horários sobrepostos."/>
    <div className="schedule-container app-stack">
      <div className="notice context-notice"><strong>Acesso restrito.</strong> Cadastre somente informações necessárias e autorizadas pela operação da clínica.</div>
      {can(context.actor,'appointment.write',resource)&&<AppointmentRequestsPanel requests={requests}/>}
      <ScheduleWorkspace workspace={workspace} canManageAvailability={can(context.actor,'availability.write',resource)} canManageAppointments={can(context.actor,'appointment.write',resource)} referenceNow={new Date().toISOString()}/>
    </div>
  </>;
}

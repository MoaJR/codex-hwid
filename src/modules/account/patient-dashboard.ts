import 'server-only';
import {getDb} from '@/server/db';

export type PatientAppointmentSummary={
  serviceLabel:string;
  mode:'IN_PERSON'|'ONLINE';
  status:'CONFIRMED'|'CANCELLED'|'COMPLETED'|'NO_SHOW';
  startsAt:string;
  endsAt:string;
  timeZone:string;
};

export type PatientDashboard={
  profileLinked:boolean;
  upcoming:PatientAppointmentSummary[];
  recent:PatientAppointmentSummary[];
};

function mapAppointment(item:{serviceLabel:string;mode:'IN_PERSON'|'ONLINE';status:'CONFIRMED'|'CANCELLED'|'COMPLETED'|'NO_SHOW';startsAt:Date;endsAt:Date;timeZone:string}):PatientAppointmentSummary{
  return {...item,startsAt:item.startsAt.toISOString(),endsAt:item.endsAt.toISOString()};
}

export async function getPatientDashboard(userId:string):Promise<PatientDashboard>{
  const db=getDb();
  const profiles=await db.$queryRaw<{linked:boolean}[]>`
    SELECT EXISTS(SELECT 1 FROM "Patient" WHERE "userId"=${userId}::uuid) AS "linked"
  `;
  if(!profiles[0]?.linked)return {profileLinked:false,upcoming:[],recent:[]};
  const [upcoming,recent]=await Promise.all([
    db.$queryRaw<Array<{serviceLabel:string;mode:'IN_PERSON'|'ONLINE';status:'CONFIRMED'|'CANCELLED'|'COMPLETED'|'NO_SHOW';startsAt:Date;endsAt:Date;timeZone:string}>>`
      SELECT appointment."serviceLabel",appointment."mode"::text AS "mode",appointment."status"::text AS "status",
             appointment."startsAt",appointment."endsAt",appointment."timeZone"
      FROM "Appointment" appointment
      INNER JOIN "Patient" patient ON patient."id"=appointment."patientId"
      WHERE patient."userId"=${userId}::uuid AND appointment."status"='CONFIRMED' AND appointment."endsAt">=CURRENT_TIMESTAMP
      ORDER BY appointment."startsAt" ASC,appointment."id" ASC
      LIMIT 10
    `,
    db.$queryRaw<Array<{serviceLabel:string;mode:'IN_PERSON'|'ONLINE';status:'CONFIRMED'|'CANCELLED'|'COMPLETED'|'NO_SHOW';startsAt:Date;endsAt:Date;timeZone:string}>>`
      SELECT appointment."serviceLabel",appointment."mode"::text AS "mode",appointment."status"::text AS "status",
             appointment."startsAt",appointment."endsAt",appointment."timeZone"
      FROM "Appointment" appointment
      INNER JOIN "Patient" patient ON patient."id"=appointment."patientId"
      WHERE patient."userId"=${userId}::uuid
        AND appointment."startsAt">=CURRENT_TIMESTAMP-INTERVAL '90 days'
        AND (appointment."status"<>'CONFIRMED' OR appointment."endsAt"<CURRENT_TIMESTAMP)
      ORDER BY appointment."startsAt" DESC,appointment."id" DESC
      LIMIT 20
    `,
  ]);
  return {profileLinked:true,upcoming:upcoming.map(mapAppointment),recent:recent.map(mapAppointment)};
}

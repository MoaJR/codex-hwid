import {pathToFileURL} from 'node:url';
import {PrismaClient} from '@prisma/client';

export const schedulingCheckNames=Object.freeze([
  'singleDoctor',
  'doctorTimeZone',
  'activeServiceCatalog',
  'appointmentBounds',
  'appointmentState',
  'doctorOverlap',
  'patientOverlap',
  'createdEventChain',
  'cancelledEventChain',
  'auditCoverage',
]);

/**
 * Turns aggregate database results into the only payload this command may print.
 * No identifier, name, e-mail, token or individual timestamp is accepted here.
 * @param {{doctors:number,expectedTimeZoneDoctors:number,activeServices:number,appointments:number,appointmentEvents:number,appointmentAudits:number,invalidBounds:number,invalidState:number,doctorOverlaps:number,patientOverlaps:number,invalidCreatedChains:number,invalidCancelledChains:number,invalidAuditChains:number}} aggregate
 */
export function evaluateSchedulingIntegrity(aggregate){
  const counts={
    doctors:aggregate.doctors,
    activeServices:aggregate.activeServices,
    appointments:aggregate.appointments,
    appointmentEvents:aggregate.appointmentEvents,
    appointmentAudits:aggregate.appointmentAudits,
  };
  const checks={
    singleDoctor:aggregate.doctors===1,
    doctorTimeZone:aggregate.doctors===1&&aggregate.expectedTimeZoneDoctors===1,
    activeServiceCatalog:aggregate.activeServices>=1,
    appointmentBounds:aggregate.invalidBounds===0,
    appointmentState:aggregate.invalidState===0,
    doctorOverlap:aggregate.doctorOverlaps===0,
    patientOverlap:aggregate.patientOverlaps===0,
    createdEventChain:aggregate.invalidCreatedChains===0,
    cancelledEventChain:aggregate.invalidCancelledChains===0,
    auditCoverage:aggregate.invalidAuditChains===0,
  };
  const failedChecks=schedulingCheckNames.filter(name=>checks[name]!==true);
  return {operation:'SCHEDULING_INTEGRITY_CHECK',status:failedChecks.length===0?'ready':'invalid',counts,checks,failedChecks};
}

/** @param {PrismaClient} db */
export async function readSchedulingIntegrity(db){
  return db.$transaction(async transaction=>{
    // Static utility statement with no user-controlled input.
    await transaction.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const [doctorRows,serviceRows,totalRows,eventRows,auditRows,boundsRows,stateRows,doctorOverlapRows,patientOverlapRows,createdRows,cancelledRows,auditCoverageRows]=await Promise.all([
      transaction.$queryRaw`
        SELECT COUNT(*)::int AS "doctors",
          COUNT(*) FILTER (WHERE "timeZone"='America/Sao_Paulo')::int AS "expectedTimeZoneDoctors"
        FROM "Doctor"
      `,
      transaction.$queryRaw`SELECT COUNT(*)::int AS "activeServices" FROM "AppointmentService" WHERE "active"=true`,
      transaction.$queryRaw`SELECT COUNT(*)::int AS "appointments" FROM "Appointment"`,
      transaction.$queryRaw`SELECT COUNT(*)::int AS "appointmentEvents" FROM "AppointmentEvent"`,
      transaction.$queryRaw`
        SELECT COUNT(*)::int AS "appointmentAudits" FROM "AuditEvent"
        WHERE "resourceType"='APPOINTMENT' AND "outcome"='SUCCESS'
      `,
      transaction.$queryRaw`
        SELECT COUNT(*)::int AS "invalidBounds" FROM "Appointment"
        WHERE "endsAt" IS DISTINCT FROM "startsAt"+("durationMinutes"*INTERVAL '1 minute')
          OR "blockedFrom" IS DISTINCT FROM "startsAt"-("bufferBeforeMinutes"*INTERVAL '1 minute')
          OR "blockedUntil" IS DISTINCT FROM "endsAt"+("bufferAfterMinutes"*INTERVAL '1 minute')
          OR "endsAt"<="startsAt" OR "blockedFrom">"startsAt" OR "blockedUntil"<"endsAt"
      `,
      transaction.$queryRaw`
        SELECT COUNT(*)::int AS "invalidState" FROM "Appointment"
        WHERE "version"<1 OR "durationMinutes"<1 OR "bufferBeforeMinutes"<0 OR "bufferAfterMinutes"<0
          OR ("status"='CANCELLED' AND "cancelledAt" IS NULL)
          OR ("status"<>'CANCELLED' AND "cancelledAt" IS NOT NULL)
      `,
      transaction.$queryRaw`
        SELECT COUNT(*)::int AS "doctorOverlaps" FROM "Appointment" first_appointment
        JOIN "Appointment" second_appointment
          ON first_appointment."id"::text<second_appointment."id"::text
         AND first_appointment."doctorId"=second_appointment."doctorId"
         AND first_appointment."status"<>'CANCELLED' AND second_appointment."status"<>'CANCELLED'
         AND tstzrange(first_appointment."blockedFrom",first_appointment."blockedUntil",'[)')
             && tstzrange(second_appointment."blockedFrom",second_appointment."blockedUntil",'[)')
      `,
      transaction.$queryRaw`
        SELECT COUNT(*)::int AS "patientOverlaps" FROM "Appointment" first_appointment
        JOIN "Appointment" second_appointment
          ON first_appointment."id"::text<second_appointment."id"::text
         AND first_appointment."patientId"=second_appointment."patientId"
         AND first_appointment."status"<>'CANCELLED' AND second_appointment."status"<>'CANCELLED'
         AND tstzrange(first_appointment."startsAt",first_appointment."endsAt",'[)')
             && tstzrange(second_appointment."startsAt",second_appointment."endsAt",'[)')
      `,
      transaction.$queryRaw`
        SELECT COUNT(*)::int AS "invalidCreatedChains" FROM "Appointment" appointment
        WHERE (SELECT COUNT(*) FROM "AppointmentEvent" event
          WHERE event."appointmentId"=appointment."id" AND event."type"='CREATED')<>1
      `,
      transaction.$queryRaw`
        SELECT COUNT(*)::int AS "invalidCancelledChains" FROM "Appointment" appointment
        WHERE CASE WHEN appointment."status"='CANCELLED' THEN
          (SELECT COUNT(*) FROM "AppointmentEvent" event
            WHERE event."appointmentId"=appointment."id" AND event."type"='CANCELLED'
              AND event."nextStatus"='CANCELLED')<>1
        ELSE
          (SELECT COUNT(*) FROM "AppointmentEvent" event
            WHERE event."appointmentId"=appointment."id" AND event."type"='CANCELLED')<>0
        END
      `,
      transaction.$queryRaw`
        WITH event_counts AS (
          SELECT event."appointmentId" AS "resourceId",
            CASE event."type"
              WHEN 'CREATED' THEN 'APPOINTMENT_CREATED'
              WHEN 'RESCHEDULED' THEN 'APPOINTMENT_RESCHEDULED'
              WHEN 'CANCELLED' THEN 'APPOINTMENT_CANCELLED'
              WHEN 'COMPLETED' THEN 'APPOINTMENT_COMPLETED'
              WHEN 'NO_SHOW' THEN 'APPOINTMENT_NO_SHOW'
            END AS "action",
            COUNT(*)::int AS "eventCount"
          FROM "AppointmentEvent" event
          GROUP BY event."appointmentId",event."type"
        ), audit_counts AS (
          SELECT audit."resourceId",audit."action",COUNT(*)::int AS "auditCount"
          FROM "AuditEvent" audit
          WHERE audit."resourceType"='APPOINTMENT' AND audit."outcome"='SUCCESS'
            AND audit."resourceId" IS NOT NULL
            AND audit."action" IN ('APPOINTMENT_CREATED','APPOINTMENT_RESCHEDULED','APPOINTMENT_CANCELLED','APPOINTMENT_COMPLETED','APPOINTMENT_NO_SHOW')
          GROUP BY audit."resourceId",audit."action"
        )
        SELECT COUNT(*)::int AS "invalidAuditChains"
        FROM event_counts event
        FULL OUTER JOIN audit_counts audit
          ON audit."resourceId"=event."resourceId" AND audit."action"=event."action"
        WHERE COALESCE(event."eventCount",0)<>COALESCE(audit."auditCount",0)
      `,
    ]);
    return {
      ...doctorRows[0],...serviceRows[0],...totalRows[0],...eventRows[0],...auditRows[0],
      ...boundsRows[0],...stateRows[0],...doctorOverlapRows[0],...patientOverlapRows[0],
      ...createdRows[0],...cancelledRows[0],...auditCoverageRows[0],
    };
  },{isolationLevel:'RepeatableRead'});
}

async function main(){
  const db=new PrismaClient({log:[],errorFormat:'minimal'});
  try{
    const report=evaluateSchedulingIntegrity(await readSchedulingIntegrity(db));
    console.log(JSON.stringify(report));
    if(report.status!=='ready')process.exitCode=1;
  }catch{
    console.error(JSON.stringify({operation:'SCHEDULING_INTEGRITY_CHECK',status:'unavailable'}));
    process.exitCode=1;
  }finally{await db.$disconnect();}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();

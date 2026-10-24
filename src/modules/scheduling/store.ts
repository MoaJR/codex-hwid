import 'server-only';
import {randomUUID} from 'node:crypto';
import {Prisma,type PrismaClient} from '@prisma/client';
import {getDb} from '@/server/db';
import type {SchedulingDoctor} from '@/server/auth/scheduling-access';
import {generateAvailableSlots,localSelectionToIso} from './availability.mjs';
import {evaluateAppointmentCreateIntent,SchedulingValidationError,validateAppointmentWindow} from './input.mjs';
import type {AppointmentMode,AppointmentStatus,ScheduleAppointment,ScheduleException,SchedulePatient,ScheduleRule,ScheduleService,SchedulingWorkspace} from './types';

type QueryClient=Prisma.TransactionClient|PrismaClient;

type ServiceRow=ScheduleService&{doctorId:string};
type RuleRow=Omit<ScheduleRule,'validFrom'|'validUntil'>&{validFrom:string|Date;validUntil:string|Date|null};
type ExceptionRow={id:string;kind:'AVAILABLE'|'BLOCKED';startsAt:Date;endsAt:Date};
type AppointmentRow={id:string;doctorId:string;patientId:string;patientUserId:string;patientName:string;serviceId:string;serviceLabel:string;mode:AppointmentMode;status:AppointmentStatus;startsAt:Date;endsAt:Date;durationMinutes:number;bufferBeforeMinutes:number;bufferAfterMinutes:number;timeZone:string;version:number;idempotencyKey:string};
type AppointmentReplayRow={id:string;doctorId:string;patientId:string;serviceId:string;createdStartsAt:Date};

export class SchedulingConflictError extends Error{
  constructor(message='O horário não está mais disponível.'){super(message);this.name='SchedulingConflictError';}
}
export class SchedulingNotFoundError extends Error{
  constructor(){super('Recurso não encontrado.');this.name='SchedulingNotFoundError';}
}

function dateString(value:string|Date){return typeof value==='string'?value.slice(0,10):value.toISOString().slice(0,10);}
function addDays(value:string,days:number){const date=new Date(`${value}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10);}
export function currentSchedulingWindow(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const read=(type:string)=>parts.find(part=>part.type===type)?.value;
  const from=`${read('year')}-${read('month')}-${read('day')}`;
  return {from,to:addDays(from,30)};
}
function minuteLabel(value:number){return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;}
function mapRule(row:RuleRow):ScheduleRule{return {...row,validFrom:dateString(row.validFrom),validUntil:row.validUntil?dateString(row.validUntil):null};}
function mapException(row:ExceptionRow):ScheduleException{return {...row,startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString()};}
function mapAppointment(row:AppointmentRow):ScheduleAppointment{return {id:row.id,patientId:row.patientId,patientName:row.patientName,serviceId:row.serviceId,serviceLabel:row.serviceLabel,mode:row.mode,status:row.status,startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),durationMinutes:row.durationMinutes,bufferBeforeMinutes:row.bufferBeforeMinutes,bufferAfterMinutes:row.bufferAfterMinutes,version:row.version};}

async function lockDoctor(transaction:Prisma.TransactionClient,doctorId:string){
  await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${doctorId},0))::text AS "lock"`;
}

async function services(client:QueryClient,doctorId:string,includeInactive=false){
  return client.$queryRaw<ServiceRow[]>(Prisma.sql`
    SELECT "id","doctorId","code","name","mode"::text AS "mode","durationMinutes","slotIntervalMinutes","bufferBeforeMinutes","bufferAfterMinutes","active"
    FROM "AppointmentService" WHERE "doctorId"=${doctorId}::uuid ${includeInactive?Prisma.empty:Prisma.sql`AND "active"=true`}
    ORDER BY "active" DESC,"name" ASC
  `);
}
async function rules(client:QueryClient,doctorId:string,includeInactive=false){
  return client.$queryRaw<RuleRow[]>(Prisma.sql`
    SELECT "id","weekday","startMinute","endMinute","validFrom"::text AS "validFrom","validUntil"::text AS "validUntil","active"
    FROM "AvailabilityRule" WHERE "doctorId"=${doctorId}::uuid ${includeInactive?Prisma.empty:Prisma.sql`AND "active"=true`}
    ORDER BY "weekday","startMinute","validFrom"
  `);
}
async function exceptions(client:QueryClient,doctorId:string,rangeStart:Date,rangeEnd:Date){
  return client.$queryRaw<ExceptionRow[]>`
    SELECT "id","kind"::text AS "kind","startsAt","endsAt"
    FROM "AvailabilityException"
    WHERE "doctorId"=${doctorId}::uuid AND "endsAt">${rangeStart} AND "startsAt"<${rangeEnd}
    ORDER BY "startsAt"
  `;
}
async function appointments(client:QueryClient,doctorId:string,rangeStart:Date,rangeEnd:Date,excludeId?:string){
  return client.$queryRaw<AppointmentRow[]>(Prisma.sql`
    SELECT a."id",a."doctorId",a."patientId",p."userId" AS "patientUserId",u."name" AS "patientName",a."serviceId",a."serviceLabel",
           a."mode"::text AS "mode",a."status"::text AS "status",a."startsAt",a."endsAt",a."durationMinutes",a."bufferBeforeMinutes",
           a."bufferAfterMinutes",a."timeZone",a."version",a."idempotencyKey"::text AS "idempotencyKey"
    FROM "Appointment" a JOIN "Patient" p ON p."id"=a."patientId" JOIN "User" u ON u."id"=p."userId"
    WHERE a."doctorId"=${doctorId}::uuid AND a."blockedUntil">${rangeStart} AND a."blockedFrom"<${rangeEnd}
      ${excludeId?Prisma.sql`AND a."id"<>${excludeId}::uuid`:Prisma.empty}
    ORDER BY a."startsAt",a."id"
  `);
}

export async function listSchedulingWorkspace(doctor:SchedulingDoctor,from:string,to:string):Promise<SchedulingWorkspace>{
  const rangeStart=new Date(localSelectionToIso(from,'00:00',doctor.timeZone));
  const rangeEnd=new Date(localSelectionToIso(addDays(to,1),'00:00',doctor.timeZone));
  const db=getDb();
  const [serviceRows,ruleRows,exceptionRows,patientRows,appointmentRows]=await Promise.all([
    services(db,doctor.id),rules(db,doctor.id),exceptions(db,doctor.id,rangeStart,rangeEnd),
    db.$queryRaw<SchedulePatient[]>`
      SELECT p."id",u."name" FROM "Patient" p JOIN "User" u ON u."id"=p."userId" ORDER BY u."name",p."id"
    `,
    appointments(db,doctor.id,rangeStart,rangeEnd),
  ]);
  return {doctor:{id:doctor.id,timeZone:doctor.timeZone},from,to,services:serviceRows,rules:ruleRows.map(mapRule),exceptions:exceptionRows.map(mapException),patients:patientRows,appointments:appointmentRows.map(mapAppointment)};
}

async function availabilityFor(client:QueryClient,doctor:SchedulingDoctor,service:ServiceRow,date:string,excludeId?:string){
  const rangeStart=new Date(localSelectionToIso(date,'00:00',doctor.timeZone));
  const rangeEnd=new Date(localSelectionToIso(addDays(date,1),'00:00',doctor.timeZone));
  const [ruleRows,exceptionRows,appointmentRows]=await Promise.all([
    rules(client,doctor.id),exceptions(client,doctor.id,rangeStart,rangeEnd),appointments(client,doctor.id,rangeStart,rangeEnd,excludeId),
  ]);
  return generateAvailableSlots({from:date,to:date,timeZone:doctor.timeZone,service,rules:ruleRows.map(row=>({...mapRule(row),validUntil:mapRule(row).validUntil})),exceptions:exceptionRows.map(mapException),appointments:appointmentRows});
}

function constraintConflict(error:unknown){
  if(!error||typeof error!=='object')return false;
  const value=error as {code?:unknown;meta?:{code?:unknown;message?:unknown}};
  return value.code==='P2002'||value.meta?.code==='23P01'||value.meta?.code==='23505'||(typeof value.meta?.message==='string'&&/exclusion|overlap|idempotency/i.test(value.meta.message));
}
async function findService(client:QueryClient,doctorId:string,serviceId:string){
  const rows=await client.$queryRaw<ServiceRow[]>`
    SELECT "id","doctorId","code","name","mode"::text AS "mode","durationMinutes","slotIntervalMinutes","bufferBeforeMinutes","bufferAfterMinutes","active"
    FROM "AppointmentService" WHERE "id"=${serviceId}::uuid AND "doctorId"=${doctorId}::uuid AND "active"=true LIMIT 1
  `;
  if(!rows[0])throw new SchedulingNotFoundError();return rows[0];
}
async function findAppointment(client:QueryClient,doctorId:string,id:string,forUpdate=false){
  const rows=await client.$queryRaw<AppointmentRow[]>(Prisma.sql`
    SELECT a."id",a."doctorId",a."patientId",p."userId" AS "patientUserId",u."name" AS "patientName",a."serviceId",a."serviceLabel",
           a."mode"::text AS "mode",a."status"::text AS "status",a."startsAt",a."endsAt",a."durationMinutes",a."bufferBeforeMinutes",
           a."bufferAfterMinutes",a."timeZone",a."version",a."idempotencyKey"::text AS "idempotencyKey"
    FROM "Appointment" a JOIN "Patient" p ON p."id"=a."patientId" JOIN "User" u ON u."id"=p."userId"
    WHERE a."id"=${id}::uuid AND a."doctorId"=${doctorId}::uuid ${forUpdate?Prisma.sql`FOR UPDATE`:Prisma.empty}
  `);
  if(!rows[0])throw new SchedulingNotFoundError();return rows[0];
}
async function audit(transaction:Prisma.TransactionClient,action:string,actorUserId:string,subjectUserId:string|null,resourceType:string,resourceId:string){
  await transaction.$executeRaw`
    INSERT INTO "AuditEvent" ("id","action","outcome","source","actorUserId","subjectUserId","resourceType","resourceId","occurredAt")
    VALUES (${randomUUID()}::uuid,${action},'SUCCESS','SCHEDULING_API',${actorUserId}::uuid,${subjectUserId}::uuid,${resourceType},${resourceId}::uuid,CURRENT_TIMESTAMP)
  `;
}
async function auditConflict(action:string,actorUserId:string,resourceId:string|null){
  try{await getDb().$executeRaw`
    INSERT INTO "AuditEvent" ("id","action","outcome","source","actorUserId","resourceType","resourceId","occurredAt")
    VALUES (${randomUUID()}::uuid,${action},'CONFLICT','SCHEDULING_API',${actorUserId}::uuid,'APPOINTMENT',${resourceId}::uuid,CURRENT_TIMESTAMP)
  `;}catch{/* A falha operacional original não deve ser mascarada pela telemetria. */}
}

export async function createAppointment(doctor:SchedulingDoctor,input:{patientId:string;serviceId:string;date:string;time:string},idempotencyKey:string,actorUserId:string){
  const startsAt=localSelectionToIso(input.date,input.time,doctor.timeZone);
  const db=getDb();
  try{
    const id=await db.$transaction(async transaction=>{
      await lockDoctor(transaction,doctor.id);
      const existing=await transaction.$queryRaw<AppointmentReplayRow[]>`
        SELECT appointment."id",appointment."doctorId",appointment."patientId",appointment."serviceId",
               created_event."nextStartsAt" AS "createdStartsAt"
        FROM "Appointment" appointment
        JOIN "AppointmentEvent" created_event
          ON created_event."appointmentId"=appointment."id" AND created_event."type"='CREATED'
        WHERE appointment."idempotencyKey"=${idempotencyKey}::uuid
        ORDER BY created_event."occurredAt",created_event."id" LIMIT 1
      `;
      const intent=evaluateAppointmentCreateIntent(existing[0],{doctorId:doctor.id,patientId:input.patientId,serviceId:input.serviceId,startsAt});
      if(intent.kind==='replay')return intent.appointmentId;
      if(intent.kind==='conflict')throw new SchedulingConflictError('A chave de repetição já foi usada em outra operação.');
      const service=await findService(transaction,doctor.id,input.serviceId);
      const patient=await transaction.$queryRaw<{id:string;userId:string}[]>`
        SELECT "id","userId" FROM "Patient" WHERE "id"=${input.patientId}::uuid LIMIT 1
      `;
      if(!patient[0])throw new SchedulingNotFoundError();
      const available=await availabilityFor(transaction,doctor,service,input.date);
      const selected=available.find(slot=>slot.startsAt===startsAt);
      if(!selected)throw new SchedulingConflictError();
      const appointmentId=randomUUID();
      const blockedFrom=new Date(new Date(selected.startsAt).getTime()-service.bufferBeforeMinutes*60000);
      const blockedUntil=new Date(new Date(selected.endsAt).getTime()+service.bufferAfterMinutes*60000);
      await transaction.$executeRaw`
        INSERT INTO "Appointment"
          ("id","doctorId","patientId","serviceId","idempotencyKey","serviceLabel","mode","status","startsAt","endsAt","durationMinutes","bufferBeforeMinutes","bufferAfterMinutes","blockedFrom","blockedUntil","timeZone","version","createdByUserId","createdAt","updatedAt")
        VALUES
          (${appointmentId}::uuid,${doctor.id}::uuid,${input.patientId}::uuid,${service.id}::uuid,${idempotencyKey}::uuid,${service.name},${service.mode}::"AppointmentMode",'CONFIRMED',${new Date(selected.startsAt)},${new Date(selected.endsAt)},${service.durationMinutes},${service.bufferBeforeMinutes},${service.bufferAfterMinutes},${blockedFrom},${blockedUntil},${doctor.timeZone},1,${actorUserId}::uuid,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      `;
      await transaction.$executeRaw`
        INSERT INTO "AppointmentEvent" ("id","appointmentId","type","actorUserId","nextStartsAt","nextEndsAt","nextStatus","occurredAt")
        VALUES (${randomUUID()}::uuid,${appointmentId}::uuid,'CREATED',${actorUserId}::uuid,${new Date(selected.startsAt)},${new Date(selected.endsAt)},'CONFIRMED',CURRENT_TIMESTAMP)
      `;
      await audit(transaction,'APPOINTMENT_CREATED',actorUserId,patient[0].userId,'APPOINTMENT',appointmentId);
      return appointmentId;
    },{isolationLevel:Prisma.TransactionIsolationLevel.ReadCommitted});
    return mapAppointment(await findAppointment(db,doctor.id,id));
  }catch(error){
    if(error instanceof SchedulingConflictError){await auditConflict('APPOINTMENT_CREATE_CONFLICT',actorUserId,null);throw error;}
    if(error instanceof SchedulingNotFoundError||error instanceof SchedulingValidationError)throw error;
    if(constraintConflict(error)){await auditConflict('APPOINTMENT_CREATE_CONFLICT',actorUserId,null);throw new SchedulingConflictError();}
    throw error;
  }
}

export async function rescheduleAppointment(doctor:SchedulingDoctor,id:string,input:{date:string;time:string;version:number},actorUserId:string){
  const nextStartsAt=localSelectionToIso(input.date,input.time,doctor.timeZone);
  validateAppointmentWindow(nextStartsAt);
  const db=getDb();
  try{
    await db.$transaction(async transaction=>{
      await lockDoctor(transaction,doctor.id);
      const current=await findAppointment(transaction,doctor.id,id,true);
      if(current.status!=='CONFIRMED')throw new SchedulingConflictError('A consulta não pode mais ser reagendada.');
      if(current.version!==input.version){if(current.version===input.version+1&&current.startsAt.toISOString()===nextStartsAt)return;throw new SchedulingConflictError('A consulta foi alterada. Atualize a página.');}
      const service=await findService(transaction,doctor.id,current.serviceId);
      const available=await availabilityFor(transaction,doctor,service,input.date,id);
      const selected=available.find(slot=>slot.startsAt===nextStartsAt);if(!selected)throw new SchedulingConflictError();
      const blockedFrom=new Date(new Date(selected.startsAt).getTime()-current.bufferBeforeMinutes*60000);
      const blockedUntil=new Date(new Date(selected.endsAt).getTime()+current.bufferAfterMinutes*60000);
      const changed=await transaction.$executeRaw`
        UPDATE "Appointment" SET "startsAt"=${new Date(selected.startsAt)},"endsAt"=${new Date(selected.endsAt)},"blockedFrom"=${blockedFrom},"blockedUntil"=${blockedUntil},"version"="version"+1,
          "updatedByUserId"=${actorUserId}::uuid,"updatedAt"=CURRENT_TIMESTAMP
        WHERE "id"=${id}::uuid AND "doctorId"=${doctor.id}::uuid AND "version"=${input.version} AND "status"='CONFIRMED'
      `;
      if(changed!==1)throw new SchedulingConflictError('A consulta foi alterada. Atualize a página.');
      await transaction.$executeRaw`
        INSERT INTO "AppointmentEvent" ("id","appointmentId","type","actorUserId","previousStartsAt","previousEndsAt","nextStartsAt","nextEndsAt","previousStatus","nextStatus","occurredAt")
        VALUES (${randomUUID()}::uuid,${id}::uuid,'RESCHEDULED',${actorUserId}::uuid,${current.startsAt},${current.endsAt},${new Date(selected.startsAt)},${new Date(selected.endsAt)},'CONFIRMED','CONFIRMED',CURRENT_TIMESTAMP)
      `;
      await audit(transaction,'APPOINTMENT_RESCHEDULED',actorUserId,current.patientUserId,'APPOINTMENT',id);
    },{isolationLevel:Prisma.TransactionIsolationLevel.ReadCommitted});
    return mapAppointment(await findAppointment(db,doctor.id,id));
  }catch(error){
    if(error instanceof SchedulingConflictError){await auditConflict('APPOINTMENT_RESCHEDULE_CONFLICT',actorUserId,id);throw error;}
    if(error instanceof SchedulingNotFoundError||error instanceof SchedulingValidationError)throw error;
    if(constraintConflict(error)){await auditConflict('APPOINTMENT_RESCHEDULE_CONFLICT',actorUserId,id);throw new SchedulingConflictError();}
    throw error;
  }
}

export async function cancelAppointment(doctor:SchedulingDoctor,id:string,version:number,actorUserId:string){
  const db=getDb();
  try{await db.$transaction(async transaction=>{
      await lockDoctor(transaction,doctor.id);
      const current=await findAppointment(transaction,doctor.id,id,true);
      if(current.status==='CANCELLED')return;
      if(current.status!=='CONFIRMED'||current.version!==version)throw new SchedulingConflictError('A consulta foi alterada. Atualize a página.');
      const changed=await transaction.$executeRaw`
        UPDATE "Appointment" SET "status"='CANCELLED',"cancelledAt"=CURRENT_TIMESTAMP,"cancelledByUserId"=${actorUserId}::uuid,
          "updatedByUserId"=${actorUserId}::uuid,"updatedAt"=CURRENT_TIMESTAMP,"version"="version"+1
        WHERE "id"=${id}::uuid AND "doctorId"=${doctor.id}::uuid AND "version"=${version} AND "status"='CONFIRMED'
      `;
      if(changed!==1)throw new SchedulingConflictError();
      await transaction.$executeRaw`
        INSERT INTO "AppointmentEvent" ("id","appointmentId","type","actorUserId","previousStartsAt","previousEndsAt","nextStartsAt","nextEndsAt","previousStatus","nextStatus","occurredAt")
        VALUES (${randomUUID()}::uuid,${id}::uuid,'CANCELLED',${actorUserId}::uuid,${current.startsAt},${current.endsAt},${current.startsAt},${current.endsAt},'CONFIRMED','CANCELLED',CURRENT_TIMESTAMP)
      `;
      await audit(transaction,'APPOINTMENT_CANCELLED',actorUserId,current.patientUserId,'APPOINTMENT',id);
    },{isolationLevel:Prisma.TransactionIsolationLevel.ReadCommitted});
  }catch(error){if(error instanceof SchedulingConflictError)await auditConflict('APPOINTMENT_CANCEL_CONFLICT',actorUserId,id);throw error;}
  return mapAppointment(await findAppointment(db,doctor.id,id));
}

export async function createAvailabilityRule(doctor:SchedulingDoctor,input:{weekday:number;startMinute:number;endMinute:number;validFrom:string;validUntil:string|null},actorUserId:string){
  const id=randomUUID();const db=getDb();
  await db.$transaction(async transaction=>{await lockDoctor(transaction,doctor.id);await transaction.$executeRaw`
    INSERT INTO "AvailabilityRule" ("id","doctorId","weekday","startMinute","endMinute","validFrom","validUntil","active","createdAt","updatedAt")
    VALUES (${id}::uuid,${doctor.id}::uuid,${input.weekday},${input.startMinute},${input.endMinute},${input.validFrom}::date,${input.validUntil}::date,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
  `;await audit(transaction,'AVAILABILITY_RULE_CREATED',actorUserId,null,'AVAILABILITY_RULE',id);});
  return {id,...input,startTime:minuteLabel(input.startMinute),endTime:minuteLabel(input.endMinute)};
}

export async function createAvailabilityException(doctor:SchedulingDoctor,input:{kind:'AVAILABLE'|'BLOCKED';date:string;startTime:string;endTime:string},actorUserId:string){
  const startsAt=new Date(localSelectionToIso(input.date,input.startTime,doctor.timeZone));const endsAt=new Date(localSelectionToIso(input.date,input.endTime,doctor.timeZone));
  const id=randomUUID();const db=getDb();
  await db.$transaction(async transaction=>{
    await lockDoctor(transaction,doctor.id);
    if(input.kind==='BLOCKED'){
      const conflicts=await transaction.$queryRaw<{id:string}[]>`
        SELECT "id" FROM "Appointment" WHERE "doctorId"=${doctor.id}::uuid AND "status"<>'CANCELLED'
          AND tstzrange("blockedFrom","blockedUntil",'[)') && tstzrange(${startsAt},${endsAt},'[)') LIMIT 1
      `;
      if(conflicts[0])throw new SchedulingConflictError('Há uma consulta confirmada nesse período.');
    }
    await transaction.$executeRaw`
      INSERT INTO "AvailabilityException" ("id","doctorId","kind","startsAt","endsAt","createdAt","updatedAt")
      VALUES (${id}::uuid,${doctor.id}::uuid,${input.kind}::"AvailabilityExceptionKind",${startsAt},${endsAt},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `;
    await audit(transaction,'AVAILABILITY_EXCEPTION_CREATED',actorUserId,null,'AVAILABILITY_EXCEPTION',id);
  });
  return {id,kind:input.kind,startsAt:startsAt.toISOString(),endsAt:endsAt.toISOString()};
}

export async function removeAvailability(doctor:SchedulingDoctor,id:string,kind:'rule'|'exception',actorUserId:string){
  const db=getDb();await db.$transaction(async transaction=>{
    await lockDoctor(transaction,doctor.id);
    const changed=kind==='rule'?await transaction.$executeRaw`
      UPDATE "AvailabilityRule" SET "active"=false,"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=${id}::uuid AND "doctorId"=${doctor.id}::uuid AND "active"=true
    `:await transaction.$executeRaw`
      DELETE FROM "AvailabilityException" WHERE "id"=${id}::uuid AND "doctorId"=${doctor.id}::uuid
    `;
    if(changed!==1)throw new SchedulingNotFoundError();
    await audit(transaction,kind==='rule'?'AVAILABILITY_RULE_DEACTIVATED':'AVAILABILITY_EXCEPTION_REMOVED',actorUserId,null,kind==='rule'?'AVAILABILITY_RULE':'AVAILABILITY_EXCEPTION',id);
  });
}

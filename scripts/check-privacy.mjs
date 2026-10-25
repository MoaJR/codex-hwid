import {pathToFileURL} from 'node:url';
import {PrismaClient} from '@prisma/client';

export const privacyCheckNames=Object.freeze([
  'retiredMoodEntries',
  'roleProfileConsistency',
  'appointmentEventCoverage',
  'appointmentAuditCoverage',
  'passwordCredentialConsistency',
]);

const localHosts=new Set(['localhost','127.0.0.1','::1','[::1]']);

/**
 * The inventory only runs against the local development database. Production
 * counts are never collected by this command, and the URL is never printed.
 * @param {string|undefined} value
 */
export function isLocalDatabaseUrl(value){
  if(typeof value!=='string'||!value.trim())return false;
  try{
    const url=new URL(value);
    if(url.protocol!=='postgres:'&&url.protocol!=='postgresql:')return false;
    return localHosts.has(url.hostname);
  }catch{return false;}
}

/**
 * Refusal happens before any client is created, so a missing or remote
 * DATABASE_URL cannot connect, read credentials or leak a provider message.
 * @param {Record<string,string|undefined>} environment
 */
export function privacyInventoryPrecheck(environment=process.env){
  const value=environment.DATABASE_URL?.trim();
  if(!value)return {operation:'PRIVACY_INVENTORY_CHECK',status:'not_configured',code:'DATABASE_URL_MISSING'};
  if(!isLocalDatabaseUrl(value))return {operation:'PRIVACY_INVENTORY_CHECK',status:'refused',code:'DATABASE_URL_NOT_LOCAL'};
  return null;
}

/**
 * Turns aggregate database results into the only payload this command may print.
 * Counts, whole-day ages and booleans are accepted; identity, contact, token,
 * resource identifier and individual timestamp are not.
 * @param {{users:number,patientRoles:number,doctorRoles:number,secretaryRoles:number,adminRoles:number,patientProfiles:number,doctorProfiles:number,careAssignments:number,accounts:number,passwordCredentials:number,sessions:number,activeSessions:number,appointments:number,confirmedAppointments:number,cancelledAppointments:number,completedAppointments:number,noShowAppointments:number,appointmentEvents:number,appointmentAudits:number,auditEvents:number,auditEventsLast90Days:number,publishedArticles:number,unpublishedArticles:number,moodEntries:number,twoFactorRecords:number,verificationRecords:number,providerRateLimits:number,apiRateLimits:number,oldestSessionDays:number,oldestAuditEventDays:number,oldestAppointmentDays:number,oldestRateLimitDays:number}} aggregate
 */
export function evaluatePrivacyInventory(aggregate){
  const counts={
    users:aggregate.users,
    patients:aggregate.patientRoles,
    doctors:aggregate.doctorRoles,
    secretaries:aggregate.secretaryRoles,
    admins:aggregate.adminRoles,
    patientProfiles:aggregate.patientProfiles,
    doctorProfiles:aggregate.doctorProfiles,
    careAssignments:aggregate.careAssignments,
    accounts:aggregate.accounts,
    passwordCredentials:aggregate.passwordCredentials,
    sessions:aggregate.sessions,
    activeSessions:aggregate.activeSessions,
    appointments:aggregate.appointments,
    confirmedAppointments:aggregate.confirmedAppointments,
    cancelledAppointments:aggregate.cancelledAppointments,
    completedAppointments:aggregate.completedAppointments,
    noShowAppointments:aggregate.noShowAppointments,
    appointmentEvents:aggregate.appointmentEvents,
    appointmentAudits:aggregate.appointmentAudits,
    auditEvents:aggregate.auditEvents,
    auditEventsLast90Days:aggregate.auditEventsLast90Days,
    publishedArticles:aggregate.publishedArticles,
    unpublishedArticles:aggregate.unpublishedArticles,
    moodEntries:aggregate.moodEntries,
    twoFactorRecords:aggregate.twoFactorRecords,
    verificationRecords:aggregate.verificationRecords,
    providerRateLimits:aggregate.providerRateLimits,
    apiRateLimits:aggregate.apiRateLimits,
  };
  const ages={
    oldestSessionDays:aggregate.oldestSessionDays,
    oldestAuditEventDays:aggregate.oldestAuditEventDays,
    oldestAppointmentDays:aggregate.oldestAppointmentDays,
    oldestRateLimitDays:aggregate.oldestRateLimitDays,
  };
  const checks={
    retiredMoodEntries:counts.moodEntries===0,
    roleProfileConsistency:counts.patients===counts.patientProfiles&&counts.doctors===counts.doctorProfiles,
    appointmentEventCoverage:counts.appointmentEvents>=counts.appointments,
    appointmentAuditCoverage:counts.appointmentAudits>=counts.appointments,
    passwordCredentialConsistency:counts.passwordCredentials<=counts.accounts,
  };
  const failedChecks=privacyCheckNames.filter(name=>checks[name]!==true);
  return {
    operation:'PRIVACY_INVENTORY_CHECK',
    status:failedChecks.length===0?'ready':'invalid',
    counts,ages,checks,failedChecks,
    note:'Somente contagens agregadas. Apoia as decisões D3, D5 e D6 de docs/PRIVACY.md; não substitui retenção, backup ou plano de incidentes definidos.',
  };
}

/** @param {PrismaClient} db */
export async function readPrivacyInventory(db){
  return db.$transaction(async transaction=>{
    // Static utility statement with no user-controlled input.
    await transaction.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const [identityRows,credentialRows,appointmentRows,auditRows,retiredRows,ageRows]=await Promise.all([
      transaction.$queryRaw`
        SELECT
          (SELECT COUNT(*) FROM "User")::int AS "users",
          (SELECT COUNT(*) FROM "UserRole" WHERE "role"='PATIENT')::int AS "patientRoles",
          (SELECT COUNT(*) FROM "UserRole" WHERE "role"='DOCTOR')::int AS "doctorRoles",
          (SELECT COUNT(*) FROM "UserRole" WHERE "role"='SECRETARY')::int AS "secretaryRoles",
          (SELECT COUNT(*) FROM "UserRole" WHERE "role"='ADMIN')::int AS "adminRoles",
          (SELECT COUNT(*) FROM "Patient")::int AS "patientProfiles",
          (SELECT COUNT(*) FROM "Doctor")::int AS "doctorProfiles",
          (SELECT COUNT(*) FROM "CareAssignment")::int AS "careAssignments"
      `,
      transaction.$queryRaw`
        SELECT
          (SELECT COUNT(*) FROM "Account")::int AS "accounts",
          (SELECT COUNT(*) FROM "Account" WHERE "password" IS NOT NULL)::int AS "passwordCredentials",
          (SELECT COUNT(*) FROM "Session")::int AS "sessions",
          (SELECT COUNT(*) FROM "Session" WHERE "expiresAt">CURRENT_TIMESTAMP)::int AS "activeSessions"
      `,
      transaction.$queryRaw`
        SELECT
          (SELECT COUNT(*) FROM "Appointment")::int AS "appointments",
          (SELECT COUNT(*) FROM "Appointment" WHERE "status"='CONFIRMED')::int AS "confirmedAppointments",
          (SELECT COUNT(*) FROM "Appointment" WHERE "status"='CANCELLED')::int AS "cancelledAppointments",
          (SELECT COUNT(*) FROM "Appointment" WHERE "status"='COMPLETED')::int AS "completedAppointments",
          (SELECT COUNT(*) FROM "Appointment" WHERE "status"='NO_SHOW')::int AS "noShowAppointments",
          (SELECT COUNT(*) FROM "AppointmentEvent")::int AS "appointmentEvents",
          (SELECT COUNT(*) FROM "AuditEvent" WHERE "resourceType"='APPOINTMENT' AND "outcome"='SUCCESS')::int AS "appointmentAudits"
      `,
      transaction.$queryRaw`
        SELECT
          (SELECT COUNT(*) FROM "AuditEvent")::int AS "auditEvents",
          (SELECT COUNT(*) FROM "AuditEvent" WHERE "occurredAt">=CURRENT_TIMESTAMP-INTERVAL '90 days')::int AS "auditEventsLast90Days",
          (SELECT COUNT(*) FROM "Article" WHERE "status"='PUBLISHED')::int AS "publishedArticles",
          (SELECT COUNT(*) FROM "Article" WHERE "status"<>'PUBLISHED')::int AS "unpublishedArticles"
      `,
      transaction.$queryRaw`
        SELECT
          (SELECT COUNT(*) FROM "MoodEntry")::int AS "moodEntries",
          (SELECT COUNT(*) FROM "TwoFactor")::int AS "twoFactorRecords",
          (SELECT COUNT(*) FROM "Verification")::int AS "verificationRecords",
          (SELECT COUNT(*) FROM "RateLimit")::int AS "providerRateLimits",
          (SELECT COUNT(*) FROM "ApiRateLimit")::int AS "apiRateLimits"
      `,
      transaction.$queryRaw`
        SELECT
          (SELECT COALESCE(FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP-MIN("createdAt")))/86400),0)::int FROM "Session") AS "oldestSessionDays",
          (SELECT COALESCE(FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP-MIN("occurredAt")))/86400),0)::int FROM "AuditEvent") AS "oldestAuditEventDays",
          (SELECT COALESCE(FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP-MIN("createdAt")))/86400),0)::int FROM "Appointment") AS "oldestAppointmentDays",
          (SELECT COALESCE(FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP-MIN("updatedAt")))/86400),0)::int FROM "ApiRateLimit") AS "oldestRateLimitDays"
      `,
    ]);
    return {
      ...identityRows[0],...credentialRows[0],...appointmentRows[0],
      ...auditRows[0],...retiredRows[0],...ageRows[0],
    };
  },{isolationLevel:'RepeatableRead'});
}

async function main(){
  const refusal=privacyInventoryPrecheck();
  if(refusal){console.log(JSON.stringify(refusal));process.exitCode=1;return;}
  const db=new PrismaClient({log:[],errorFormat:'minimal'});
  try{
    const report=evaluatePrivacyInventory(await readPrivacyInventory(db));
    console.log(JSON.stringify(report));
    if(report.status!=='ready')process.exitCode=1;
  }catch{
    // Provider errors may include hosts or credentials. Never print them.
    console.log(JSON.stringify({operation:'PRIVACY_INVENTORY_CHECK',status:'unavailable'}));
    process.exitCode=1;
  }finally{await db.$disconnect();}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  await main();
}


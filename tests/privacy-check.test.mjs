import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePrivacyInventory,isLocalDatabaseUrl,privacyCheckNames,privacyInventoryPrecheck} from '../scripts/check-privacy.mjs';

// Inventário de privacidade: o comando existe para apoiar as decisões D3, D5 e
// D6 sem expor dado pessoal. Estes testes fixam a saída somente agregada e a
// recusa de qualquer banco que não seja o local.
const healthy={
  users:4,patientRoles:1,doctorRoles:1,secretaryRoles:1,adminRoles:1,patientProfiles:1,doctorProfiles:1,careAssignments:0,
  accounts:4,passwordCredentials:4,sessions:15,activeSessions:15,
  appointments:7,confirmedAppointments:0,cancelledAppointments:7,completedAppointments:0,noShowAppointments:0,
  appointmentEvents:21,appointmentAudits:21,auditEvents:81,auditEventsLast90Days:81,
  publishedArticles:3,unpublishedArticles:1,
  moodEntries:0,twoFactorRecords:2,verificationRecords:4,providerRateLimits:1,apiRateLimits:2,
  oldestSessionDays:0,oldestAuditEventDays:0,oldestAppointmentDays:0,oldestRateLimitDays:0,
};

test('inventário publica apenas contagens, idades agregadas e booleanos',()=>{
  const report=evaluatePrivacyInventory(healthy);
  assert.equal(report.status,'ready');
  assert.equal(report.operation,'PRIVACY_INVENTORY_CHECK');
  assert.deepEqual(Object.keys(report.checks).sort(),[...privacyCheckNames].sort());
  assert.deepEqual(report.failedChecks,[]);
  assert.deepEqual(Object.keys(report.ages).sort(),['oldestAppointmentDays','oldestAuditEventDays','oldestRateLimitDays','oldestSessionDays'].sort());
  assert.equal(report.counts.users,4);
  assert.equal(report.counts.patients,1);
  assert(!/email|name|patientId|userId|doctorId|sessionId|token|startsAt|occurredAt/i.test(JSON.stringify(report)));
});

test('inventário falha fechado quando vínculo, cobertura ou modelo aposentado quebra',()=>{
  const broken=evaluatePrivacyInventory({
    ...healthy,
    moodEntries:1,
    patientRoles:2,
    doctorProfiles:0,
    appointmentEvents:1,
    appointmentAudits:0,
    passwordCredentials:5,
  });
  assert.equal(broken.status,'invalid');
  assert.deepEqual(broken.failedChecks,[...privacyCheckNames]);
});

test('inventário aceita somente banco local',()=>{
  for(const url of [
    'postgresql://postgres:postgres@127.0.0.1:5432/douglas_vaz_dev?schema=public',
    'postgres://postgres:postgres@localhost:5432/douglas_vaz_dev',
    'postgresql://postgres:postgres@[::1]:5432/douglas_vaz_dev',
  ])assert.equal(isLocalDatabaseUrl(url),true,url);
  for(const url of [
    'postgresql://user:secret@db.exemplo.com:5432/app',
    'postgresql://user:secret@10.0.0.5:5432/app',
    'mysql://user:secret@127.0.0.1:3306/app',
    'não é url',
    '',
    undefined,
  ])assert.equal(isLocalDatabaseUrl(url),false,String(url));
});

test('recusa acontece antes de qualquer conexão e nunca ecoa a URL',()=>{
  assert.equal(privacyInventoryPrecheck({DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:5432/douglas_vaz_dev'}),null);
  const missing=privacyInventoryPrecheck({});
  assert.deepEqual(missing,{operation:'PRIVACY_INVENTORY_CHECK',status:'not_configured',code:'DATABASE_URL_MISSING'});
  const remote=privacyInventoryPrecheck({DATABASE_URL:'postgresql://user:segredo@db.exemplo.com:5432/app'});
  assert.deepEqual(remote,{operation:'PRIVACY_INVENTORY_CHECK',status:'refused',code:'DATABASE_URL_NOT_LOCAL'});
  for(const report of [missing,remote]){
    const payload=JSON.stringify(report);
    assert.doesNotMatch(payload,/exemplo\.com|segredo|postgres:\/\//);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateSchedulingIntegrity,schedulingCheckNames} from '../scripts/check-scheduling.mjs';

const healthy={
  doctors:1,expectedTimeZoneDoctors:1,activeServices:4,appointments:1,appointmentEvents:3,appointmentAudits:3,
  invalidBounds:0,invalidState:0,doctorOverlaps:0,patientOverlaps:0,invalidCreatedChains:0,invalidCancelledChains:0,invalidAuditChains:0,
};

test('checker publica somente contagens agregadas, flags e nomes de checks',()=>{
  const report=evaluateSchedulingIntegrity(healthy);
  assert.equal(report.status,'ready');
  assert.deepEqual(Object.keys(report.counts).sort(),['activeServices','appointmentAudits','appointmentEvents','appointments','doctors'].sort());
  assert.deepEqual(Object.keys(report.checks).sort(),[...schedulingCheckNames].sort());
  assert.deepEqual(report.failedChecks,[]);
  assert(!/email|name|patientId|userId|doctorId|startsAt|token/i.test(JSON.stringify(report)));
});

test('checker falha fechado e identifica todas as invariantes quebradas',()=>{
  const broken=evaluateSchedulingIntegrity({...healthy,doctors:2,expectedTimeZoneDoctors:0,activeServices:0,invalidBounds:1,invalidState:1,doctorOverlaps:1,patientOverlaps:1,invalidCreatedChains:1,invalidCancelledChains:1,invalidAuditChains:1});
  assert.equal(broken.status,'invalid');
  assert.deepEqual(broken.failedChecks,[...schedulingCheckNames]);
});

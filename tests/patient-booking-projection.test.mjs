import test from 'node:test';
import assert from 'node:assert/strict';
import {PATIENT_BOOKING_LIMITS,projectPatientAppointment,projectPatientBooking,projectPatientRequest,projectPendingRequest,projectPendingRequests,projectRequestDecision} from '../src/modules/scheduling/patient-projection.mjs';

// Allowlist da área do paciente: nada de identidade de terceiros, chave de
// idempotência ou autoria. A fila da equipe pode ver o nome já visível na agenda.
const rawRequest={id:'r1',status:'PENDING',serviceLabel:'Consulta',mode:'ONLINE',startsAt:new Date('2026-12-01T12:00:00.000Z'),endsAt:new Date('2026-12-01T12:30:00.000Z'),expiresAt:new Date('2026-12-01T12:00:00.000Z'),version:1,patientId:'p1',doctorId:'d1',patientName:'Paciente Fictício',idempotencyKey:'chave-interna'};

test('solicitação do paciente projeta somente estado, serviço e horário',()=>{
  const projected=projectPatientRequest(rawRequest);
  assert.deepEqual(Object.keys(projected).sort(),['endsAt','expiresAt','id','mode','serviceLabel','startsAt','status','version']);
  assert.equal(projected.startsAt,'2026-12-01T12:00:00.000Z');
  assert.doesNotMatch(JSON.stringify(projected),/patientId|patientName|doctorId|idempotencyKey|chave-interna/i);
});

test('consulta do paciente projeta somente metadados de agenda',()=>{
  const projected=projectPatientAppointment({...rawRequest,status:'CONFIRMED',serviceLabel:'Consulta',mode:'IN_PERSON'});
  assert.deepEqual(Object.keys(projected).sort(),['endsAt','id','mode','serviceLabel','startsAt','status','version']);
  assert.doesNotMatch(JSON.stringify(projected),/patientId|patientName|idempotencyKey/i);
});

test('opções de agendamento aplicam teto de serviços e de horários',()=>{
  const slots=Array.from({length:PATIENT_BOOKING_LIMITS.slotsPerService+20},(_,index)=>({startsAt:`2026-12-01T${String(9+(index%8)).padStart(2,'0')}:00:00.000Z`,endsAt:'2026-12-01T12:30:00.000Z',date:'2026-12-01',time:'09:00',timeZone:'America/Sao_Paulo'}));
  const services=Array.from({length:PATIENT_BOOKING_LIMITS.services+3},(_,index)=>({id:`s${index}`,label:'Consulta',mode:'ONLINE',durationMinutes:30,slots}));
  const result=projectPatientBooking({services,requests:[rawRequest],appointments:[]});
  assert.equal(result.services.length,PATIENT_BOOKING_LIMITS.services);
  assert.equal(result.services[0].slots.length,PATIENT_BOOKING_LIMITS.slotsPerService);
  assert.deepEqual(Object.keys(result.services[0].slots[0]).sort(),['date','endsAt','startsAt','time','timeZone']);
  assert.equal(result.requests.length,1);
  assert.deepEqual(result.appointments,[]);
});

test('fila da equipe mantém o nome operacional e descarta identificadores',()=>{
  const row={...rawRequest,patientName:'Paciente Fictício'};
  assert.deepEqual(Object.keys(projectPendingRequest(row)).sort(),['endsAt','expiresAt','id','mode','patientName','serviceLabel','startsAt','status','version']);
  const queue=projectPendingRequests(Array.from({length:PATIENT_BOOKING_LIMITS.queue+5},()=>row));
  assert.equal(queue.length,PATIENT_BOOKING_LIMITS.queue);
  assert.doesNotMatch(JSON.stringify(queue),/patientId|doctorId|idempotencyKey|chave-interna/i);
});

test('resultado da decisão não vaza autoria nem identidade do paciente',()=>{
  const decision=projectRequestDecision({...rawRequest,status:'APPROVED',version:2},'a1');
  assert.deepEqual(Object.keys(decision.request).sort(),['id','serviceLabel','startsAt','status','version']);
  assert.equal(decision.appointmentId,'a1');
  assert.equal(projectRequestDecision(rawRequest,null).appointmentId,null);
  assert.doesNotMatch(JSON.stringify(decision),/patientId|patientName|decidedBy/i);
});

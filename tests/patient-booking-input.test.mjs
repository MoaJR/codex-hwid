import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePatientAppointmentRequest,validateRequestDecision,SchedulingValidationError} from '../src/modules/scheduling/input.mjs';

const serviceId='22222222-2222-4222-8222-222222222222';

test('solicitação do paciente aceita apenas serviço, data e hora',()=>{
  assert.deepEqual(validatePatientAppointmentRequest({serviceId,date:'2026-12-01',time:'09:30'}),{serviceId,date:'2026-12-01',time:'09:30'});
});

test('identidade enviada pelo cliente é recusada no corpo',()=>{
  for(const extra of [
    {patientId:'11111111-1111-4111-8111-111111111111'},
    {doctorId:'33333333-3333-4333-8333-333333333333'},
    {status:'CONFIRMED'},
    {durationMinutes:60},
    {mode:'ONLINE'},
  ])assert.throws(()=>validatePatientAppointmentRequest({serviceId,date:'2026-12-01',time:'09:30',...extra}),SchedulingValidationError);
});

test('serviço, data e hora são validados de forma estrita',()=>{
  for(const input of [
    {serviceId:'nao-e-uuid',date:'2026-12-01',time:'09:30'},
    {serviceId,date:'2026-13-01',time:'09:30'},
    {serviceId,date:'2026-12-01',time:'24:00'},
    {serviceId,date:'2026-12-01'},
    {serviceId},
  ])assert.throws(()=>validatePatientAppointmentRequest(input),SchedulingValidationError);
});

test('decisão e retirada usam apenas a versão otimista',()=>{
  assert.deepEqual(validateRequestDecision({version:3}),{version:3});
  for(const value of [{version:0},{version:1.5},{version:'3'},{version:1,extra:true},{}])assert.throws(()=>validateRequestDecision(value),SchedulingValidationError);
});

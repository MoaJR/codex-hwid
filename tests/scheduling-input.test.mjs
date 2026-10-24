import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAppointmentCreateIntent,validateAppointmentCreate,validateAvailabilityRule,validateScheduleRange,SchedulingValidationError} from '../src/modules/scheduling/input.mjs';

const patientId='11111111-1111-4111-8111-111111111111';
const serviceId='22222222-2222-4222-8222-222222222222';
test('entrada de consulta aceita apenas catálogo, paciente, data e hora',()=>{
  assert.deepEqual(validateAppointmentCreate({patientId,serviceId,date:'2026-10-26',time:'09:30'}),{patientId,serviceId,date:'2026-10-26',time:'09:30'});
  for(const input of [
    {patientId,serviceId,date:'2026-10-26',time:'09:30',status:'CONFIRMED'},
    {patientId,serviceId,date:'2026-02-30',time:'09:30'},
    {patientId,serviceId,date:'2026-10-26',time:'24:00'},
  ])assert.throws(()=>validateAppointmentCreate(input),SchedulingValidationError);
});
test('regra semanal converte horas e valida intervalo',()=>{
  assert.deepEqual(validateAvailabilityRule({weekday:1,startTime:'09:00',endTime:'12:30',validFrom:'2026-10-26',validUntil:''}),{weekday:1,startMinute:540,endMinute:750,validFrom:'2026-10-26',validUntil:null});
  assert.throws(()=>validateAvailabilityRule({weekday:1,startTime:'12:00',endTime:'09:00',validFrom:'2026-10-26',validUntil:null}),/início/);
});
test('consulta de agenda limita janela a 31 dias',()=>{
  assert.deepEqual(validateScheduleRange('2026-10-01','2026-10-31'),{from:'2026-10-01',to:'2026-10-31'});
  assert.throws(()=>validateScheduleRange('2026-10-01','2026-11-01'),/31 dias/);
});
test('replay idempotente precede a janela temporal e payload diferente conflita',()=>{
  const now=new Date('2026-10-24T12:00:00.000Z');
  const request={doctorId:'33333333-3333-4333-8333-333333333333',patientId,serviceId,startsAt:'2026-10-23T12:00:00.000Z'};
  const existing={id:'44444444-4444-4444-8444-444444444444',doctorId:request.doctorId,patientId,serviceId,createdStartsAt:new Date(request.startsAt),currentStartsAt:'2026-10-25T12:00:00.000Z'};
  assert.deepEqual(evaluateAppointmentCreateIntent(existing,request,now),{kind:'replay',appointmentId:existing.id});
  assert.deepEqual(evaluateAppointmentCreateIntent({...existing,patientId:'55555555-5555-4555-8555-555555555555'},request,now),{kind:'conflict'});
  assert.throws(()=>evaluateAppointmentCreateIntent(null,request,now),/horário futuro/);
  assert.deepEqual(evaluateAppointmentCreateIntent(null,{...request,startsAt:'2026-10-25T12:00:00.000Z'},now),{kind:'create'});
});

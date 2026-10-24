import test from 'node:test';
import assert from 'node:assert/strict';
import {AvailabilityValidationError,generateAvailableSlots,localSelectionToIso} from '../src/modules/scheduling/availability.mjs';

const mondayRule={weekday:1,startMinute:540,endMinute:720,validFrom:'2026-10-01',validUntil:null};
const hourly={durationMinutes:60,slotIntervalMinutes:60,bufferBeforeMinutes:0,bufferAfterMinutes:0};

test('gera horários UTC com rótulos em America/Sao_Paulo',()=>{
  const slots=generateAvailableSlots({from:'2026-10-26',to:'2026-10-26',service:hourly,rules:[mondayRule]});
  assert.deepEqual(slots.map(slot=>[slot.date,slot.time,slot.startsAt,slot.endsAt]),[
    ['2026-10-26','09:00','2026-10-26T12:00:00.000Z','2026-10-26T13:00:00.000Z'],
    ['2026-10-26','10:00','2026-10-26T13:00:00.000Z','2026-10-26T14:00:00.000Z'],
    ['2026-10-26','11:00','2026-10-26T14:00:00.000Z','2026-10-26T15:00:00.000Z'],
  ]);
  assert(slots.every(slot=>slot.timeZone==='America/Sao_Paulo'));
});

test('AVAILABLE abre um período e BLOCKED sempre vence',()=>{
  const slots=generateAvailableSlots({
    from:'2026-10-27',to:'2026-10-27',service:hourly,rules:[],
    exceptions:[
      {kind:'AVAILABLE',startsAt:'2026-10-27T16:00:00.000Z',endsAt:'2026-10-27T18:00:00.000Z'},
      {kind:'BLOCKED',startsAt:'2026-10-27T17:00:00.000Z',endsAt:'2026-10-27T18:00:00.000Z'},
    ],
  });
  assert.deepEqual(slots.map(slot=>slot.time),['13:00']);
});

test('buffers impedem sobreposição e também precisam caber na disponibilidade',()=>{
  const slots=generateAvailableSlots({
    from:'2026-10-26',to:'2026-10-26',
    service:{durationMinutes:30,slotIntervalMinutes:30,bufferBeforeMinutes:10,bufferAfterMinutes:10},
    rules:[mondayRule],
    appointments:[{startsAt:'2026-10-26T13:00:00.000Z',endsAt:'2026-10-26T13:30:00.000Z',bufferBeforeMinutes:15,bufferAfterMinutes:15,status:'CONFIRMED'}],
  });
  assert.deepEqual(slots.map(slot=>slot.time),['11:00']);
});

test('converte escolha local sem depender do fuso do servidor',()=>{
  assert.equal(localSelectionToIso('2026-10-26','09:30'),'2026-10-26T12:30:00.000Z');
  assert.throws(()=>localSelectionToIso('2026-10-26','24:00'),/Horário/);
});

test('intervalos contíguos são permitidos e consultas canceladas não ocupam horário',()=>{
  const occupied={startsAt:'2026-10-26T12:00:00.000Z',endsAt:'2026-10-26T13:00:00.000Z',status:'CONFIRMED'};
  const slots=generateAvailableSlots({from:'2026-10-26',to:'2026-10-26',service:hourly,rules:[mondayRule],appointments:[occupied]});
  assert.deepEqual(slots.map(slot=>slot.time),['10:00','11:00']);
  const withCancelled=generateAvailableSlots({from:'2026-10-26',to:'2026-10-26',service:hourly,rules:[mondayRule],appointments:[{...occupied,status:'CANCELLED'}]});
  assert.deepEqual(withCancelled.map(slot=>slot.time),['09:00','10:00','11:00']);
});

test('regras sobrepostas não duplicam slots e a saída é determinística',()=>{
  const input={from:'2026-10-26',to:'2026-10-26',service:hourly,rules:[mondayRule,{...mondayRule,startMinute:600,endMinute:780}]};
  const first=generateAvailableSlots(input);
  const second=generateAvailableSlots(input);
  assert.deepEqual(first,second);
  assert.deepEqual(first.map(slot=>slot.time),['09:00','10:00','11:00','12:00']);
});

test('rejeita períodos maiores que 31 dias e entradas fora do contrato',()=>{
  assert.throws(()=>generateAvailableSlots({from:'2026-10-01',to:'2026-11-01',service:hourly,rules:[]}),AvailabilityValidationError);
  assert.throws(()=>generateAvailableSlots({from:'2026-10-26',to:'2026-10-26',timeZone:'UTC',service:hourly,rules:[]}),/America\/Sao_Paulo/);
  assert.throws(()=>generateAvailableSlots({from:'2026-10-26',to:'2026-10-26',service:{...hourly,durationMinutes:0},rules:[]}),/Duração/);
  assert.throws(()=>generateAvailableSlots({from:'2026-10-26',to:'2026-10-26',service:hourly,rules:[{...mondayRule,startMinute:720,endMinute:540}]}),/Intervalo semanal/);
});

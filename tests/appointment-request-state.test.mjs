import test from 'node:test';
import assert from 'node:assert/strict';
import {canDecideRequest,canWithdrawRequest,effectiveRequestStatus,evaluateRequestReplay,isRequestExpired,nextRequestStatus,RequestStateError,REQUEST_STATUSES} from '../src/modules/scheduling/request-state.mjs';

const now=new Date('2026-11-10T12:00:00.000Z');
const pending={status:'PENDING',expiresAt:'2026-11-12T12:00:00.000Z'};
const expired={status:'PENDING',expiresAt:'2026-11-09T12:00:00.000Z'};

test('pendência expira no próprio horário e é reportada como EXPIRED',()=>{
  assert.equal(isRequestExpired(pending,now),false);
  assert.equal(effectiveRequestStatus(pending,now),'PENDING');
  assert.equal(isRequestExpired(expired,now),true);
  assert.equal(effectiveRequestStatus(expired,now),'EXPIRED');
  assert.equal(canDecideRequest(expired,now),false);
  assert.equal(canWithdrawRequest(expired,now),false);
  assert.equal(canDecideRequest(pending,now),true);
  assert.equal(canWithdrawRequest(pending,now),true);
});

test('estado decidido não volta a expirar',()=>{
  for(const status of ['APPROVED','REJECTED','WITHDRAWN'])assert.equal(isRequestExpired({status,expiresAt:'2020-01-01T00:00:00.000Z'},now),false);
  assert.equal(canDecideRequest({status:'APPROVED',expiresAt:pending.expiresAt},now),false);
});

test('estado inválido falha fechado',()=>{
  assert.throws(()=>effectiveRequestStatus({status:'QUALQUER',expiresAt:pending.expiresAt},now),RequestStateError);
  assert.equal(isRequestExpired(null,now),true);
  assert.deepEqual([...REQUEST_STATUSES],['PENDING','APPROVED','REJECTED','EXPIRED','WITHDRAWN']);
});

test('apenas PENDING aceita uma decisão',()=>{
  assert.equal(nextRequestStatus('PENDING','APPROVE'),'APPROVED');
  assert.equal(nextRequestStatus('PENDING','REJECT'),'REJECTED');
  assert.equal(nextRequestStatus('PENDING','WITHDRAW'),'WITHDRAWN');
  for(const status of ['APPROVED','REJECTED','EXPIRED','WITHDRAWN'])assert.throws(()=>nextRequestStatus(status,'APPROVE'),RequestStateError);
});

test('repetição idempotente só devolve a solicitação quando o pedido é idêntico',()=>{
  const request={patientId:'p1',serviceId:'s1',startsAt:'2026-12-01T12:00:00.000Z'};
  const existing={id:'r1',patientId:'p1',serviceId:'s1',startsAt:new Date('2026-12-01T12:00:00.000Z')};
  assert.deepEqual(evaluateRequestReplay(null,request),{kind:'create'});
  assert.deepEqual(evaluateRequestReplay(existing,request),{kind:'replay',requestId:'r1'});
  assert.deepEqual(evaluateRequestReplay({...existing,patientId:'p2'},request),{kind:'conflict'});
  assert.deepEqual(evaluateRequestReplay({...existing,serviceId:'s2'},request),{kind:'conflict'});
  assert.deepEqual(evaluateRequestReplay({...existing,startsAt:new Date('2026-12-01T13:00:00.000Z')},request),{kind:'conflict'});
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AccountRequestError,
  canChangeOwnPassword,
  readPasswordChangeRequest,
  validatePasswordChangeBody,
} from '../src/server/http/account-request.mjs';
import {disabledSessionApiPaths} from '../src/server/auth/configuration.mjs';

const configuredUrl='https://example.test';
const valid={currentPassword:'senha-atual-segura',newPassword:'nova-senha-segura',confirmPassword:'nova-senha-segura'};
function request(body=JSON.stringify(valid),headers={}){
  return new Request(`${configuredUrl}/api/account/password`,{
    method:'POST',headers:{origin:configuredUrl,'content-type':'application/json',...headers},body,
  });
}

test('troca de senha exige apenas sessão autenticada',()=>{
  assert.equal(canChangeOwnPassword({state:'anonymous'}),false);
  assert.equal(canChangeOwnPassword({state:'unavailable'}),false);
  assert.equal(canChangeOwnPassword(null),false);
  assert.equal(canChangeOwnPassword({state:'authenticated'}),true);
});

test('entrada de senha é estrita e nunca aceita campos de controle enviados pelo cliente',()=>{
  assert.deepEqual(validatePasswordChangeBody(valid),{currentPassword:valid.currentPassword,newPassword:valid.newPassword});
  for(const candidate of [
    {...valid,userId:'forged'},
    {...valid,revokeOtherSessions:false},
    {...valid,newPassword:'curta',confirmPassword:'curta'},
    {...valid,confirmPassword:'outra-senha-segura'},
    {...valid,newPassword:valid.currentPassword,confirmPassword:valid.currentPassword},
    null,
    [],
  ])assert.throws(()=>validatePasswordChangeBody(candidate),AccountRequestError);
});

test('pedido de troca aceita somente origem canônica, JSON e corpo pequeno',async()=>{
  assert.deepEqual(await readPasswordChangeRequest(request(),configuredUrl),{currentPassword:valid.currentPassword,newPassword:valid.newPassword});
  for(const candidate of [
    request(undefined,{origin:'https://evil.test'}),
    request(undefined,{'content-type':'text/plain'}),
    request('{'),
    request(JSON.stringify({...valid,newPassword:'x'.repeat(1100),confirmPassword:'x'.repeat(1100)})),
  ])await assert.rejects(()=>readPasswordChangeRequest(candidate,configuredUrl),AccountRequestError);
});

test('endpoint cru de troca de senha do provedor continua desabilitado',()=>{
  assert.equal(disabledSessionApiPaths.includes('/change-password'),true);
});

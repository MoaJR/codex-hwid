import test from 'node:test';
import assert from 'node:assert/strict';
import {canControlOwnSessions,readSessionControlRequest,AccountRequestError} from '../src/server/http/account-request.mjs';
import {disabledSessionApiPaths} from '../src/server/auth/configuration.mjs';

const configuredUrl='https://example.test';
function request(body='{}',headers={}){return new Request(`${configuredUrl}/api/account/sessions/revoke-others`,{method:'POST',headers:{origin:configuredUrl,'content-type':'application/json',...headers},body});}

test('controle de sessões exige login e MFA somente para equipe',()=>{
  assert.equal(canControlOwnSessions({state:'anonymous'}),false);
  assert.equal(canControlOwnSessions({state:'authenticated',staffMfaRequired:true,sessionMfaVerified:false}),false);
  assert.equal(canControlOwnSessions({state:'authenticated',staffMfaRequired:true,sessionMfaVerified:true}),true);
  assert.equal(canControlOwnSessions({state:'authenticated',staffMfaRequired:false,sessionMfaVerified:false}),true);
});

test('pedido de revogação aceita somente origem canônica e objeto vazio pequeno',async()=>{
  assert.deepEqual(await readSessionControlRequest(request(),configuredUrl),{});
  for(const candidate of [
    request('{}',{origin:'https://evil.test'}),
    request('{"sessionId":"forged"}'),
    request('{}',{'content-type':'text/plain'}),
    request(`{"padding":"${'x'.repeat(1100)}"}`),
  ])await assert.rejects(()=>readSessionControlRequest(candidate,configuredUrl),AccountRequestError);
});

test('endpoints crus de sessão do provedor permanecem desabilitados',()=>{
  assert.deepEqual([...disabledSessionApiPaths].sort(),['/change-password','/list-sessions','/revoke-other-sessions','/revoke-session','/revoke-sessions'].sort());
});

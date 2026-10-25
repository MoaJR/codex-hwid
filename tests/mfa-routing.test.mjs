import test from 'node:test';
import assert from 'node:assert/strict';
import {staffMfaRedirect} from '../src/server/auth/mfa-routing.mjs';

test('primeiro acesso da equipe segue para a ativação do MFA',()=>{
  assert.equal(staffMfaRedirect({staffMfaRequired:true,twoFactorEnabled:false,sessionMfaVerified:false}),'/conta');
});

test('equipe com MFA configurado confirma a sessão antes do painel',()=>{
  assert.equal(staffMfaRedirect({staffMfaRequired:true,twoFactorEnabled:true,sessionMfaVerified:false}),'/verificar-acesso');
  assert.equal(staffMfaRedirect({staffMfaRequired:true,twoFactorEnabled:true,sessionMfaVerified:true}),null);
});

test('paciente não recebe exigência de MFA da equipe',()=>{
  assert.equal(staffMfaRedirect({staffMfaRequired:false,twoFactorEnabled:false,sessionMfaVerified:false}),null);
});

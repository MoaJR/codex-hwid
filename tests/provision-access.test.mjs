import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProvisioningArguments,validateProvisioningEnvironment,validateProvisioningInput,validatePassword} from '../scripts/provision-access.mjs';

test('provisionamento exige dados explícitos e normaliza e-mail, nome e papel',()=>{
  const values=parseProvisioningArguments(['--email',' Douglas@Example.COM ','--name','  Dr.  Douglas Vaz ','--role','doctor','--confirm','PROVISIONAR']);
  assert.deepEqual(validateProvisioningInput(values),{email:'douglas@example.com',name:'Dr. Douglas Vaz',role:'DOCTOR'});
});

test('provisionamento rejeita opções desconhecidas, repetidas e confirmação ausente',()=>{
  assert.throws(()=>parseProvisioningArguments(['--password','segredo']),/não permitida/);
  assert.throws(()=>parseProvisioningArguments(['--email','a@example.com','--email','b@example.com']),/repetida/);
  assert.throws(()=>validateProvisioningInput({email:'a@example.com',name:'Nome',role:'DOCTOR'}),/Confirme/);
});

test('provisionamento aceita somente papéis conhecidos',()=>{
  assert.throws(()=>validateProvisioningInput({email:'a@example.com',name:'Nome',role:'OWNER',confirm:'PROVISIONAR'}),/papel/);
});

test('senha precisa respeitar tamanho e confirmação sem ser aceita por argumento',()=>{
  assert.throws(()=>validatePassword('curta','curta'),/12 e 128/);
  assert.throws(()=>validatePassword('uma-senha-bem-longa','outra-senha-bem-longa'),/não coincidem/);
  assert.doesNotThrow(()=>validatePassword('uma-senha-bem-longa','uma-senha-bem-longa'));
});

test('provisionamento só aceita configuração completa e origem segura',()=>{
  const valid={DATABASE_URL:'postgresql://placeholder',BETTER_AUTH_SECRET:'test-only-secret-that-is-longer-than-32-characters',BETTER_AUTH_URL:'https://drdouglasvaz.vercel.app'};
  assert.equal(validateProvisioningEnvironment(valid),'https://drdouglasvaz.vercel.app');
  assert.throws(()=>validateProvisioningEnvironment({...valid,DATABASE_URL:''}),/DATABASE_URL/);
  for(const url of ['http://example.com','https://user:secret@example.com','https://example.com/path','javascript:alert(1)']){
    assert.throws(()=>validateProvisioningEnvironment({...valid,BETTER_AUTH_URL:url}),/BETTER_AUTH_URL/);
  }
});

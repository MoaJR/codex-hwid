import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
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

test('papel adicional é aceito para conta existente sem nome nem senha',()=>{
  const values=parseProvisioningArguments(['--email',' Titular@Example.COM ','--add-role','admin','--confirm','PROVISIONAR']);
  assert.deepEqual(validateProvisioningInput(values),{email:'titular@example.com',role:'ADMIN',addRole:true});
});

test('--add-role não se combina com criação de conta nem aceita papel desconhecido',()=>{
  assert.throws(()=>validateProvisioningInput({email:'a@example.com',role:'DOCTOR','add-role':'ADMIN',confirm:'PROVISIONAR'}),/não pode ser combinado/);
  assert.throws(()=>validateProvisioningInput({email:'a@example.com',name:'Nome','add-role':'ADMIN',confirm:'PROVISIONAR'}),/não pode ser combinado/);
  assert.throws(()=>validateProvisioningInput({email:'a@example.com','add-role':'OWNER',confirm:'PROVISIONAR'}),/papel/);
  assert.throws(()=>validateProvisioningInput({email:'a@example.com','add-role':'ADMIN'}),/Confirme/);
});

test('concessão de papel não cria conta, não lê senha e grava auditoria',async()=>{
  const source=await readFile(new URL('../scripts/provision-access.mjs',import.meta.url),'utf8');
  const start=source.indexOf('export async function grantRole');
  const end=source.indexOf('async function provision(',start);
  assert.ok(start>0&&end>start,'grantRole precisa existir antes de provision()');
  const body=source.slice(start,end);
  assert.doesNotMatch(body,/signUpEmail/,'concessão não pode criar conta');
  assert.doesNotMatch(body,/readSecret/,'concessão não pode pedir senha');
  assert.doesNotMatch(body,/password/i,'concessão não manipula credencial');
  assert.match(body,/ACCOUNT_NOT_FOUND/,'conta inexistente precisa falhar de forma genérica');
  assert.match(body,/'ROLE_GRANTED'/);
  assert.match(body,/'TRUSTED_CLI'/);
  assert.match(body,/\$transaction/,'papel e auditoria precisam ser atômicos');
  const logLine=body.split('\n').find(line=>line.includes('console.log'))??'';
  assert.ok(logLine.length>0,'concessão precisa registrar o resultado');
  assert.doesNotMatch(logLine,/email|name/i,'saída não pode projetar e-mail ou nome');
});

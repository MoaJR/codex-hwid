import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {acquireCooldown,parseArguments,rotatePassword} from '../scripts/e2e-account.mjs';
import {buildSummary} from '../scripts/lib/local-e2e.mjs';

// O aceite de conta troca a senha de uma identidade local. Estes testes garantem
// alvo local, confirmação explícita, espera entre execuções e saída sem segredos.
const root=new URL('../',import.meta.url);
const scriptPath=fileURLToPath(new URL('scripts/e2e-account.mjs',root));

function runScript(args){
  return spawnSync(process.execPath,[scriptPath,...args],{encoding:'utf8',env:{PATH:process.env.PATH??''},timeout:20000});
}

test('aceite de conta está exposto no package.json',async()=>{
  const pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
  assert.equal(pkg.scripts['e2e:account'],'node scripts/e2e-account.mjs --confirm E2E');
});

test('aceite de conta recusa execução sem confirmação explícita',()=>{
  const result=runScript([]);
  assert.equal(result.status,1);
  const payload=JSON.parse(result.stdout.trim());
  assert.equal(payload.status,'refused');
  assert.equal(payload.reason,'E2E_CONFIRMATION_REQUIRED');
});

test('aceite de conta nunca aceita endereço externo',()=>{
  const result=runScript(['--confirm','E2E','--base-url','https://drdouglasvaz.vercel.app']);
  assert.equal(result.status,1);
  assert.equal(JSON.parse(result.stdout.trim()).reason,'E2E_BASE_URL_NOT_LOCAL');
});

test('aceite de conta respeita a janela de tentativas do servidor',async()=>{
  const now=Date.parse('2026-10-25T12:00:00.000Z');
  let written=null;
  await assert.rejects(
    acquireCooldown({now,readLock:async()=>new Date(now-5*60000).toISOString(),writeLock:async()=>{written='x';}}),
    /E2E_ACCOUNT_COOLDOWN/,
  );
  assert.equal(written,null,'não deve regravar o marcador quando está em espera');
  await acquireCooldown({now,readLock:async()=>new Date(now-20*60000).toISOString(),writeLock:async()=>{written='x';}});
  await acquireCooldown({now,readLock:async()=>null,writeLock:async()=>{written='y';}});
  assert.equal(written,'y');
  await acquireCooldown({now,readLock:async()=>'conteúdo inválido',writeLock:async()=>{written='z';}});
  assert.equal(written,'z','marcador ilegível não pode bloquear para sempre');
});

test('senha rotacionada é local, longa e diferente a cada chamada',()=>{
  const first=rotatePassword();
  const second=rotatePassword();
  assert.equal(first.length,20);
  assert.notEqual(first,second);
  assert.match(first,/^[A-Za-z0-9_-]+$/);
});

test('aceite de conta recusa argumentos desconhecidos',()=>{
  assert.deepEqual(parseArguments([]).confirm,null);
  assert.throws(()=>parseArguments(['--producao']),/E2E_ARGUMENT_UNKNOWN/);
});

test('resumo do aceite de conta não expõe identificadores nem credenciais',()=>{
  const summary=buildSummary('ACCOUNT_E2E',{twoLogins:true,passwordChanged:false},'CHECK_FAILED_passwordChanged');
  const serialized=JSON.stringify(summary);
  assert.equal(summary.operation,'ACCOUNT_E2E');
  assert.deepEqual(summary.failedChecks,['passwordChanged']);
  assert.doesNotMatch(serialized,/@local\.test|senha|password=|token|session/i);
});

test('aceite de conta não escreve configuração nem imprime credenciais',async()=>{
  const source=await readFile(new URL('scripts/e2e-account.mjs',root),'utf8');
  assert.doesNotMatch(source,/(?:^|\s)(?:>|>>)\s*\.env/m);
  assert.doesNotMatch(source,/console\.log\([^)]*(?:password|email|token)/i);
  assert.ok(source.includes("if(options.confirm!=='E2E')throw new Error('E2E_CONFIRMATION_REQUIRED');"));
  assert.ok(source.includes("summary.manualAction='ROTATE_LOCAL_PATIENT_PASSWORD'"),'falha precisa orientar a rotação manual');
});

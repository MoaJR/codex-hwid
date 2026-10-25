import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {assertLocalBaseUrl,buildSummary,parseAccounts} from '../scripts/lib/local-e2e.mjs';
import {parseArguments} from '../scripts/e2e-scheduling.mjs';

// O aceite da agenda pode ser automatizado, mas nunca deve alcançar Produção,
// imprimir credenciais ou deixar a agenda local suja depois da execução.
const root=new URL('../',import.meta.url);
const scriptPath=fileURLToPath(new URL('scripts/e2e-scheduling.mjs',root));

function runScript(args){
  return spawnSync(process.execPath,[scriptPath,...args],{encoding:'utf8',env:{PATH:process.env.PATH??''},timeout:20000});
}

test('aceite da agenda está exposto no package.json',async()=>{
  const pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
  assert.equal(pkg.scripts['e2e:scheduling'],'node scripts/e2e-scheduling.mjs --confirm E2E');
});

test('aceite da agenda só aceita servidor local',()=>{
  assert.equal(assertLocalBaseUrl('http://localhost:3000'),'http://localhost:3000');
  assert.equal(assertLocalBaseUrl('http://127.0.0.1:3000/'),'http://127.0.0.1:3000');
  for(const value of ['https://drdouglasvaz.vercel.app','http://example.com','http://localhost:3000/api','http://usuario:senha@localhost:3000','ftp://localhost:3000']){
    assert.throws(()=>assertLocalBaseUrl(value),undefined,value);
  }
});

test('aceite da agenda lê as identidades fictícias sem expor o arquivo',()=>{
  const accounts=parseAccounts([
    '# identidades fictícias',
    'medico@local.test|DOCTOR|senha-de-teste-1',
    '',
    'secretaria@local.test|secretary|senha-de-teste-2',
    'linha-invalida',
    'alguem@local.test|OUTRO|senha-de-teste-3',
  ].join('\n'));
  assert.deepEqual(Object.keys(accounts).sort(),['DOCTOR','SECRETARY']);
  assert.equal(accounts.DOCTOR.email,'medico@local.test');
  assert.equal(accounts.SECRETARY.password,'senha-de-teste-2');
});

test('resumo do aceite contém apenas booleanos e nomes de verificação',()=>{
  const checks={doctorLogin:true,appointmentCreated:false};
  const summary=buildSummary('SCHEDULING_E2E',checks,'CHECK_FAILED_appointmentCreated');
  assert.equal(summary.status,'failed');
  assert.deepEqual(summary.failedChecks,['appointmentCreated']);
  assert.equal(summary.failedStep,'CHECK_FAILED_appointmentCreated');
  assert.equal(buildSummary('SCHEDULING_E2E',{doctorLogin:true}).status,'ready');
  const serialized=JSON.stringify(summary);
  assert.doesNotMatch(serialized,/@local\.test|senha|password|token/i);
});

test('aceite da agenda recusa execução sem confirmação explícita',()=>{
  const result=runScript([]);
  assert.equal(result.status,1);
  const payload=JSON.parse(result.stdout.trim());
  assert.equal(payload.status,'refused');
  assert.equal(payload.reason,'E2E_CONFIRMATION_REQUIRED');
});

test('aceite da agenda recusa endereço que não seja local, mesmo com confirmação',()=>{
  const result=runScript(['--confirm','E2E','--base-url','https://drdouglasvaz.vercel.app']);
  assert.equal(result.status,1);
  const payload=JSON.parse(result.stdout.trim());
  assert.equal(payload.status,'refused');
  assert.equal(payload.reason,'E2E_BASE_URL_NOT_LOCAL');
});

test('aceite da agenda não aceita argumentos desconhecidos',()=>{
  assert.deepEqual(parseArguments([]).confirm,null);
  assert.throws(()=>parseArguments(['--producao']),/E2E_ARGUMENT_UNKNOWN/);
});

test('aceite da agenda não escreve configuração nem imprime credenciais',async()=>{
  const source=await readFile(new URL('scripts/e2e-scheduling.mjs',root),'utf8');
  assert.doesNotMatch(source,/(?:^|\s)(?:>|>>)\s*\.env/m);
  assert.doesNotMatch(source,/console\.log\([^)]*(?:password|email|token)/i);
  assert.ok(source.includes("if(options.confirm!=='E2E')throw new Error('E2E_CONFIRMATION_REQUIRED');"));
  assert.ok(source.includes('/api/medico/availability/${state.ruleId}?kind=rule'),'a regra criada pelo aceite precisa ser desativada');
});

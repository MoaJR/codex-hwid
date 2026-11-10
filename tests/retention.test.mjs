import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseRetentionArguments,retentionPolicy,retentionPrecheck,summarizeRetention} from '../scripts/apply-retention.mjs';

// Retenção aprovada em 10/11/2026 (D3). O comando só apaga com confirmação
// explícita, nunca fora do banco local e nunca imprime identidade ou horário.
const root=new URL('../',import.meta.url);

test('política de retenção registra os prazos aprovados',()=>{
  assert.match(retentionPolicy.auditEvent,/5 anos/);
  assert.match(retentionPolicy.appointment,/20 anos/);
  assert.match(retentionPolicy.session,/expiração própria/);
  assert.equal(Object.keys(retentionPolicy).length,6);
});

test('retenção só roda no banco local e falha fechado sem configuração',()=>{
  assert.equal(retentionPrecheck({DATABASE_URL:'postgresql://postgres:postgres@127.0.0.1:5432/douglas_vaz_dev'}),null);
  assert.deepEqual(retentionPrecheck({}),{operation:'RETENTION_APPLY',status:'not_configured',code:'DATABASE_URL_MISSING'});
  assert.deepEqual(
    retentionPrecheck({DATABASE_URL:'postgresql://user:segredo@db.exemplo.com:5432/app'}),
    {operation:'RETENTION_APPLY',status:'refused',code:'DATABASE_URL_NOT_LOCAL'},
  );
});

test('sem confirmação explícita o comando é apenas relatório',()=>{
  assert.equal(parseRetentionArguments([]).mode,'dry-run');
  assert.equal(parseRetentionArguments(['--confirm','OUTRA_COISA']).mode,'dry-run');
  assert.equal(parseRetentionArguments(['--confirm','RETENCAO']).mode,'apply');
  assert.throws(()=>parseRetentionArguments(['--force']),/RETENTION_ARGUMENT_UNKNOWN/);
});

test('resumo do expurgo publica apenas contagens agregadas',()=>{
  const report=summarizeRetention({
    mode:'apply',
    expired:{apiRateLimit:0,providerRateLimit:0,session:15,verification:4,auditEvent:0,appointment:0},
    deleted:{apiRateLimit:0,providerRateLimit:0,session:15,verification:4},
  });
  assert.equal(report.operation,'RETENTION_APPLY');
  assert.equal(report.mode,'apply');
  assert.equal(report.deleted.session,15);
  assert.equal(report.policy.appointment,retentionPolicy.appointment);
  assert.doesNotMatch(JSON.stringify(report),/email|userId|sessionId|token|occurredAt|startsAt/i);
});

test('retenção não escreve configuração nem imprime identificador',async()=>{
  const source=await readFile(new URL('scripts/apply-retention.mjs',root),'utf8');
  assert.doesNotMatch(source,/(?:^|\s)(?:>|>>)\s*\.env/m);
  assert.match(source,/import \{isLocalDatabaseUrl\} from '\.\/check-privacy\.mjs'/, 'precisa reutilizar a guarda de banco local');
  assert.match(source,/for\(let index=0;index<args\.length;index\+\+\)/,'precisa validar os argumentos');
});

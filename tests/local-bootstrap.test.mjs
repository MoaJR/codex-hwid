import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// O bootstrap local é o único atalho autorizado a mexer no banco de desenvolvimento.
// Estes testes impedem que ele perca as proteções: alvo local obrigatório, falha
// fechada, nenhuma escrita em .env.local e nenhum provisionamento automático.
const root=new URL('../',import.meta.url);
const script=()=>readFile(new URL('scripts/local-bootstrap.sh',root),'utf8');

test('bootstrap está exposto no package.json como comando único',async()=>{
  const pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
  assert.equal(pkg.scripts['local:bootstrap'],'bash scripts/local-bootstrap.sh');
});

test('bootstrap aborta quando o DATABASE_URL não é o PostgreSQL local',async()=>{
  const source=await script();
  assert.ok(source.includes('["127.0.0.1","localhost","::1","[::1]"]'));
  assert.ok(source.includes('if(!checks.every(([,pass])=>pass))process.exit(1);'));
  assert.ok(source.includes('Ajuste o .env.local conforme docs/LOCAL_DEVELOPMENT.md'));
  assert.match(source,/DATABASE_URL aponta para o PostgreSQL local/);
});

test('bootstrap nunca escreve em .env.local nem cria contas sozinho',async()=>{
  const source=await script();
  assert.doesNotMatch(source,/(?:^|\s)(?:>|>>)\s*\.env\.local/m);
  assert.doesNotMatch(source,/cp\s+[^\n]*\.env\.local/);
  const provisioningLines=source.split('\n').filter(line=>line.includes('auth:provision'));
  assert.ok(provisioningLines.length>0,'o script deve orientar o provisionamento manual');
  for(const line of provisioningLines)assert.match(line.trim(),/^printf /,'provisionamento só pode ser impresso, nunca executado');
});

test('bootstrap exige exatamente um médico antes de semear a agenda',async()=>{
  const source=await script();
  assert.match(source,/Existem \$doctors médicos/);
  assert.match(source,/Nenhum médico provisionado/);
  assert.ok(source.indexOf('db:seed:scheduling')>source.indexOf('Verificando identidades fictícias'));
});

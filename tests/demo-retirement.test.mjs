import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';

const retiredPaths=['index.html','public/demonstracao.html','src/components/booking/booking-flow.tsx','src/components/booking/selection.mjs'];

test('superfícies públicas de demonstração foram removidas',async()=>{
  for(const path of retiredPaths){
    await assert.rejects(access(new URL(`../${path}`,import.meta.url)));
  }
});

test('navegação pública e login apontam para o painel real',async()=>{
  const [shell,loginForm,schedule]=await Promise.all([
    readFile(new URL('../src/components/site/site-shell.tsx',import.meta.url),'utf8'),
    readFile(new URL('../src/components/auth/login-form.tsx',import.meta.url),'utf8'),
    readFile(new URL('../src/app/agendar/page.tsx',import.meta.url),'utf8'),
  ]);
  assert.match(shell,/href="\/painel"/);
  assert.match(loginForm,/router\.push\('\/painel'\)/);
  assert.match(schedule,/href="\/painel"/);
  for(const source of [shell,loginForm,schedule])assert.doesNotMatch(source,/\/demonstracao(?:\.html)?/i);
});

test('migration converte apenas o conteúdo legado e registra auditoria',async()=>{
  const sql=await readFile(new URL('../prisma/migrations/20261025050000_remove_demo_content/migration.sql',import.meta.url),'utf8');
  assert.match(sql,/Conteúdo de demonstração/);
  assert.match(sql,/Conteúdo educativo/);
  assert.match(sql,/DEMONSTRATION_CONTENT_RETIRED/);
  assert.match(sql,/"version" = article\."version" \+ 1/);
  assert.doesNotMatch(sql,/\bDELETE\b/i);
});

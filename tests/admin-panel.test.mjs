import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Guarda do painel administrativo. A tela é somente leitura e precisa continuar
// restrita ao domínio editorial: nada de agenda, paciente ou prontuário.
// Indicadores, totais e escopos têm de vir do servidor (consulta + política),
// nunca de constante escrita à mão, e a estrutura precisa seguir acessível.
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('painel administrativo exige settings.manage e consulta apenas conteúdo editorial',async()=>{
  const source=await read('src/app/painel/administracao/page.tsx');
  assert.match(source,/await requirePermissionPage\('settings\.manage'\);/);
  assert.match(source,/listEditorialArticles\(\)/);
  assert.doesNotMatch(source,/from '@\/server\/db'/);
  assert.doesNotMatch(source,/getPatientDashboard|listSchedulingWorkspace|createAppointment|medical_record|patientId/);
});

test('contagens, papéis e escopos vêm do servidor, não de constantes fixas',async()=>{
  const source=await read('src/app/painel/administracao/page.tsx');
  assert.match(source,/for\(const article of articles\)counts\[article\.status\]\+\+/,'as contagens precisam sair da consulta');
  assert.match(source,/const total=articles\.length/,'o total precisa vir da coleção consultada');
  assert.match(source,/labelsForRoles\(context\.actor\.roles\)/,'os papéis exibidos vêm da sessão');
  assert.match(source,/can\(actor,'content\.write'\)/,'o escopo de edição vem da política');
  assert.doesNotMatch(source,/<dd>\d+<\/dd>/,'nenhum indicador pode ser número fixo');
  assert.doesNotMatch(source,/'use client'/,'o painel é renderizado no servidor');
});

test('administração não herda agenda: a checagem clínica avalia só o papel ADMIN',async()=>{
  const source=await read('src/app/painel/administracao/page.tsx');
  assert.match(source,/can\(\{userId:actor\.userId,roles:\['ADMIN'\]\},'appointment\.read'/,'a herança é negada avaliando apenas ADMIN');
  assert.match(source,/'Não concedida'/,'a negação precisa de rótulo textual, não só cor');
  assert.match(source,/'Permitido'/);
});

test('cada conteúdo exibe estado, categoria, versão e data no fuso da clínica',async()=>{
  const source=await read('src/app/painel/administracao/page.tsx');
  assert.match(source,/timeZone:'America\/Sao_Paulo'/, 'as datas precisam usar o fuso da clínica');
  assert.match(source,/status-\$\{article\.status\.toLowerCase\(\)\}/);
  assert.match(source,/versão \{article\.version\}/);
  assert.match(source,/article\.category/);
});

test('painel administrativo mantém um único h1, disclosure acessível e regiões nomeadas',async()=>{
  const source=await read('src/app/painel/administracao/page.tsx');
  assert.equal((source.match(/<h1[ >]/g)??[]).length,0,'o h1 vem do PageHeader, sem duplicar');
  assert.equal((source.match(/<PageHeader /g)??[]).length,1,'a página declara um único PageHeader (h1)');
  assert.match(source,/<details className="admin-disclosure">/);
  assert.match(source,/<summary>Ver todos os \{total\} conteúdos<\/summary>/);
  assert.match(source,/aria-hidden="true"/,'setas e barra decorativas ficam ocultas de leitores de tela');
  for(const id of ['admin-overview','admin-flow','admin-scope','admin-content','admin-limits']){
    assert.match(source,new RegExp(`aria-labelledby="${id}-title"`),`${id} precisa de região nomeada`);
  }
});

test('o CSS do painel preserva alvo de toque, recuo de lista e piso tipográfico',async()=>{
  const css=await read('src/app/globals.css');
  assert.match(css,/\.admin-disclosure summary\{[^}]*min-height:44px/,'o disclosure precisa de alvo de 44px');
  assert.match(css,/\.panel \.admin-legend\{padding-left:0/,'a legenda não pode herdar o recuo do painel');
  assert.match(css,/\.panel \.admin-scope-list\{padding-left:0/,'a lista de escopos não pode herdar o recuo do painel');
  assert.match(css,/\.admin-panel \.admin-note\{[^}]*font-size:var\(--text-2xs\)/,'o aviso fica no piso de 12px');
  assert.match(css,/@media\(max-width:420px\)\{/,'o painel precisa de ajuste para viewport estreita');
});

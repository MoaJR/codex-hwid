import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {labelsForRoles,modulesForRoles,navigationForRoles,profileForRoles,profileLabelForRoles} from '../src/modules/account/panel-access.mjs';

function moduleIds(roles){return modulesForRoles(roles).map(module=>module.id);}
function navIds(roles){return navigationForRoles(roles).flatMap(group=>group.items.map(item=>item.id));}

test('painel apresenta somente os módulos autorizados para cada papel',()=>{
  assert.deepEqual(moduleIds(['PATIENT']),['overview','patient','account']);
  assert.deepEqual(moduleIds(['DOCTOR']),['overview','schedule','content','account']);
  assert.deepEqual(moduleIds(['SECRETARY']),['overview','schedule','account']);
  assert.deepEqual(moduleIds(['ADMIN']),['overview','content','admin','account']);
});

test('contas com múltiplos papéis recebem a união sem módulos duplicados',()=>{
  assert.deepEqual(moduleIds(['DOCTOR','ADMIN','ADMIN']),['overview','schedule','content','admin','account']);
  assert.deepEqual(labelsForRoles(['DOCTOR','ADMIN','DOCTOR']),['Médico','Administrador']);
});

test('papéis ausentes ou desconhecidos não liberam módulos',()=>{
  assert.deepEqual(moduleIds(undefined),[]);
  assert.deepEqual(moduleIds(['UNKNOWN']),[]);
  assert.deepEqual(navigationForRoles(['UNKNOWN']),[]);
  assert.deepEqual(labelsForRoles(['UNKNOWN']),[]);
  assert.equal(profileForRoles(['UNKNOWN']),null);
  assert.equal(profileLabelForRoles(undefined),null);
});

test('menu lateral do titular unifica médico e administrador em um único menu',()=>{
  assert.deepEqual(navIds(['DOCTOR','ADMIN']),['overview','schedule','content','admin','account']);
  assert.deepEqual(navigationForRoles(['DOCTOR','ADMIN']).map(group=>group.label),['Geral','Atendimento','Site','Gestão','Conta']);
  assert.equal(new Set(navIds(['DOCTOR','ADMIN'])).size,navIds(['DOCTOR','ADMIN']).length);
});

test('menu lateral nega por padrão: secretaria e paciente não veem conteúdos nem administração',()=>{
  assert.deepEqual(navIds(['SECRETARY']),['overview','schedule','account']);
  assert.deepEqual(navIds(['PATIENT']),['overview','patient','account']);
  for(const roles of [['SECRETARY'],['PATIENT']]){
    assert.ok(!navIds(roles).includes('content'));
    assert.ok(!navIds(roles).includes('admin'));
  }
  assert.ok(!navIds(['PATIENT']).includes('schedule'));
});

test('ADMIN sozinho não recebe agenda por herança no menu',()=>{
  assert.ok(!navIds(['ADMIN']).includes('schedule'));
});

test('três perfis de produto: titular, secretaria e paciente',()=>{
  assert.equal(profileForRoles(['DOCTOR','ADMIN']),'OWNER');
  assert.equal(profileForRoles(['ADMIN']),'OWNER');
  assert.equal(profileForRoles(['SECRETARY']),'SECRETARY');
  assert.equal(profileForRoles(['PATIENT']),'PATIENT');
  assert.equal(profileLabelForRoles(['DOCTOR','ADMIN']),'Médico e administrador');
});

test('itens do menu não expõem a lista de papéis e usam apenas rotas do painel',()=>{
  for(const group of navigationForRoles(['PATIENT','DOCTOR','SECRETARY','ADMIN'])){
    for(const item of group.items){
      assert.equal('roles' in item,false);
      assert.match(item.href,/^\/painel(\/|$)/);
    }
  }
});

test('rotas antigas redirecionam para o painel unificado',async()=>{
  const config=(await import('../next.config.mjs')).default;
  const redirects=await config.redirects();
  const map=new Map(redirects.map(item=>[item.source,item]));
  const expected={'/admin':'/painel/administracao','/conta':'/painel/conta','/paciente':'/painel/acompanhamento','/medico/agenda':'/painel/agenda','/medico/conteudos':'/painel/conteudos','/medico/conteudos/novo':'/painel/conteudos/novo','/medico/conteudos/:id':'/painel/conteudos/:id'};
  for(const [source,destination] of Object.entries(expected)){
    assert.equal(map.get(source)?.destination,destination,source);
    assert.equal(map.get(source)?.permanent,true,source);
  }
});

test('layout do painel exige sessão e o menu não substitui os guards das páginas',async()=>{
  const layout=await readFile(new URL('../src/app/painel/layout.tsx',import.meta.url),'utf8');
  assert.match(layout,/redirect\('\/login'\)/);
  assert.match(layout,/getSessionContext\(\)/);
});

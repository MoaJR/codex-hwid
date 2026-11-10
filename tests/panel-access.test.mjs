import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {labelsForRoles,mobileNavigationForRoles,modulesForRoles,navigationForRoles,profileForRoles,profileLabelForRoles,sectionForPath} from '../src/modules/account/panel-access.mjs';

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

test('navegação inferior do mobile usa no máximo três destinos já autorizados',()=>{
  assert.deepEqual(mobileNavigationForRoles(['PATIENT']).items.map(item=>item.id),['overview','patient','account']);
  assert.equal(mobileNavigationForRoles(['PATIENT']).hasMore,false);
  assert.deepEqual(mobileNavigationForRoles(['SECRETARY']).items.map(item=>item.id),['overview','schedule','account']);
  assert.equal(mobileNavigationForRoles(['SECRETARY']).hasMore,false);
  assert.deepEqual(mobileNavigationForRoles(['DOCTOR']).items.map(item=>item.id),['overview','schedule','content']);
  assert.equal(mobileNavigationForRoles(['DOCTOR']).hasMore,true);

  for(const roles of [['PATIENT'],['SECRETARY'],['DOCTOR'],['DOCTOR','ADMIN'],['ADMIN']]){
    const {items}=mobileNavigationForRoles(roles);
    assert.ok(items.length<=3,`${roles} excede a barra inferior`);
    const authorized=new Set(navIds(roles));
    for(const item of items) assert.ok(authorized.has(item.id),`${item.id} não está autorizado para ${roles}`);
    assert.equal(new Set(items.map(item=>item.id)).size,items.length);
    // Rótulo curto é do produto, não permissão; sempre presente para caber no mobile.
    for(const item of items) assert.equal(typeof item.shortTitle,'string');
  }
});

test('navegação inferior não promove administração nem agenda a quem não tem a permissão',()=>{
  for(const roles of [['PATIENT'],['SECRETARY'],['DOCTOR'],['ADMIN'],['DOCTOR','ADMIN']]){
    const ids=mobileNavigationForRoles(roles).items.map(item=>item.id);
    assert.ok(!ids.includes('admin'),`${roles} não pode ter administração na barra inferior`);
    if(!roles.includes('DOCTOR')&&!roles.includes('SECRETARY')) assert.ok(!ids.includes('schedule'),`${roles} não pode ter agenda na barra inferior`);
    if(roles.includes('PATIENT')) assert.ok(!ids.includes('schedule'));
  }
  assert.deepEqual(mobileNavigationForRoles(undefined),{items:[],hasMore:false});
});

test('seção atual do cabeçalho acompanha rota exata e rotas aninhadas',()=>{
  const navigation=navigationForRoles(['DOCTOR','ADMIN']);
  assert.equal(sectionForPath(navigation,'/painel')?.id,'overview');
  assert.equal(sectionForPath(navigation,'/painel/agenda')?.id,'schedule');
  assert.equal(sectionForPath(navigation,'/painel/conteudos/abc-123')?.id,'content');
  assert.equal(sectionForPath(navigation,'/painel/conteudos/novo')?.id,'content');
  assert.equal(sectionForPath(navigation,'/painel/desconhecido'),null);
  assert.equal(sectionForPath(navigation,'/'),null);
  assert.equal(sectionForPath(undefined,'/painel'),null);
  assert.equal(sectionForPath(navigation,undefined),null);
});


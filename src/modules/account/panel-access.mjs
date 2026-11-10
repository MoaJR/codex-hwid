// `shortTitle` existe só para a navegação inferior do mobile: o rótulo curto
// cabe com 44px de alvo e não substitui o título completo em links, cartões ou
// leitores de tela.
const moduleDefinitions=Object.freeze([
  Object.freeze({id:'overview',title:'Visão geral',shortTitle:'Início',description:'Resumo da sua conta e acesso rápido aos módulos liberados.',href:'/painel',roles:Object.freeze(['PATIENT','DOCTOR','SECRETARY','ADMIN']),icon:'home',group:'Geral'}),
  Object.freeze({id:'patient',title:'Meu acompanhamento',shortTitle:'Acompanhar',description:'Consulte seus próximos atendimentos, solicite horários e acompanhe o histórico recente.',href:'/painel/acompanhamento',roles:Object.freeze(['PATIENT']),icon:'heart',group:'Atendimento'}),
  Object.freeze({id:'schedule',title:'Agenda',shortTitle:'Agenda',description:'Consultas, disponibilidade e solicitações de horário dos pacientes.',href:'/painel/agenda',roles:Object.freeze(['DOCTOR','SECRETARY']),icon:'calendar',group:'Atendimento'}),
  Object.freeze({id:'content',title:'Conteúdos',shortTitle:'Conteúdos',description:'Prepare, revise e publique os conteúdos educativos do site.',href:'/painel/conteudos',roles:Object.freeze(['DOCTOR','ADMIN']),icon:'article',group:'Site'}),
  Object.freeze({id:'admin',title:'Administração',shortTitle:'Administração',description:'Indicadores editoriais e alcances da conta.',href:'/painel/administracao',roles:Object.freeze(['ADMIN']),icon:'settings',group:'Gestão'}),
  Object.freeze({id:'account',title:'Minha conta',shortTitle:'Conta',description:'Gerencie senha e sessões conectadas.',href:'/painel/conta',roles:Object.freeze(['PATIENT','DOCTOR','SECRETARY','ADMIN']),icon:'user',group:'Conta'}),
]);

const roleNames=new Map([['PATIENT','Paciente'],['DOCTOR','Médico'],['SECRETARY','Secretaria'],['ADMIN','Administrador']]);
const groupOrder=Object.freeze(['Geral','Atendimento','Site','Gestão','Conta']);

/** @param {unknown} roles */
export function modulesForRoles(roles){
  if(!Array.isArray(roles))return [];
  const assigned=new Set(roles.filter(role=>typeof role==='string'));
  return moduleDefinitions.filter(module=>module.roles.some(role=>assigned.has(role))).map(({roles:_,...module})=>module);
}

/**
 * Menu lateral agrupado. Deriva dos mesmos módulos do painel, portanto herda a
 * união de papéis sem duplicatas. É apenas apresentação: cada rota de destino
 * mantém o próprio guard server-side.
 * @param {unknown} roles
 */
export function navigationForRoles(roles){
  const modules=modulesForRoles(roles);
  return groupOrder.flatMap(label=>{
    const items=modules.filter(module=>module.group===label).map(({id,title,href,icon})=>({id,title,href,icon}));
    return items.length>0?[{label,items}]:[];
  });
}

// Destinos frequentes da barra inferior. `admin` fica fora de propósito: o
// titular já alcança a Administração pelo menu, e a barra nunca deve sugerir
// permissão que o perfil não tem.
const mobilePriority=Object.freeze(['overview','schedule','content','patient','account']);
const MOBILE_MAX_DESTINATIONS=3;

/**
 * Navegação inferior do mobile: até três destinos prioritários e um sinal
 * (`hasMore`) para o botão “Mais”, que abre a gaveta com o menu completo.
 * Deriva dos mesmos módulos autorizados; é apresentação, não autorização.
 * @param {unknown} roles
 */
export function mobileNavigationForRoles(roles){
  const modules=modulesForRoles(roles);
  const items=mobilePriority
    .flatMap(id=>{
      const module=modules.find(entry=>entry.id===id);
      return module?[{id:module.id,title:module.title,shortTitle:module.shortTitle,href:module.href,icon:module.icon}]:[];
    })
    .slice(0,MOBILE_MAX_DESTINATIONS);
  const shown=new Set(items.map(item=>item.id));
  return {items,hasMore:modules.some(module=>!shown.has(module.id))};
}

/**
 * Item de navegação correspondente ao caminho atual. Rota exata vence; em rotas
 * aninhadas (`/painel/conteudos/:id`) vence o prefixo mais específico. `/painel`
 * só casa exato para não marcar a visão geral em todas as páginas.
 * @param {unknown} navigation
 * @param {unknown} pathname
 */
export function sectionForPath(navigation,pathname){
  if(!Array.isArray(navigation)||typeof pathname!=='string'||!pathname.startsWith('/'))return null;
  const items=navigation.flatMap(group=>Array.isArray(group?.items)?group.items:[]).filter(item=>item&&typeof item.href==='string');
  const exact=items.find(item=>item.href===pathname);
  if(exact)return exact;
  const nested=items
    .filter(item=>item.href!=='/painel'&&pathname.startsWith(`${item.href}/`))
    .sort((a,b)=>b.href.length-a.href.length);
  return nested[0]??null;
}

/** @param {unknown} roles */
export function labelsForRoles(roles){
  if(!Array.isArray(roles))return [];
  return [...new Set(roles)].flatMap(role=>typeof role==='string'&&roleNames.has(role)?[roleNames.get(role)]:[]).filter(label=>typeof label==='string');
}

/**
 * Perfil de produto (3 perfis): o titular acumula DOCTOR e ADMIN e aparece como
 * um único perfil. Não concede nada: as permissões continuam vindo dos papéis.
 * @param {unknown} roles
 * @returns {'OWNER'|'SECRETARY'|'PATIENT'|null}
 */
export function profileForRoles(roles){
  if(!Array.isArray(roles))return null;
  if(roles.includes('DOCTOR')||roles.includes('ADMIN'))return 'OWNER';
  if(roles.includes('SECRETARY'))return 'SECRETARY';
  if(roles.includes('PATIENT'))return 'PATIENT';
  return null;
}

const profileNames=Object.freeze({OWNER:'Médico e administrador',SECRETARY:'Secretaria',PATIENT:'Paciente'});

/** @param {unknown} roles */
export function profileLabelForRoles(roles){
  const profile=profileForRoles(roles);
  return profile?profileNames[profile]:null;
}

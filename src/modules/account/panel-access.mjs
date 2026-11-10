const moduleDefinitions=Object.freeze([
  Object.freeze({id:'overview',title:'Visão geral',description:'Resumo da sua conta e acesso rápido aos módulos liberados.',href:'/painel',roles:Object.freeze(['PATIENT','DOCTOR','SECRETARY','ADMIN']),icon:'home',group:'Geral'}),
  Object.freeze({id:'patient',title:'Meu acompanhamento',description:'Consulte seus próximos atendimentos, solicite horários e acompanhe o histórico recente.',href:'/painel/acompanhamento',roles:Object.freeze(['PATIENT']),icon:'heart',group:'Atendimento'}),
  Object.freeze({id:'schedule',title:'Agenda',description:'Consultas, disponibilidade e solicitações de horário dos pacientes.',href:'/painel/agenda',roles:Object.freeze(['DOCTOR','SECRETARY']),icon:'calendar',group:'Atendimento'}),
  Object.freeze({id:'content',title:'Conteúdos',description:'Prepare, revise e publique os conteúdos educativos do site.',href:'/painel/conteudos',roles:Object.freeze(['DOCTOR','ADMIN']),icon:'article',group:'Site'}),
  Object.freeze({id:'admin',title:'Administração',description:'Indicadores editoriais e alcances da conta.',href:'/painel/administracao',roles:Object.freeze(['ADMIN']),icon:'settings',group:'Gestão'}),
  Object.freeze({id:'account',title:'Minha conta',description:'Gerencie senha e sessões conectadas.',href:'/painel/conta',roles:Object.freeze(['PATIENT','DOCTOR','SECRETARY','ADMIN']),icon:'user',group:'Conta'}),
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

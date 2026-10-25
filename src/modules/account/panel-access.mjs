const moduleDefinitions=Object.freeze([
  Object.freeze({id:'patient',title:'Meu acompanhamento',description:'Consulte seus próximos atendimentos e o histórico recente.',href:'/paciente',roles:Object.freeze(['PATIENT']),symbol:'♡'}),
  Object.freeze({id:'schedule',title:'Agenda',description:'Gerencie consultas e disponibilidade autorizadas para a clínica.',href:'/medico/agenda',roles:Object.freeze(['DOCTOR','SECRETARY']),symbol:'◷'}),
  Object.freeze({id:'content',title:'Conteúdos',description:'Prepare e revise os conteúdos educativos do site.',href:'/medico/conteudos',roles:Object.freeze(['DOCTOR','ADMIN']),symbol:'◇'}),
  Object.freeze({id:'admin',title:'Administração',description:'Acompanhe os módulos administrativos liberados para sua conta.',href:'/admin',roles:Object.freeze(['ADMIN']),symbol:'⚙'}),
  Object.freeze({id:'account',title:'Minha conta',description:'Gerencie MFA, senha e sessões conectadas.',href:'/conta',roles:Object.freeze(['PATIENT','DOCTOR','SECRETARY','ADMIN']),symbol:'♧'}),
]);

const roleNames=new Map([['PATIENT','Paciente'],['DOCTOR','Médico'],['SECRETARY','Secretaria'],['ADMIN','Administrador']]);

/** @param {unknown} roles */
export function modulesForRoles(roles){
  if(!Array.isArray(roles))return [];
  const assigned=new Set(roles.filter(role=>typeof role==='string'));
  return moduleDefinitions.filter(module=>module.roles.some(role=>assigned.has(role))).map(({roles:_,...module})=>module);
}

/** @param {unknown} roles */
export function labelsForRoles(roles){
  if(!Array.isArray(roles))return [];
  return [...new Set(roles)].flatMap(role=>typeof role==='string'&&roleNames.has(role)?[roleNames.get(role)]:[]).filter(label=>typeof label==='string');
}

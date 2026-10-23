export const appointmentTypes = [
  {id:'first',label:'Primeira consulta',description:'Um primeiro espaço para conversar sobre sua história.'},
  {id:'follow-up',label:'Retorno',description:'Continuidade do acompanhamento e revisão do cuidado.'},
  {id:'online',label:'Consulta online',description:'Conversa por vídeo, mediante confirmação da equipe.'},
];
export const demoTimes = ['09:00','11:00','14:00','16:00'];
/** Dates illustrate the interface, never real availability. @param {Date} now */
export function getDemoDates(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part = (/** @type {string} */ name) => parts.find(p=>p.type===name)?.value;
  const cursor = new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`);
  /** @type {string[]} */ const dates=[];
  while(dates.length<8){cursor.setUTCDate(cursor.getUTCDate()+1);if(![0,6].includes(cursor.getUTCDay())) dates.push(cursor.toISOString().slice(0,10));}
  return dates;
}
/** @param {{type:string,date:string,time:string}} selection @param {string[]} dates */
export function validateSelection(selection,dates){
  if(!appointmentTypes.some(t=>t.id===selection.type))return 'Escolha o tipo de atendimento.';
  if(!dates.includes(selection.date))return 'Escolha uma das datas ilustrativas disponíveis.';
  if(!demoTimes.includes(selection.time))return 'Escolha um horário ilustrativo.';
  return null;
}
/** @param {string} date */
export function formatDemoDate(date){return new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'short',timeZone:'America/Sao_Paulo'}).format(new Date(`${date}T12:00:00Z`));}

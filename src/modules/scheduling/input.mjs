export class SchedulingValidationError extends Error{
  constructor(message='Dados de agenda inválidos.'){super(message);this.name='SchedulingValidationError';}
}

const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
const timePattern=/^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** @param {any} value */
function record(value){if(!value||typeof value!=='object'||Array.isArray(value))throw new SchedulingValidationError();return value;}
/** @param {Record<string,any>} value @param {string[]} allowed */
function exactKeys(value,allowed){for(const key of Object.keys(value))if(!allowed.includes(key))throw new SchedulingValidationError(`Campo não permitido: ${key}.`);}
/** @param {any} value @param {string} label */
function uuid(value,label){if(typeof value!=='string'||!uuidPattern.test(value))throw new SchedulingValidationError(`${label} inválido.`);return value;}
/** @param {any} value @param {string} [label] */
function date(value,label='Data'){
  if(typeof value!=='string'||!datePattern.test(value))throw new SchedulingValidationError(`${label} inválida.`);
  const [year,month,day]=value.split('-').map(Number);const parsed=new Date(Date.UTC(year,month-1,day));
  if(parsed.getUTCFullYear()!==year||parsed.getUTCMonth()!==month-1||parsed.getUTCDate()!==day)throw new SchedulingValidationError(`${label} inválida.`);
  return value;
}
/** @param {any} value @param {string} [label] */
function time(value,label='Horário'){if(typeof value!=='string'||!timePattern.test(value))throw new SchedulingValidationError(`${label} inválido.`);return value;}
/** @param {string} value */
function minute(value){const [hour,minutes]=value.split(':').map(Number);return hour*60+minutes;}
/** @param {any} value */
function version(value){if(!Number.isInteger(value)||value<1)throw new SchedulingValidationError('Versão inválida.');return value;}

/** @param {any} value */
export function validateIdempotencyKey(value){return uuid(value,'Chave de idempotência');}

/**
 * Decide whether an appointment creation is a new operation or a replay.
 * The replay check intentionally precedes the scheduling-window check: a
 * client may safely repeat a completed request after its original slot has
 * passed and must still receive the original appointment.
 * @param {{id:string,doctorId:string,patientId:string,serviceId:string,createdStartsAt:string|Date}|null|undefined} existing
 * @param {{doctorId:string,patientId:string,serviceId:string,startsAt:string}} request
 * @param {Date} [now]
 * @returns {{kind:'replay',appointmentId:string}|{kind:'conflict'}|{kind:'create'}}
 */
export function evaluateAppointmentCreateIntent(existing,request,now=new Date()){
  if(existing){
    const existingStartsAt=existing.createdStartsAt instanceof Date?existing.createdStartsAt.toISOString():existing.createdStartsAt;
    const matches=existing.doctorId===request.doctorId&&existing.patientId===request.patientId&&existing.serviceId===request.serviceId&&existingStartsAt===request.startsAt;
    return matches?{kind:'replay',appointmentId:existing.id}:{kind:'conflict'};
  }
  validateAppointmentWindow(request.startsAt,now);
  return {kind:'create'};
}

/** @param {string} startsAt @param {Date} [now] */
export function validateAppointmentWindow(startsAt,now=new Date()){
  const start=new Date(startsAt).getTime();
  if(!Number.isFinite(start)||start<=now.getTime())throw new SchedulingValidationError('Escolha um horário futuro.');
  if(start>now.getTime()+90*86400000)throw new SchedulingValidationError('A consulta deve ocorrer nos próximos 90 dias.');
}

/** @param {any} value */
export function validateAppointmentCreate(value){
  const input=record(value);exactKeys(input,['patientId','serviceId','date','time']);
  return {patientId:uuid(input.patientId,'Paciente'),serviceId:uuid(input.serviceId,'Serviço'),date:date(input.date),time:time(input.time)};
}

/** @param {any} value */
export function validateAppointmentReschedule(value){
  const input=record(value);exactKeys(input,['date','time','version']);
  return {date:date(input.date),time:time(input.time),version:version(input.version)};
}

/** @param {any} value */
export function validateAppointmentCancel(value){
  const input=record(value);exactKeys(input,['version']);return {version:version(input.version)};
}

/** @param {any} value */
export function validateAvailabilityRule(value){
  const input=record(value);exactKeys(input,['weekday','startTime','endTime','validFrom','validUntil']);
  if(!Number.isInteger(input.weekday)||input.weekday<1||input.weekday>7)throw new SchedulingValidationError('Dia da semana inválido.');
  const startTime=time(input.startTime,'Início');const endTime=time(input.endTime,'Fim');
  if(minute(startTime)>=minute(endTime))throw new SchedulingValidationError('O início deve ser anterior ao fim.');
  const validFrom=date(input.validFrom,'Data inicial');
  const validUntil=input.validUntil===null||input.validUntil===''?null:date(input.validUntil,'Data final');
  if(validUntil&&validUntil<validFrom)throw new SchedulingValidationError('A data final deve ser posterior à inicial.');
  return {weekday:input.weekday,startMinute:minute(startTime),endMinute:minute(endTime),validFrom,validUntil};
}

/** @param {any} value */
export function validateAvailabilityException(value){
  const input=record(value);exactKeys(input,['kind','date','startTime','endTime']);
  if(!['AVAILABLE','BLOCKED'].includes(input.kind))throw new SchedulingValidationError('Tipo de exceção inválido.');
  const startTime=time(input.startTime,'Início');const endTime=time(input.endTime,'Fim');
  if(minute(startTime)>=minute(endTime))throw new SchedulingValidationError('O início deve ser anterior ao fim.');
  return {kind:input.kind,date:date(input.date),startTime,endTime};
}

/** @param {any} from @param {any} to */
export function validateScheduleRange(from,to){
  const validFrom=date(from,'Data inicial');const validTo=date(to,'Data final');
  if(validTo<validFrom)throw new SchedulingValidationError('Período inválido.');
  const days=Math.round((new Date(`${validTo}T12:00:00Z`).getTime()-new Date(`${validFrom}T12:00:00Z`).getTime())/86400000)+1;
  if(days>31)throw new SchedulingValidationError('O período não pode exceder 31 dias.');
  return {from:validFrom,to:validTo};
}

/** @param {any} value */
export function validateResourceId(value){return uuid(value,'Recurso');}

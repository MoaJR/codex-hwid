export const SCHEDULING_TIME_ZONE='America/Sao_Paulo';

/** @typedef {{start:number,end:number}} Range */
/** @typedef {{durationMinutes:number,slotIntervalMinutes:number,bufferBeforeMinutes?:number,bufferAfterMinutes?:number}} Service */
/** @typedef {{weekday:number,startMinute:number,endMinute:number,validFrom:string,validUntil?:string|null,active?:boolean}} Rule */
/** @typedef {{kind:'AVAILABLE'|'BLOCKED',startsAt:string|Date,endsAt:string|Date}} AvailabilityException */
/** @typedef {{startsAt:string|Date,endsAt:string|Date,status?:string,bufferBeforeMinutes?:number,bufferAfterMinutes?:number}} Appointment */
/** @typedef {{startsAt:string,endsAt:string,date:string,time:string,timeZone:string}} AvailableSlot */

export class AvailabilityValidationError extends Error{
  constructor(message='Dados de disponibilidade inválidos.'){
    super(message);
    this.name='AvailabilityValidationError';
  }
}

const datePattern=/^\d{4}-\d{2}-\d{2}$/;
/** @type {Map<string,Intl.DateTimeFormat>} */
const formatterCache=new Map();

/** @param {string} value */
function dateParts(value){
  if(typeof value!=='string'||!datePattern.test(value))throw new AvailabilityValidationError('Data inválida.');
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw new AvailabilityValidationError('Data inválida.');
  return {year,month,day};
}

/** @param {string} value */
function nextDate(value){
  const {year,month,day}=dateParts(value);
  const date=new Date(Date.UTC(year,month-1,day+1));
  return date.toISOString().slice(0,10);
}

/** @param {string} from @param {string} to */
function enumerateDates(from,to){
  dateParts(from);dateParts(to);
  if(from>to)throw new AvailabilityValidationError('O início do período deve preceder o fim.');
  const dates=[];
  for(let date=from;date<=to;date=nextDate(date)){
    dates.push(date);
    if(dates.length>31)throw new AvailabilityValidationError('O período de disponibilidade não pode exceder 31 dias.');
  }
  return dates;
}

/** @param {string} timeZone */
function formatter(timeZone){
  let value=formatterCache.get(timeZone);
  if(value)return value;
  try{
    value=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
    value.format(new Date(0));
  }catch{throw new AvailabilityValidationError('Fuso horário inválido.');}
  formatterCache.set(timeZone,value);
  return value;
}

/** @param {number} timestamp @param {string} timeZone */
function instantParts(timestamp,timeZone){
  const parts=formatter(timeZone).formatToParts(new Date(timestamp));
  /** @param {string} type */
  const read=(type)=>Number(parts.find(part=>part.type===type)?.value);
  return {year:read('year'),month:read('month'),day:read('day'),hour:read('hour'),minute:read('minute'),second:read('second')};
}

/** Convert a local wall-clock minute to an instant without relying on the server's timezone. */
/** @param {string} date @param {number} minute @param {string} timeZone */
function localMinuteToTimestamp(date,minute,timeZone){
  const {year,month,day}=dateParts(date);
  if(!Number.isInteger(minute)||minute<0||minute>1440)throw new AvailabilityValidationError('Minuto local inválido.');
  const target=Date.UTC(year,month-1,day,0,minute,0);
  let guess=target;
  for(let iteration=0;iteration<4;iteration++){
    const actual=instantParts(guess,timeZone);
    const represented=Date.UTC(actual.year,actual.month-1,actual.day,actual.hour,actual.minute,actual.second);
    const adjustment=target-represented;
    guess+=adjustment;
    if(adjustment===0)break;
  }
  const resolved=instantParts(guess,timeZone);
  const expected=new Date(target);
  if(resolved.year!==expected.getUTCFullYear()||resolved.month!==expected.getUTCMonth()+1||resolved.day!==expected.getUTCDate()||resolved.hour!==expected.getUTCHours()||resolved.minute!==expected.getUTCMinutes()){
    throw new AvailabilityValidationError('Horário local inexistente ou ambíguo.');
  }
  return guess;
}

/** Convert a YYYY-MM-DD + HH:MM selection in the clinic timezone to UTC ISO.
 * @param {string} date @param {string} time @param {string} [timeZone]
 */
export function localSelectionToIso(date,time,timeZone=SCHEDULING_TIME_ZONE){
  if(timeZone!==SCHEDULING_TIME_ZONE)throw new AvailabilityValidationError('A agenda deve usar America/Sao_Paulo.');
  if(typeof time!=='string'||!/^\d{2}:\d{2}$/.test(time))throw new AvailabilityValidationError('Horário inválido.');
  const [hour,minute]=time.split(':').map(Number);
  if(hour<0||hour>23||minute<0||minute>59)throw new AvailabilityValidationError('Horário inválido.');
  return new Date(localMinuteToTimestamp(date,hour*60+minute,timeZone)).toISOString();
}

/** @param {string} date */
function isoWeekday(date){
  const {year,month,day}=dateParts(date);
  const weekday=new Date(Date.UTC(year,month-1,day)).getUTCDay();
  return weekday===0?7:weekday;
}

/** @param {string|Date} value @param {string} label */
function timestamp(value,label){
  const parsed=typeof value==='string'||value instanceof Date?new Date(value).getTime():NaN;
  if(!Number.isFinite(parsed))throw new AvailabilityValidationError(`${label} inválido.`);
  return parsed;
}

/** @param {Service} service */
function validateService(service){
  if(!service||typeof service!=='object'||Array.isArray(service))throw new AvailabilityValidationError('Serviço inválido.');
  const durationMinutes=service.durationMinutes;
  const slotIntervalMinutes=service.slotIntervalMinutes;
  const bufferBeforeMinutes=service.bufferBeforeMinutes??0;
  const bufferAfterMinutes=service.bufferAfterMinutes??0;
  if(!Number.isInteger(durationMinutes)||durationMinutes<15||durationMinutes>480)throw new AvailabilityValidationError('Duração do serviço inválida.');
  if(!Number.isInteger(slotIntervalMinutes)||slotIntervalMinutes<5||slotIntervalMinutes>240)throw new AvailabilityValidationError('Intervalo dos horários inválido.');
  if(!Number.isInteger(bufferBeforeMinutes)||bufferBeforeMinutes<0||bufferBeforeMinutes>240||!Number.isInteger(bufferAfterMinutes)||bufferAfterMinutes<0||bufferAfterMinutes>240)throw new AvailabilityValidationError('Buffer do serviço inválido.');
  return {durationMinutes,slotIntervalMinutes,bufferBeforeMinutes,bufferAfterMinutes};
}

/** @param {Rule[]} rules */
function validateRules(rules){
  if(!Array.isArray(rules))throw new AvailabilityValidationError('Regras de disponibilidade inválidas.');
  return rules.map(rule=>{
    if(!rule||typeof rule!=='object'||Array.isArray(rule))throw new AvailabilityValidationError('Regra de disponibilidade inválida.');
    if(!Number.isInteger(rule.weekday)||rule.weekday<1||rule.weekday>7)throw new AvailabilityValidationError('Dia da semana inválido.');
    if(!Number.isInteger(rule.startMinute)||!Number.isInteger(rule.endMinute)||rule.startMinute<0||rule.endMinute>1440||rule.startMinute>=rule.endMinute)throw new AvailabilityValidationError('Intervalo semanal inválido.');
    dateParts(rule.validFrom);
    if(rule.validUntil!==null&&rule.validUntil!==undefined){dateParts(rule.validUntil);if(rule.validUntil<rule.validFrom)throw new AvailabilityValidationError('Validade da regra inválida.');}
    return {...rule,active:rule.active!==false};
  });
}

/** @param {AvailabilityException[]} exceptions */
function validateExceptions(exceptions){
  if(!Array.isArray(exceptions))throw new AvailabilityValidationError('Exceções de disponibilidade inválidas.');
  return exceptions.map(exception=>{
    if(!exception||typeof exception!=='object'||!['AVAILABLE','BLOCKED'].includes(exception.kind))throw new AvailabilityValidationError('Exceção de disponibilidade inválida.');
    const start=timestamp(exception.startsAt,'Início da exceção');
    const end=timestamp(exception.endsAt,'Fim da exceção');
    if(start>=end)throw new AvailabilityValidationError('Período da exceção inválido.');
    return {kind:exception.kind,start,end};
  });
}

/** @param {Appointment[]} appointments */
function validateAppointments(appointments){
  if(!Array.isArray(appointments))throw new AvailabilityValidationError('Ocupações inválidas.');
  return appointments.filter(appointment=>appointment?.status!=='CANCELLED').map(appointment=>{
    if(!appointment||typeof appointment!=='object')throw new AvailabilityValidationError('Ocupação inválida.');
    const start=timestamp(appointment.startsAt,'Início da ocupação');
    const end=timestamp(appointment.endsAt,'Fim da ocupação');
    const before=appointment.bufferBeforeMinutes??0;
    const after=appointment.bufferAfterMinutes??0;
    if(start>=end||!Number.isInteger(before)||before<0||before>240||!Number.isInteger(after)||after<0||after>240)throw new AvailabilityValidationError('Período da ocupação inválido.');
    return {start:start-before*60000,end:end+after*60000};
  });
}

/** @param {Range[]} ranges @returns {Range[]} */
function mergeRanges(ranges){
  const sorted=ranges.filter(range=>range.start<range.end).sort((a,b)=>a.start-b.start||a.end-b.end);
  /** @type {Range[]} */
  const merged=[];
  for(const range of sorted){
    const previous=merged.at(-1);
    if(previous&&range.start<=previous.end)previous.end=Math.max(previous.end,range.end);
    else merged.push({...range});
  }
  return merged;
}

/** @param {Range} left @param {Range} right */
function overlaps(left,right){return left.start<right.end&&right.start<left.end;}
/** @param {Range} container @param {Range} range */
function contains(container,range){return container.start<=range.start&&range.end<=container.end;}

/** @param {number} value @param {string} timeZone */
function localLabels(value,timeZone){
  const parts=formatter(timeZone).formatToParts(new Date(value));
  /** @param {string} type */
  const read=(type)=>parts.find(part=>part.type===type)?.value??'';
  return {date:`${read('year')}-${read('month')}-${read('day')}`,time:`${read('hour')}:${read('minute')}`};
}

/**
 * Generate free half-open appointment intervals from recurring rules, explicit
 * availability and blocks. All persisted instants are ISO UTC; labels use the
 * configured IANA timezone. A block always wins over an AVAILABLE exception.
 */
/**
 * @param {{from:string,to:string,timeZone?:string,service:Service,rules:Rule[],exceptions?:AvailabilityException[],appointments?:Appointment[]}} input
 * @returns {AvailableSlot[]}
 */
export function generateAvailableSlots({from,to,timeZone=SCHEDULING_TIME_ZONE,service,rules,exceptions=[],appointments=[]}){
  if(timeZone!==SCHEDULING_TIME_ZONE)throw new AvailabilityValidationError('A agenda deve usar America/Sao_Paulo.');
  formatter(timeZone);
  const dates=enumerateDates(from,to);
  const normalizedService=validateService(service);
  const normalizedRules=validateRules(rules);
  const normalizedExceptions=validateExceptions(exceptions);
  const occupied=validateAppointments(appointments);
  const rangeStart=localMinuteToTimestamp(from,0,timeZone);
  const rangeEnd=localMinuteToTimestamp(nextDate(to),0,timeZone);
  const sources=[];
  for(const date of dates){
    for(const rule of normalizedRules){
      if(!rule.active||rule.weekday!==isoWeekday(date)||date<rule.validFrom||(rule.validUntil&&date>rule.validUntil))continue;
      sources.push({start:localMinuteToTimestamp(date,rule.startMinute,timeZone),end:localMinuteToTimestamp(date,rule.endMinute,timeZone)});
    }
  }
  for(const exception of normalizedExceptions){
    if(exception.kind!=='AVAILABLE'||exception.end<=rangeStart||exception.start>=rangeEnd)continue;
    sources.push({start:Math.max(exception.start,rangeStart),end:Math.min(exception.end,rangeEnd)});
  }
  const coverage=mergeRanges(sources);
  const blocked=normalizedExceptions.filter(exception=>exception.kind==='BLOCKED');
  const duration=normalizedService.durationMinutes*60000;
  const before=normalizedService.bufferBeforeMinutes*60000;
  const after=normalizedService.bufferAfterMinutes*60000;
  const interval=normalizedService.slotIntervalMinutes*60000;
  const candidates=new Set();
  for(const source of sources){
    for(let start=source.start;start+duration<=source.end;start+=interval)candidates.add(start);
  }
  return [...candidates].sort((a,b)=>a-b).flatMap(start=>{
    const appointment={start,end:start+duration};
    const reserved={start:start-before,end:appointment.end+after};
    if(!coverage.some(window=>contains(window,reserved)))return [];
    if(blocked.some(window=>overlaps(window,reserved)))return [];
    if(occupied.some(window=>overlaps(window,reserved)))return [];
    const labels=localLabels(start,timeZone);
    if(labels.date<from||labels.date>to)return [];
    return [{startsAt:new Date(appointment.start).toISOString(),endsAt:new Date(appointment.end).toISOString(),date:labels.date,time:labels.time,timeZone}];
  });
}

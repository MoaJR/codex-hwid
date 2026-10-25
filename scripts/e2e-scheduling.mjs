import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {generateAvailableSlots,SCHEDULING_TIME_ZONE} from '../src/modules/scheduling/availability.mjs';
import {assertLocalBaseUrl,buildSummary,createPacer,defaultAccountsFile,parseAccounts,signIn} from './lib/local-e2e.mjs';

export {assertLocalBaseUrl,parseAccounts} from './lib/local-e2e.mjs';

// Aceite da agenda 5A por HTTP contra um servidor local. O script só fala com
// localhost, nunca imprime e-mail, senha, nome, identificador ou horário de
// paciente e sempre encerra a consulta e a regra que ele mesmo criou.
export const operation='SCHEDULING_E2E';

/** @param {string} date @param {number} days */
function addDays(date,days){
  const value=new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate()+days);
  return value.toISOString().slice(0,10);
}

/** ISO weekday (1 = Monday) for a calendar date in the clinic timezone. */
function isoWeekday(date){
  const [year,month,day]=date.split('-').map(Number);
  const weekday=new Date(Date.UTC(year,month-1,day)).getUTCDay();
  return weekday===0?7:weekday;
}

/** @param {string[]} args */
export function parseArguments(args){
  const options={confirm:null,baseUrl:process.env.E2E_BASE_URL??'http://localhost:3000',accountsFile:process.env.E2E_ACCOUNTS_FILE??defaultAccountsFile};
  for(let index=0;index<args.length;index++){
    const flag=args[index];
    if(flag==='--confirm')options.confirm=args[++index]??null;
    else if(flag==='--base-url')options.baseUrl=args[++index]??'';
    else if(flag==='--accounts')options.accountsFile=args[++index]??'';
    else throw new Error('E2E_ARGUMENT_UNKNOWN');
  }
  return options;
}

/** @param {any} workspace */
function pickService(workspace){
  const active=workspace.services.filter(service=>service.active);
  const preferred=active.filter(service=>service.mode==='IN_PERSON');
  const pool=preferred.length>0?preferred:active;
  return [...pool].sort((left,right)=>left.durationMinutes-right.durationMinutes||left.slotIntervalMinutes-right.slotIntervalMinutes||left.code.localeCompare(right.code))[0];
}

/** Same slot generator the agenda screen uses, from the persisted workspace. */
function slotsFor(workspace,service,date){
  return generateAvailableSlots({
    from:date,
    to:date,
    timeZone:workspace.doctor.timeZone,
    service,
    rules:workspace.rules,
    exceptions:workspace.exceptions,
    appointments:workspace.appointments,
  });
}

async function run(options){
  const baseUrl=assertLocalBaseUrl(options.baseUrl);
  if(options.confirm!=='E2E')throw new Error('E2E_CONFIRMATION_REQUIRED');
  const accounts=parseAccounts(await readFile(options.accountsFile,'utf8'));
  for(const role of ['DOCTOR','SECRETARY','PATIENT'])if(!accounts[role])throw new Error(`E2E_ACCOUNT_MISSING_${role}`);

  /** @type {Record<string,boolean>} */
  const checks={
    doctorLogin:false,workspaceLoaded:false,patientAvailable:false,ruleReady:false,slotOptions:false,
    appointmentCreated:false,createReplayIdempotent:false,slotHeldAfterCreate:false,createConflictRejected:false,
    rescheduled:false,staleRescheduleRejected:false,cancelled:false,cancelIsIdempotent:false,slotReleasedAfterCancel:false,
    patientAgendaDenied:false,patientAvailabilityDenied:false,secretaryWorkspaceAllowed:false,secretaryAvailabilityDenied:false,
    ruleCleaned:false,
  };
  const pace=createPacer();
  const loginPace=createPacer(4);
  /** @type {{client:any,ruleId:string|null,appointmentId:string|null,version:number}} */
  const state={client:null,ruleId:null,appointmentId:null,version:0};
  let failedStep=null;
  const expect=(name,condition)=>{if(!condition)throw new Error(`CHECK_FAILED_${name}`);checks[name]=true;};

  try{
    const doctor=await signIn(baseUrl,accounts.DOCTOR,loginPace);state.client=doctor;checks.doctorLogin=true;

    const today=new Intl.DateTimeFormat('en-CA',{timeZone:SCHEDULING_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const targetDate=addDays(today,3);
    const loadWorkspace=async()=>{
      const result=await doctor.request(`/api/medico/agenda?from=${today}&to=${addDays(today,30)}`);
      if(result.status!==200||!result.payload?.workspace)throw new Error('WORKSPACE_UNAVAILABLE');
      return result.payload.workspace;
    };

    let workspace=await loadWorkspace();checks.workspaceLoaded=true;
    const patient=workspace.patients[0];
    expect('patientAvailable',Boolean(patient));
    const service=pickService(workspace);
    if(!service)throw new Error('SERVICE_UNAVAILABLE');

    const weekday=isoWeekday(targetDate);
    const covered=workspace.rules.some(rule=>rule.active&&rule.weekday===weekday&&rule.startMinute<=9*60&&rule.endMinute>=12*60&&rule.validFrom<=targetDate&&(!rule.validUntil||rule.validUntil>=targetDate));
    if(!covered){
      await pace();
      const rule=await doctor.request('/api/medico/availability',{method:'POST',body:{type:'RULE',weekday,startTime:'09:00',endTime:'12:00',validFrom:today,validUntil:null}});
      if(rule.status!==201||!rule.payload?.item?.id)throw new Error('RULE_NOT_CREATED');
      state.ruleId=rule.payload.item.id;
      workspace=await loadWorkspace();
    }
    checks.ruleReady=true;

    const slots=slotsFor(workspace,service,targetDate);
    expect('slotOptions',slots.length>=2);
    const firstSlot=slots[0];const secondSlot=slots[1];

    await pace();
    const idempotencyKey=randomUUID();
    const created=await doctor.request('/api/medico/appointments',{method:'POST',headers:{'Idempotency-Key':idempotencyKey},body:{patientId:patient.id,serviceId:service.id,date:targetDate,time:firstSlot.time}});
    if(created.status!==201||!created.payload?.item?.id)throw new Error('APPOINTMENT_NOT_CREATED');
    state.appointmentId=created.payload.item.id;state.version=created.payload.item.version;
    expect('appointmentCreated',created.payload.item.status==='CONFIRMED'&&created.payload.item.version===1&&created.payload.item.startsAt===firstSlot.startsAt&&created.payload.item.serviceId===service.id);

    await pace();
    const replay=await doctor.request('/api/medico/appointments',{method:'POST',headers:{'Idempotency-Key':idempotencyKey},body:{patientId:patient.id,serviceId:service.id,date:targetDate,time:firstSlot.time}});
    expect('createReplayIdempotent',replay.status===201&&replay.payload?.item?.id===state.appointmentId);

    workspace=await loadWorkspace();
    expect('slotHeldAfterCreate',!slotsFor(workspace,service,targetDate).some(slot=>slot.startsAt===firstSlot.startsAt));

    await pace();
    const conflict=await doctor.request('/api/medico/appointments',{method:'POST',headers:{'Idempotency-Key':randomUUID()},body:{patientId:patient.id,serviceId:service.id,date:targetDate,time:firstSlot.time}});
    expect('createConflictRejected',conflict.status===409&&conflict.payload?.error?.code==='SCHEDULE_CONFLICT');

    await pace();
    const rescheduled=await doctor.request(`/api/medico/appointments/${state.appointmentId}`,{method:'PATCH',body:{date:targetDate,time:secondSlot.time,version:state.version}});
    if(rescheduled.status!==200||!rescheduled.payload?.item)throw new Error('RESCHEDULE_FAILED');
    state.version=rescheduled.payload.item.version;
    expect('rescheduled',rescheduled.payload.item.version===2&&rescheduled.payload.item.startsAt===secondSlot.startsAt&&rescheduled.payload.item.status==='CONFIRMED');

    await pace();
    const staleReschedule=await doctor.request(`/api/medico/appointments/${state.appointmentId}`,{method:'PATCH',body:{date:targetDate,time:firstSlot.time,version:1}});
    expect('staleRescheduleRejected',staleReschedule.status===409);

    await pace();
    const cancelled=await doctor.request(`/api/medico/appointments/${state.appointmentId}/cancel`,{method:'POST',body:{version:state.version}});
    if(cancelled.status!==200||!cancelled.payload?.item)throw new Error('CANCEL_FAILED');
    state.version=cancelled.payload.item.version;
    expect('cancelled',cancelled.payload.item.status==='CANCELLED'&&cancelled.payload.item.version===3);

    await pace();
    const repeatedCancel=await doctor.request(`/api/medico/appointments/${state.appointmentId}/cancel`,{method:'POST',body:{version:2}});
    expect('cancelIsIdempotent',repeatedCancel.status===200&&repeatedCancel.payload?.item?.status==='CANCELLED'&&repeatedCancel.payload?.item?.version===state.version);

    workspace=await loadWorkspace();
    expect('slotReleasedAfterCancel',slotsFor(workspace,service,targetDate).some(slot=>slot.startsAt===secondSlot.startsAt));

    const patientClient=await signIn(baseUrl,accounts.PATIENT,loginPace);
    const patientAgenda=await patientClient.request('/api/medico/agenda');
    expect('patientAgendaDenied',patientAgenda.status===403);
    const patientAvailability=await patientClient.request('/api/medico/availability',{method:'POST',body:{type:'RULE',weekday,startTime:'09:00',endTime:'12:00',validFrom:today,validUntil:null}});
    expect('patientAvailabilityDenied',patientAvailability.status===403);

    const secretaryClient=await signIn(baseUrl,accounts.SECRETARY,loginPace);
    const secretaryWorkspace=await secretaryClient.request('/api/medico/agenda');
    expect('secretaryWorkspaceAllowed',secretaryWorkspace.status===200);
    const secretaryAvailability=await secretaryClient.request('/api/medico/availability',{method:'POST',body:{type:'RULE',weekday,startTime:'13:00',endTime:'14:00',validFrom:today,validUntil:null}});
    expect('secretaryAvailabilityDenied',secretaryAvailability.status===403);
  }catch(error){
    failedStep=error instanceof Error?error.message:'UNKNOWN_FAILURE';
  }finally{
    if(state.client){
      if(state.appointmentId&&checks.appointmentCreated&&!checks.cancelled){
        try{await pace();await state.client.request(`/api/medico/appointments/${state.appointmentId}/cancel`,{method:'POST',body:{version:state.version}});}catch{/* limpeza best-effort */}
      }
      if(state.ruleId){
        try{await pace();const removed=await state.client.request(`/api/medico/availability/${state.ruleId}?kind=rule`,{method:'DELETE'});checks.ruleCleaned=removed.status===200;}catch{checks.ruleCleaned=false;}
      }else{
        checks.ruleCleaned=true;
      }
    }
  }
  return buildSummary(operation,checks,failedStep);
}

async function main(){
  let summary;
  try{
    summary=await run(parseArguments(process.argv.slice(2)));
  }catch(error){
    const message=error instanceof Error?error.message:'UNKNOWN_FAILURE';
    summary={operation,status:'refused',reason:message};
  }
  console.log(JSON.stringify(summary));
  if(summary.status!=='ready')process.exitCode=1;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main();
}



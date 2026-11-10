import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {generateAvailableSlots,SCHEDULING_TIME_ZONE} from '../src/modules/scheduling/availability.mjs';
import {assertLocalBaseUrl,buildSummary,createPacer,defaultAccountsFile,parseAccounts,signIn} from './lib/local-e2e.mjs';

// Aceite HTTP da Fase 5B. Só fala com loopback, nunca imprime e-mail, senha,
// nome, identificador ou horário de paciente e sempre encerra a consulta que
// ele mesmo confirmou.
export const operation='PATIENT_BOOKING_E2E';
const requestKeys=['endsAt','expiresAt','id','mode','serviceLabel','startsAt','status','version'].sort();

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
  return [...pool].sort((left,right)=>left.durationMinutes-right.durationMinutes||left.code.localeCompare(right.code))[0];
}

/** @param {string} date @param {number} days */
function addDays(date,days){
  const value=new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate()+days);
  return value.toISOString().slice(0,10);
}

/** ISO weekday (1 = segunda) para uma data de calendário no fuso da clínica. */
function isoWeekday(date){
  const [year,month,day]=date.split('-').map(Number);
  const weekday=new Date(Date.UTC(year,month-1,day)).getUTCDay();
  return weekday===0?7:weekday;
}

/** Primeiro dia da janela com horário livre e futuro para o serviço escolhido. */
function firstOpenSlot(workspace,service){
  const start=new Date(`${workspace.from}T12:00:00Z`);const end=new Date(`${workspace.to}T12:00:00Z`);
  const now=Date.now();
  for(let day=new Date(start);day<=end;day.setUTCDate(day.getUTCDate()+1)){
    const date=day.toISOString().slice(0,10);
    const slots=generateAvailableSlots({from:date,to:date,timeZone:workspace.doctor.timeZone,service,rules:workspace.rules,exceptions:workspace.exceptions,appointments:workspace.appointments})
      .filter(slot=>new Date(slot.startsAt).getTime()>now);
    if(slots.length>0)return slots[0];
  }
  return null;
}

function sameKeys(value){
  return Object.keys(value).sort().join(',')===requestKeys.join(',');
}

async function run(options){
  const baseUrl=assertLocalBaseUrl(options.baseUrl);
  if(options.confirm!=='E2E')throw new Error('E2E_CONFIRMATION_REQUIRED');
  const accounts=parseAccounts(await readFile(options.accountsFile,'utf8'));
  for(const role of ['DOCTOR','PATIENT'])if(!accounts[role])throw new Error(`E2E_ACCOUNT_MISSING_${role}`);

  const checks={
    doctorLogin:false,workspaceLoaded:false,ruleReady:false,slotFound:false,
    anonymousRejected:false,originDenied:false,patientAgendaDenied:false,
    invalidPayloadRejected:false,unknownServiceRejected:false,pastSlotRejected:false,
    requestCreated:false,payloadAllowlisted:false,replayIdempotent:false,duplicateSlotConflict:false,
    staffQueueVisible:false,patientDecisionDenied:false,approved:false,approveIdempotent:false,
    patientCancelledOwn:false,cancelIdempotent:false,foreignCancelDenied:false,rateLimited:false,ruleCleaned:false,
  };
  const pace=createPacer();
  const loginPace=createPacer(4);
  let failedStep=null;
  const state={requestId:null,appointmentId:null,ruleId:null,version:1};
  const expect=(name,pass)=>{checks[name]=pass===true;if(!checks[name]&&!failedStep)failedStep=name;};
  const randomId=()=>randomUUID();

  try{
    const doctor=await signIn(baseUrl,accounts.DOCTOR,loginPace);expect('doctorLogin',true);
    const loadWorkspace=async()=>{
      await pace();
      const agenda=await doctor.request('/api/medico/agenda');
      if(agenda.status!==200||!agenda.payload?.workspace)throw new Error('WORKSPACE_UNAVAILABLE');
      return agenda.payload.workspace;
    };
    let workspace=await loadWorkspace();
    expect('workspaceLoaded',true);
    const service=pickService(workspace);
    if(!service)throw new Error('SERVICE_UNAVAILABLE');

    // A janela pode não ter regra semanal ativa (execuções anteriores da 5A
    // desativam as suas). O aceite cria a própria regra e a remove no fim.
    const today=new Intl.DateTimeFormat('en-CA',{timeZone:SCHEDULING_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    const targetDate=addDays(today,7);
    const weekday=isoWeekday(targetDate);
    const covered=workspace.rules.some(rule=>rule.active&&rule.weekday===weekday&&rule.startMinute<=9*60&&rule.endMinute>=12*60&&rule.validFrom<=targetDate&&(!rule.validUntil||rule.validUntil>=targetDate));
    if(!covered){
      await pace();
      const rule=await doctor.request('/api/medico/availability',{method:'POST',body:{type:'RULE',weekday,startTime:'09:00',endTime:'12:00',validFrom:today,validUntil:null}});
      if(rule.status!==201||!rule.payload?.item?.id)throw new Error('RULE_NOT_CREATED');
      state.ruleId=rule.payload.item.id;
      workspace=await loadWorkspace();
    }
    expect('ruleReady',workspace.rules.some(rule=>rule.active&&rule.weekday===weekday));
    const slot=firstOpenSlot(workspace,service);
    expect('slotFound',!!slot);
    if(!slot)throw new Error('SLOT_NOT_FOUND');
    const body={serviceId:service.id,date:slot.date,time:slot.time};
    const path='/api/paciente/appointment-requests';
    const headers=key=>({'Content-Type':'application/json','Idempotency-Key':key});

    const anonymous=await fetch(`${baseUrl}${path}`,{method:'POST',headers:{...headers(randomId()),Origin:baseUrl},body:JSON.stringify(body),redirect:'manual'});
    expect('anonymousRejected',anonymous.status===401);

    const patient=await signIn(baseUrl,accounts.PATIENT,loginPace);
    await pace();
    const deniedOrigin=await patient.request(path,{method:'POST',origin:false,headers:headers(randomId()),body});
    expect('originDenied',deniedOrigin.status===403);

    await pace();
    const teamQueue=await patient.request('/api/medico/appointment-requests');
    expect('patientAgendaDenied',teamQueue.status===403);

    await pace();
    const injected=await patient.request(path,{method:'POST',headers:headers(randomId()),body:{...body,patientId:randomId()}});
    expect('invalidPayloadRejected',injected.status===400);

    await pace();
    const unknownService=await patient.request(path,{method:'POST',headers:headers(randomId()),body:{...body,serviceId:randomId()}});
    expect('unknownServiceRejected',unknownService.status===404);

    await pace();
    // Data realmente passada: ontem no fuso da clínica.
    const pastSlot=await patient.request(path,{method:'POST',headers:headers(randomId()),body:{...body,date:addDays(today,-1)}});
    expect('pastSlotRejected',pastSlot.status===400);

    await pace();
    const key=randomId();
    const created=await patient.request(path,{method:'POST',headers:headers(key),body});
    const createdItem=created.payload?.item;
    // Diagnóstico operacional: uma pendência anterior do mesmo paciente bloqueia
    // a nova solicitação e precisa ser retirada ou recusada antes do aceite.
    if(created.status===409&&!failedStep)failedStep='REQUEST_PENDING_ALREADY_EXISTS_MUST_WITHDRAW_OR_REJECT';
    expect('requestCreated',created.status===201&&createdItem?.status==='PENDING');
    expect('payloadAllowlisted',!!createdItem&&sameKeys(createdItem));
    if(!createdItem?.id)throw new Error('REQUEST_NOT_CREATED');
    state.requestId=createdItem.id;

    await pace();
    const replay=await patient.request(path,{method:'POST',headers:headers(key),body});
    expect('replayIdempotent',replay.status===201&&replay.payload?.item?.id===state.requestId);

    await pace();
    const duplicate=await patient.request(path,{method:'POST',headers:headers(randomId()),body});
    expect('duplicateSlotConflict',duplicate.status===409);

    await pace();
    const queue=await doctor.request('/api/medico/appointment-requests');
    expect('staffQueueVisible',queue.status===200&&Array.isArray(queue.payload?.items)&&queue.payload.items.some(item=>item.id===state.requestId));

    await pace();
    const patientDecision=await patient.request(`/api/medico/appointment-requests/${state.requestId}/approve`,{method:'POST',body:{version:1}});
    expect('patientDecisionDenied',patientDecision.status===403);

    await pace();
    const approved=await doctor.request(`/api/medico/appointment-requests/${state.requestId}/approve`,{method:'POST',body:{version:1}});
    state.appointmentId=approved.payload?.item?.appointmentId??null;
    state.version=approved.payload?.item?.request?.version??1;
    expect('approved',approved.status===200&&!!state.appointmentId&&state.version===2);
    if(!state.appointmentId)throw new Error('APPROVAL_FAILED');

    await pace();
    const approveAgain=await doctor.request(`/api/medico/appointment-requests/${state.requestId}/approve`,{method:'POST',body:{version:1}});
    expect('approveIdempotent',approveAgain.status===200&&approveAgain.payload?.item?.appointmentId===state.appointmentId);
  }catch(error){
    failedStep=failedStep??(error instanceof Error?error.message:'UNKNOWN_FAILURE');
  }finally{
    if(state.ruleId){
      try{
        const doctor=await signIn(baseUrl,accounts.DOCTOR,loginPace);
        await pace();
        const removed=await doctor.request(`/api/medico/availability/${state.ruleId}?kind=rule`,{method:'DELETE'});
        checks.ruleCleaned=removed.status===200;
      }catch{checks.ruleCleaned=false;}
    }else{
      checks.ruleCleaned=true;
    }
    if(state.appointmentId){
      try{
        const patient=await signIn(baseUrl,accounts.PATIENT,loginPace);
        await pace();
        const cancelled=await patient.request(`/api/paciente/appointments/${state.appointmentId}/cancel`,{method:'POST',body:{version:1}});
        checks.patientCancelledOwn=cancelled.status===200&&cancelled.payload?.item?.status==='CANCELLED';
        if(!checks.patientCancelledOwn&&!failedStep)failedStep='patientCancelledOwn';
        await pace();
        const again=await patient.request(`/api/paciente/appointments/${state.appointmentId}/cancel`,{method:'POST',body:{version:cancelled.payload?.item?.version??2}});
        checks.cancelIdempotent=again.status===200&&again.payload?.item?.status==='CANCELLED';
        await pace();
        const foreign=await patient.request(`/api/paciente/appointments/${randomId()}/cancel`,{method:'POST',body:{version:1}});
        checks.foreignCancelDenied=foreign.status===404;
        // O pacer padrão (8/min) nunca chegaria ao limite do servidor (10/min):
        // a sonda usa um pacer próprio para exercitar o 429 de verdade.
        const burst=createPacer(20);
        for(let attempt=0;attempt<14&&!checks.rateLimited;attempt++){
          await burst();
          const limited=await patient.request(`/api/paciente/appointments/${randomId()}/cancel`,{method:'POST',body:{version:1}});
          if(limited.status===429)checks.rateLimited=true;
        }
      }catch{/* limpeza best-effort: o resumo informa o que não foi observado */}
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
  await main();
}


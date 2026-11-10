import {pathToFileURL} from 'node:url';
import {PrismaClient} from '@prisma/client';
import {isLocalDatabaseUrl} from './check-privacy.mjs';

// Expurgo das categorias efêmeras conforme D3 aprovada em 10/11/2026.
// Categorias com guarda histórica (consulta e auditoria) são apenas reportadas:
// apagá-las exige procedimento próprio por causa das FKs `Restrict`.
export const retentionPolicy=Object.freeze({
  apiRateLimit:'janela própria (expira em minutos)',
  providerRateLimit:'janela própria (limpo após 1 hora sem uso)',
  session:'expiração própria da sessão',
  verification:'expiração própria do registro de verificação',
  auditEvent:'5 anos — somente reportado, não apagado por este comando',
  appointment:'20 anos — somente reportado, não apagado por este comando',
  appointmentRequest:'pendência expirada — transição para EXPIRED no fluxo de agenda; este comando apenas reporta',
});

// O `RateLimit` do provedor guarda apenas `lastRequest` em epoch ms.
const providerRateLimitStaleMs=60*60*1000;

/** @param {Record<string,string|undefined>} environment */
export function retentionPrecheck(environment=process.env){
  const value=environment.DATABASE_URL?.trim();
  if(!value)return {operation:'RETENTION_APPLY',status:'not_configured',code:'DATABASE_URL_MISSING'};
  if(!isLocalDatabaseUrl(value))return {operation:'RETENTION_APPLY',status:'refused',code:'DATABASE_URL_NOT_LOCAL'};
  return null;
}

/**
 * O comando só apaga com confirmação explícita. Sem ela vira relatório.
 * @param {string[]} args
 */
export function parseRetentionArguments(args){
  let confirm=null;
  for(let index=0;index<args.length;index++){
    if(args[index]==='--confirm'){confirm=args[++index]??null;continue;}
    throw new Error('RETENTION_ARGUMENT_UNKNOWN');
  }
  return {confirm,mode:confirm==='RETENCAO'?'apply':'dry-run'};
}

/** @param {{mode:'dry-run'|'apply',expired:Record<string,number>,deleted?:Record<string,number>}} input */
export function summarizeRetention(input){
  return {
    operation:'RETENTION_APPLY',
    status:'ready',
    mode:input.mode,
    policy:retentionPolicy,
    expired:input.expired,
    ...(input.deleted?{deleted:input.deleted}:{}),
    note:'Somente contagens agregadas. Consultas, auditoria e solicitações de agenda não são apagadas por este comando.',
  };
}

/** @param {PrismaClient} db */
async function countExpired(db){
  const [apiRateLimit,providerRateLimit,session,verification,auditEvent,appointment,appointmentRequest]=await db.$transaction([
    db.$queryRaw`SELECT (COUNT(*) FILTER (WHERE "expiresAt"<CURRENT_TIMESTAMP))::int AS "count" FROM "ApiRateLimit"`,
    db.$queryRaw`SELECT (COUNT(*) FILTER (WHERE "lastRequest"<((EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)*1000)::bigint-${providerRateLimitStaleMs})))::int AS "count" FROM "RateLimit"`,
    db.$queryRaw`SELECT (COUNT(*) FILTER (WHERE "expiresAt"<CURRENT_TIMESTAMP))::int AS "count" FROM "Session"`,
    db.$queryRaw`SELECT (COUNT(*) FILTER (WHERE "expiresAt"<CURRENT_TIMESTAMP))::int AS "count" FROM "Verification"`,
    db.$queryRaw`SELECT (COUNT(*) FILTER (WHERE "occurredAt"<CURRENT_TIMESTAMP-INTERVAL '5 years'))::int AS "count" FROM "AuditEvent"`,
    db.$queryRaw`SELECT (COUNT(*) FILTER (WHERE "startsAt"<CURRENT_TIMESTAMP-INTERVAL '20 years'))::int AS "count" FROM "Appointment"`,
    db.$queryRaw`SELECT (COUNT(*) FILTER (WHERE "status"='PENDING' AND "expiresAt"<=CURRENT_TIMESTAMP))::int AS "count" FROM "AppointmentRequest"`,
  ]);
  return {
    apiRateLimit:apiRateLimit[0]?.count??0,
    providerRateLimit:providerRateLimit[0]?.count??0,
    session:session[0]?.count??0,
    verification:verification[0]?.count??0,
    auditEvent:auditEvent[0]?.count??0,
    appointment:appointment[0]?.count??0,
    appointmentRequest:appointmentRequest[0]?.count??0,
  };
}

/** @param {PrismaClient} db */
async function deleteExpired(db){
  return db.$transaction(async transaction=>{
    const now=new Date();
    const apiRateLimit=await transaction.apiRateLimit.deleteMany({where:{expiresAt:{lt:now}}});
    const providerRateLimit=await transaction.rateLimit.deleteMany({where:{lastRequest:{lt:BigInt(Date.now()-providerRateLimitStaleMs)}}});
    const session=await transaction.session.deleteMany({where:{expiresAt:{lt:now}}});
    const verification=await transaction.verification.deleteMany({where:{expiresAt:{lt:now}}});
    return {
      apiRateLimit:apiRateLimit.count,
      providerRateLimit:providerRateLimit.count,
      session:session.count,
      verification:verification.count,
    };
  });
}

async function main(){
  const refusal=retentionPrecheck();
  if(refusal){console.log(JSON.stringify(refusal));process.exitCode=1;return;}
  let options;
  try{options=parseRetentionArguments(process.argv.slice(2));}
  catch{console.log(JSON.stringify({operation:'RETENTION_APPLY',status:'refused',reason:'RETENTION_ARGUMENT_UNKNOWN'}));process.exitCode=1;return;}
  const db=new PrismaClient({log:[],errorFormat:'minimal'});
  try{
    const expired=await countExpired(db);
    if(options.mode!=='apply'){console.log(JSON.stringify(summarizeRetention({mode:'dry-run',expired})));return;}
    const deleted=await deleteExpired(db);
    console.log(JSON.stringify(summarizeRetention({mode:'apply',expired,deleted})));
  }catch{
    // Erros do provedor podem carregar host ou credencial. Nunca imprimir.
    console.log(JSON.stringify({operation:'RETENTION_APPLY',status:'unavailable'}));
    process.exitCode=1;
  }finally{await db.$disconnect();}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  await main();
}

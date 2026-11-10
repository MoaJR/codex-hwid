import 'server-only';
import {redirect} from 'next/navigation';
import {getDb} from '@/server/db';
import {getSessionContext,type SessionContext} from './session';
import {authorizeSession} from './authorize';

// Acesso do paciente à própria agenda (Fase 5B). O escopo é sempre derivado do
// servidor: `Patient.userId` da sessão e o médico único da instância. Nenhum
// identificador de paciente, médico ou serviço vem da URL ou do corpo.
export type PatientSchedulingScope={patientId:string;doctor:{id:string;userId:string;timeZone:string}};
type AuthenticatedContext=Extract<SessionContext,{state:'authenticated'}>;
type PatientAccess={context:AuthenticatedContext;scope:PatientSchedulingScope;response?:never}|{context?:never;scope?:never;response:Response};

const noStore={'Cache-Control':'private, no-store'};
function error(status:number,code:string,message:string){return Response.json({error:{code,message}},{status,headers:noStore});}

/** Falha fechada quando o vínculo não existe ou a cardinalidade do titular não é exatamente um. */
async function resolveScope(context:AuthenticatedContext):Promise<PatientSchedulingScope|undefined>{
  if(!context.actor.roles.includes('PATIENT'))return undefined;
  const db=getDb();
  const patients=await db.$queryRaw<{id:string}[]>`
    SELECT "id" FROM "Patient" WHERE "userId"=${context.actor.userId}::uuid ORDER BY "id" LIMIT 2
  `;
  if(patients.length!==1)return undefined;
  const doctors=await db.$queryRaw<{id:string;userId:string;timeZone:string}[]>`
    SELECT "id","userId","timeZone" FROM "Doctor" ORDER BY "id" LIMIT 2
  `;
  if(doctors.length!==1)return undefined;
  return {patientId:patients[0].id,doctor:doctors[0]};
}

export async function requirePatientSchedulingApi(permission:string):Promise<PatientAccess>{
  const context=await getSessionContext();
  if(context.state==='unavailable')return {response:error(503,'AUTH_UNAVAILABLE','O acesso está temporariamente indisponível.')};
  if(context.state==='anonymous')return {response:error(401,'AUTH_REQUIRED','Entre para continuar.')};
  let scope:PatientSchedulingScope|undefined;
  try{scope=await resolveScope(context);}
  catch{return {response:error(503,'SCHEDULING_UNAVAILABLE','A agenda está temporariamente indisponível.')}}
  if(!scope)return {response:error(403,'ACCESS_DENIED','Acesso não permitido.')};
  try{
    authorizeSession(context,permission,{patientUserId:context.actor.userId});
    return {context,scope};
  }catch{return {response:error(403,'ACCESS_DENIED','Acesso não permitido.')};}
}

export async function requirePatientSchedulingPage(permission:string):Promise<{context:AuthenticatedContext;scope:PatientSchedulingScope}>{
  const context=await getSessionContext();
  if(context.state==='anonymous')redirect('/login');
  if(context.state==='unavailable')redirect('/conta');
  try{
    const scope=await resolveScope(context);
    if(!scope)throw new Error('scope');
    authorizeSession(context,permission,{patientUserId:context.actor.userId});
    return {context,scope};
  }catch{redirect('/painel');}
}

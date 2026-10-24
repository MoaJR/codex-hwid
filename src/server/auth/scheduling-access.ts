import 'server-only';
import {redirect} from 'next/navigation';
import {getDb} from '@/server/db';
import {getSessionContext,type SessionContext} from './session';
import {authorizeSession} from './authorize';

export type SchedulingDoctor={id:string;userId:string;timeZone:string};
type AuthenticatedContext=Extract<SessionContext,{state:'authenticated'}>;
type SchedulingAccess={context:AuthenticatedContext;doctor:SchedulingDoctor;response?:never}|{context?:never;doctor?:never;response:Response};

const noStore={'Cache-Control':'private, no-store'};
function error(status:number,code:string,message:string){return Response.json({error:{code,message}},{status,headers:noStore});}

async function resolveDoctor(context:AuthenticatedContext):Promise<SchedulingDoctor|undefined>{
  const db=getDb();
  if(context.actor.roles.includes('DOCTOR')){
    const rows=await db.$queryRaw<SchedulingDoctor[]>`
      SELECT "id","userId","timeZone" FROM "Doctor" WHERE "userId"=${context.actor.userId}::uuid LIMIT 1
    `;
    return rows[0];
  }
  if(context.actor.roles.includes('SECRETARY')){
    const rows=await db.$queryRaw<SchedulingDoctor[]>`
      SELECT "id","userId","timeZone" FROM "Doctor" ORDER BY "id" LIMIT 2
    `;
    if(rows.length===1)return rows[0];
  }
  return undefined;
}

export async function requireSchedulingApi(permission:string):Promise<SchedulingAccess>{
  const context=await getSessionContext();
  if(context.state==='unavailable')return {response:error(503,'AUTH_UNAVAILABLE','O acesso está temporariamente indisponível.')};
  if(context.state==='anonymous')return {response:error(401,'AUTH_REQUIRED','Entre para continuar.')};
  let doctor:SchedulingDoctor|undefined;
  try{doctor=await resolveDoctor(context);}
  catch{return {response:error(503,'SCHEDULING_UNAVAILABLE','A agenda está temporariamente indisponível.')}}
  if(!doctor)return {response:error(403,'ACCESS_DENIED','Acesso não permitido.')};
  try{
    authorizeSession(context,permission,{appointmentDoctorUserId:doctor.userId});
    return {context,doctor};
  }catch{return {response:error(403,'ACCESS_DENIED','Acesso não permitido.')};}
}

export async function requireSchedulingPage(permission:string):Promise<{context:AuthenticatedContext;doctor:SchedulingDoctor}>{
  const context=await getSessionContext();
  if(context.state==='anonymous')redirect('/login');
  if(context.state==='unavailable')redirect('/conta');
  if(context.staffMfaRequired&&!context.sessionMfaVerified)redirect('/verificar-acesso');
  try{
    const doctor=await resolveDoctor(context);
    if(!doctor)throw new Error('scope');
    authorizeSession(context,permission,{appointmentDoctorUserId:doctor.userId});
    return {context,doctor};
  }catch{redirect('/conta');}
}

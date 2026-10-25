import 'server-only';
import {getSessionContext,type SessionContext} from './session';
import {canChangeOwnPassword,canControlOwnSessions} from '@/server/http/account-request.mjs';

type AuthenticatedContext=Extract<SessionContext,{state:'authenticated'}>;
type AccountAccess={context:AuthenticatedContext;response?:never}|{context?:never;response:Response};
const headers={'Cache-Control':'private, no-store'};
function error(status:number,code:string,message:string){return Response.json({error:{code,message}},{status,headers});}

export async function requireAccountSessionApi():Promise<AccountAccess>{
  const context=await getSessionContext();
  if(context.state==='unavailable')return {response:error(503,'AUTH_UNAVAILABLE','O acesso está temporariamente indisponível.')};
  if(context.state==='anonymous'||!canControlOwnSessions(context))return {response:error(401,'AUTH_REQUIRED','Entre para continuar.')};
  return {context};
}

export async function requireAccountPasswordApi():Promise<AccountAccess>{
  const context=await getSessionContext();
  if(context.state==='unavailable')return {response:error(503,'AUTH_UNAVAILABLE','O acesso está temporariamente indisponível.')};
  if(context.state==='anonymous'||!canChangeOwnPassword(context))return {response:error(401,'AUTH_REQUIRED','Entre para continuar.')};
  return {context};
}

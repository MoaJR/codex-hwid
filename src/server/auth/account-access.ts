import 'server-only';
import {getSessionContext,type SessionContext} from './session';
import {canControlOwnSessions} from '@/server/http/account-request.mjs';

type AuthenticatedContext=Extract<SessionContext,{state:'authenticated'}>;
type AccountAccess={context:AuthenticatedContext;response?:never}|{context?:never;response:Response};
const headers={'Cache-Control':'private, no-store'};
function error(status:number,code:string,message:string){return Response.json({error:{code,message}},{status,headers});}

export async function requireAccountSessionApi():Promise<AccountAccess>{
  const context=await getSessionContext();
  if(context.state==='unavailable')return {response:error(503,'AUTH_UNAVAILABLE','O acesso está temporariamente indisponível.')};
  if(context.state==='anonymous')return {response:error(401,'AUTH_REQUIRED','Entre para continuar.')};
  if(!canControlOwnSessions(context))return {response:error(403,'MFA_REQUIRED','Verifique este acesso para continuar.')};
  return {context};
}

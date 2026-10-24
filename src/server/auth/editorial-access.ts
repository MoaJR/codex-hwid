import 'server-only';
import {getSessionContext,type SessionContext} from './session';
import {authorizeSession} from './authorize';

type AuthenticatedContext=Extract<SessionContext,{state:'authenticated'}>;
type EditorialAccess={context:AuthenticatedContext;response?:never}|{context?:never;response:Response};

function error(status:number,code:string,message:string){
  return Response.json({error:{code,message}},{status,headers:{'Cache-Control':'no-store'}});
}

export async function requireEditorialApi(permission:string):Promise<EditorialAccess>{
  const context=await getSessionContext();
  if(context.state==='unavailable')return {response:error(503,'AUTH_UNAVAILABLE','O acesso está temporariamente indisponível.')};
  if(context.state==='anonymous')return {response:error(401,'AUTH_REQUIRED','Entre para continuar.')};
  try{authorizeSession(context,permission);return {context};}
  catch{return {response:error(403,'ACCESS_DENIED','Acesso não permitido.')};}
}

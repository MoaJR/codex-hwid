import 'server-only';
import {redirect} from 'next/navigation';
import {getSessionContext,type SessionContext} from './session';
import {authorizeSession} from './authorize';

type AuthenticatedContext=Extract<SessionContext,{state:'authenticated'}>;

export async function requireEditorialPage(permission:string):Promise<AuthenticatedContext>{
  const context=await getSessionContext();
  if(context.state==='anonymous')redirect('/login');
  if(context.state==='unavailable')redirect('/conta');
  if(context.staffMfaRequired&&!context.sessionMfaVerified)redirect('/verificar-acesso');
  let allowed=true;try{authorizeSession(context,permission);}catch{allowed=false;}
  if(!allowed)redirect('/conta');
  return context;
}

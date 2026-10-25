import 'server-only';
import {redirect} from 'next/navigation';
import {getSessionContext,type SessionContext} from './session';
import {authorizeSession} from './authorize';
import {staffMfaRedirect} from './mfa-routing.mjs';

type AuthenticatedContext=Extract<SessionContext,{state:'authenticated'}>;
type Resource={patientUserId?:string;assignedDoctorUserIds?:string[];appointmentDoctorUserId?:string};

export async function requirePanelPage():Promise<AuthenticatedContext>{
  const context=await getSessionContext();
  if(context.state==='anonymous')redirect('/login');
  if(context.state==='unavailable')redirect('/conta');
  const mfaRedirect=staffMfaRedirect({staffMfaRequired:context.staffMfaRequired,twoFactorEnabled:context.user.twoFactorEnabled,sessionMfaVerified:context.sessionMfaVerified});
  if(mfaRedirect)redirect(mfaRedirect);
  return context;
}

export async function requirePermissionPage(permission:string,resource:Resource={}):Promise<AuthenticatedContext>{
  const context=await requirePanelPage();
  try{authorizeSession(context,permission,resource);}
  catch{redirect('/painel');}
  return context;
}

export async function requirePatientPage():Promise<AuthenticatedContext>{
  const context=await requirePanelPage();
  if(!context.actor.roles.includes('PATIENT'))redirect('/painel');
  try{authorizeSession(context,'appointment.read',{patientUserId:context.actor.userId});}
  catch{redirect('/painel');}
  return context;
}

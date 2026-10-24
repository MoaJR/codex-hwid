import 'server-only';
import {headers} from 'next/headers';
import {getAuth} from './index';
import {requiresStaffMfa,hasVerifiedMfa} from './configuration.mjs';
type Role='PATIENT'|'DOCTOR'|'SECRETARY'|'ADMIN';
export type SessionContext=
  |{state:'unavailable'}
  |{state:'anonymous'}
  |{state:'authenticated';user:{id:string;name:string;email:string;twoFactorEnabled:boolean};actor:{userId:string;roles:Role[]};staffMfaRequired:boolean;sessionMfaVerified:boolean};
export async function getSessionContext():Promise<SessionContext>{
  try{
    const auth=await getAuth();if(!auth)return {state:'unavailable'};
    const session=await auth.api.getSession({headers:await headers()});
    if(!session)return {state:'anonymous'};
    const {getDb}=await import('@/server/db');const db=getDb();
    const memberships=await db.userRole.findMany({where:{userId:session.user.id},select:{role:true}});
    const roles:Role[]=memberships.map((membership:{role:Role})=>membership.role);
    const persistedSession=await db.session.findUnique({where:{token:session.session.token},select:{userId:true,createdAt:true,mfaVerifiedAt:true,expiresAt:true}});
    if(!persistedSession||persistedSession.userId!==session.user.id||persistedSession.expiresAt<=new Date())return {state:'anonymous'};
    const sessionMfaVerified=hasVerifiedMfa({twoFactorEnabled:session.user.twoFactorEnabled===true,createdAt:persistedSession.createdAt,mfaVerifiedAt:persistedSession.mfaVerifiedAt});
    return {state:'authenticated',user:{id:session.user.id,name:session.user.name,email:session.user.email,twoFactorEnabled:session.user.twoFactorEnabled===true},actor:{userId:session.user.id,roles},staffMfaRequired:requiresStaffMfa(roles),sessionMfaVerified};
  }catch{return {state:'unavailable'};}
}

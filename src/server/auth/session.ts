import 'server-only';
import {headers} from 'next/headers';
import {getAuth} from './index';
type Role='PATIENT'|'DOCTOR'|'SECRETARY'|'ADMIN';
export type SessionContext=
  |{state:'unavailable'}
  |{state:'anonymous'}
  |{state:'authenticated';user:{id:string;name:string;email:string};actor:{userId:string;roles:Role[]};session:{id:string;createdAt:Date;expiresAt:Date}};
export async function getSessionContext():Promise<SessionContext>{
  try{
    const auth=await getAuth();if(!auth)return {state:'unavailable'};
    const session=await auth.api.getSession({headers:await headers()});
    if(!session)return {state:'anonymous'};
    const {getDb}=await import('@/server/db');const db=getDb();
    const memberships=await db.userRole.findMany({where:{userId:session.user.id},select:{role:true}});
    const roles:Role[]=memberships.map((membership:{role:Role})=>membership.role);
    const persistedSession=await db.session.findUnique({where:{token:session.session.token},select:{id:true,userId:true,createdAt:true,expiresAt:true}});
    if(!persistedSession||persistedSession.userId!==session.user.id||persistedSession.expiresAt<=new Date())return {state:'anonymous'};
    return {state:'authenticated',user:{id:session.user.id,name:session.user.name,email:session.user.email},actor:{userId:session.user.id,roles},session:{id:persistedSession.id,createdAt:persistedSession.createdAt,expiresAt:persistedSession.expiresAt}};
  }catch{return {state:'unavailable'};}
}

import 'server-only';
import {authorize,AuthorizationError} from '@/server/authorization';
import type {SessionContext} from './session';
/** Use only with a context returned by getSessionContext and a server-loaded resource. */
export function authorizeSession(context:SessionContext,permission:string,resource:{patientUserId?:string;assignedDoctorUserIds?:string[];appointmentDoctorUserId?:string}={}){
  if(context.state!=='authenticated')throw new AuthorizationError();
  if(context.staffMfaRequired&&!context.sessionMfaVerified)throw new AuthorizationError();
  authorize(context.actor,permission,resource);
}

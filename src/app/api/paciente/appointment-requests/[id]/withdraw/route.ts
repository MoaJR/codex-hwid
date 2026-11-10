import {withdrawAppointmentRequest} from '@/modules/scheduling/store';
import {validateRequestDecision,validateResourceId} from '@/modules/scheduling/input.mjs';
import {enforceSchedulingRateLimit} from '@/modules/scheduling/rate-limit';
import {requirePatientSchedulingApi} from '@/server/auth/patient-scheduling-access';
import {readSchedulingJson,schedulingException,schedulingHeaders,validateSchedulingOrigin} from '@/server/http/scheduling-request';

export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function POST(request:Request,{params}:Context){
  const origin=validateSchedulingOrigin(request);if(origin)return origin;
  const access=await requirePatientSchedulingApi('appointment.request.cancel');if(access.response)return access.response;
  try{
    await enforceSchedulingRateLimit(access.context.actor.userId,'patient-request',10);
    const id=validateResourceId((await params).id);
    const {version}=validateRequestDecision(await readSchedulingJson(request));
    const item=await withdrawAppointmentRequest(access.context.actor.userId,id,version);
    return Response.json({item},{headers:schedulingHeaders});
  }catch(error){return schedulingException(error);}
}

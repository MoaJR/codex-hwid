import {createAppointmentRequest} from '@/modules/scheduling/store';
import {validateIdempotencyKey,validatePatientAppointmentRequest} from '@/modules/scheduling/input.mjs';
import {enforceSchedulingRateLimit} from '@/modules/scheduling/rate-limit';
import {requirePatientSchedulingApi} from '@/server/auth/patient-scheduling-access';
import {readSchedulingJson,schedulingException,schedulingHeaders,validateSchedulingOrigin} from '@/server/http/scheduling-request';

export const dynamic='force-dynamic';
export async function POST(request:Request){
  const origin=validateSchedulingOrigin(request);if(origin)return origin;
  const access=await requirePatientSchedulingApi('appointment.request');if(access.response)return access.response;
  try{
    await enforceSchedulingRateLimit(access.context.actor.userId,'patient-request');
    const idempotencyKey=validateIdempotencyKey(request.headers.get('idempotency-key'));
    const item=await createAppointmentRequest(access.context.actor.userId,validatePatientAppointmentRequest(await readSchedulingJson(request)),idempotencyKey);
    return Response.json({item},{status:201,headers:schedulingHeaders});
  }catch(error){return schedulingException(error);}
}

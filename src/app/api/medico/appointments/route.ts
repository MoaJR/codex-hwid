import {createAppointment} from '@/modules/scheduling/store';
import {validateAppointmentCreate,validateIdempotencyKey} from '@/modules/scheduling/input.mjs';
import {enforceSchedulingRateLimit} from '@/modules/scheduling/rate-limit';
import {requireSchedulingApi} from '@/server/auth/scheduling-access';
import {readSchedulingJson,schedulingException,schedulingHeaders,validateSchedulingOrigin} from '@/server/http/scheduling-request';

export const dynamic='force-dynamic';
export async function POST(request:Request){
  const origin=validateSchedulingOrigin(request);if(origin)return origin;
  const access=await requireSchedulingApi('appointment.write');if(access.response)return access.response;
  try{
    await enforceSchedulingRateLimit(access.context.actor.userId,'mutation');
    const idempotencyKey=validateIdempotencyKey(request.headers.get('idempotency-key'));
    const item=await createAppointment(access.doctor,validateAppointmentCreate(await readSchedulingJson(request)),idempotencyKey,access.context.actor.userId);
    return Response.json({item},{status:201,headers:schedulingHeaders});
  }catch(error){return schedulingException(error);}
}

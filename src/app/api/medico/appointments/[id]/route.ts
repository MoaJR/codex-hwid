import {rescheduleAppointment} from '@/modules/scheduling/store';
import {validateAppointmentReschedule,validateResourceId} from '@/modules/scheduling/input.mjs';
import {enforceSchedulingRateLimit} from '@/modules/scheduling/rate-limit';
import {requireSchedulingApi} from '@/server/auth/scheduling-access';
import {readSchedulingJson,schedulingException,schedulingHeaders,validateSchedulingOrigin} from '@/server/http/scheduling-request';

export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function PATCH(request:Request,{params}:Context){
  const origin=validateSchedulingOrigin(request);if(origin)return origin;
  const access=await requireSchedulingApi('appointment.write');if(access.response)return access.response;
  try{
    await enforceSchedulingRateLimit(access.context.actor.userId,'mutation');
    const id=validateResourceId((await params).id);
    const item=await rescheduleAppointment(access.doctor,id,validateAppointmentReschedule(await readSchedulingJson(request)),access.context.actor.userId);
    return Response.json({item},{headers:schedulingHeaders});
  }catch(error){return schedulingException(error);}
}

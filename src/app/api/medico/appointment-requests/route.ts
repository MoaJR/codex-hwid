import {listPendingRequests} from '@/modules/scheduling/store';
import {enforceSchedulingRateLimit} from '@/modules/scheduling/rate-limit';
import {requireSchedulingApi} from '@/server/auth/scheduling-access';
import {schedulingException,schedulingHeaders} from '@/server/http/scheduling-request';

export const dynamic='force-dynamic';
export async function GET(){
  const access=await requireSchedulingApi('appointment.read');if(access.response)return access.response;
  try{
    await enforceSchedulingRateLimit(access.context.actor.userId,'read');
    return Response.json({items:await listPendingRequests(access.doctor)},{headers:schedulingHeaders});
  }catch(error){return schedulingException(error);}
}

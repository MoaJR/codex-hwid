import {createAvailabilityException,createAvailabilityRule} from '@/modules/scheduling/store';
import {SchedulingValidationError,validateAvailabilityException,validateAvailabilityRule} from '@/modules/scheduling/input.mjs';
import {enforceSchedulingRateLimit} from '@/modules/scheduling/rate-limit';
import {requireSchedulingApi} from '@/server/auth/scheduling-access';
import {readSchedulingJson,schedulingException,schedulingHeaders,validateSchedulingOrigin} from '@/server/http/scheduling-request';

export const dynamic='force-dynamic';
export async function POST(request:Request){
  const origin=validateSchedulingOrigin(request);if(origin)return origin;
  const access=await requireSchedulingApi('availability.write');if(access.response)return access.response;
  try{
    await enforceSchedulingRateLimit(access.context.actor.userId,'mutation');
    const body=await readSchedulingJson(request);
    if(!body||typeof body!=='object'||Array.isArray(body)||!('type' in body))throw new SchedulingValidationError();
    const {type,...payload}=body as Record<string,unknown>;
    const item=type==='RULE'?await createAvailabilityRule(access.doctor,validateAvailabilityRule(payload),access.context.actor.userId):type==='EXCEPTION'?await createAvailabilityException(access.doctor,validateAvailabilityException(payload),access.context.actor.userId):(()=>{throw new SchedulingValidationError('Tipo de disponibilidade inválido.');})();
    return Response.json({item},{status:201,headers:schedulingHeaders});
  }catch(error){return schedulingException(error);}
}

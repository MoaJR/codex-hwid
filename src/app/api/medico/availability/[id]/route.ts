import {removeAvailability} from '@/modules/scheduling/store';
import {SchedulingValidationError,validateResourceId} from '@/modules/scheduling/input.mjs';
import {enforceSchedulingRateLimit} from '@/modules/scheduling/rate-limit';
import {requireSchedulingApi} from '@/server/auth/scheduling-access';
import {schedulingException,schedulingHeaders,validateSchedulingOrigin} from '@/server/http/scheduling-request';

export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function DELETE(request:Request,{params}:Context){
  const origin=validateSchedulingOrigin(request);if(origin)return origin;
  const access=await requireSchedulingApi('availability.write');if(access.response)return access.response;
  try{
    await enforceSchedulingRateLimit(access.context.actor.userId,'mutation');
    const parameters=new URL(request.url).searchParams;
    if([...parameters.keys()].some(key=>key!=='kind'))throw new SchedulingValidationError('Parâmetro não permitido.');
    const kind=parameters.get('kind');if(kind!=='rule'&&kind!=='exception')throw new SchedulingValidationError('Tipo de disponibilidade inválido.');
    await removeAvailability(access.doctor,validateResourceId((await params).id),kind,access.context.actor.userId);
    return Response.json({ok:true},{headers:schedulingHeaders});
  }catch(error){return schedulingException(error);}
}

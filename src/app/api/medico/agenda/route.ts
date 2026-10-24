import {listSchedulingWorkspace,currentSchedulingWindow} from '@/modules/scheduling/store';
import {validateScheduleRange} from '@/modules/scheduling/input.mjs';
import {enforceSchedulingRateLimit} from '@/modules/scheduling/rate-limit';
import {requireSchedulingApi} from '@/server/auth/scheduling-access';
import {schedulingException,schedulingHeaders} from '@/server/http/scheduling-request';

export const dynamic='force-dynamic';
export async function GET(request:Request){
  const access=await requireSchedulingApi('appointment.read');if(access.response)return access.response;
  try{
    await enforceSchedulingRateLimit(access.context.actor.userId,'read');
    const defaults=currentSchedulingWindow();const url=new URL(request.url);
    const range=validateScheduleRange(url.searchParams.get('from')??defaults.from,url.searchParams.get('to')??defaults.to);
    return Response.json({workspace:await listSchedulingWorkspace(access.doctor,range.from,range.to)},{headers:schedulingHeaders});
  }catch(error){return schedulingException(error);}
}

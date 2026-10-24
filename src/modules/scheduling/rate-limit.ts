import 'server-only';
import {enforceUserRateLimit} from '@/server/http/user-rate-limit';

export async function enforceSchedulingRateLimit(userId:string,scope:'read'|'mutation',limit=scope==='read'?60:10,windowSeconds=60){
  return enforceUserRateLimit(userId,`schedule:${scope}`,limit,windowSeconds);
}

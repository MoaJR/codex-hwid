import {revokeOtherSessions,CurrentSessionNotFoundError} from '@/modules/account/session-store';
import {requireAccountSessionApi} from '@/server/auth/account-access';
import {AccountRequestError,readSessionControlRequest} from '@/server/http/account-request.mjs';
import {enforceUserRateLimit,UserRateLimitError} from '@/server/http/user-rate-limit';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
function error(status:number,code:string,message:string,extraHeaders:Record<string,string>={}){
  return Response.json({error:{code,message}},{status,headers:{...headers,...extraHeaders}});
}

export async function POST(request:Request){
  try{await readSessionControlRequest(request,process.env.BETTER_AUTH_URL);}catch(reason){
    if(reason instanceof AccountRequestError)return error(reason.code==='ORIGIN_DENIED'?403:400,reason.code,reason.message);
    return error(400,'INVALID_REQUEST','Solicitação inválida.');
  }
  const access=await requireAccountSessionApi();if(access.response)return access.response;
  try{
    await enforceUserRateLimit(access.context.actor.userId,'account:session-revoke',5,60);
    const revokedCount=await revokeOtherSessions(access.context.actor.userId,access.context.session.id);
    return Response.json({revokedCount},{headers});
  }catch(reason){
    if(reason instanceof UserRateLimitError)return error(429,'RATE_LIMITED','Muitas tentativas. Aguarde e tente novamente.',{'Retry-After':String(reason.retryAfter)});
    if(reason instanceof CurrentSessionNotFoundError)return error(401,'AUTH_REQUIRED','Entre novamente para continuar.');
    return error(503,'SESSION_CONTROL_UNAVAILABLE','Não foi possível encerrar os outros acessos.');
  }
}

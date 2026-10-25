import {
  changeCredentialPassword,
  CredentialPasswordUnavailableError,
  InvalidCurrentPasswordError,
  PasswordChangeConflictError,
} from '@/modules/account/password-store';
import {CurrentSessionNotFoundError} from '@/modules/account/session-store';
import {requireAccountPasswordApi} from '@/server/auth/account-access';
import {AccountRequestError,readPasswordChangeRequest} from '@/server/http/account-request.mjs';
import {enforceUserRateLimit,UserRateLimitError} from '@/server/http/user-rate-limit';

export const dynamic='force-dynamic';
const responseHeaders={'Cache-Control':'private, no-store'};
function error(status:number,code:string,message:string,extraHeaders:Record<string,string>={}){
  return Response.json({error:{code,message}},{status,headers:{...responseHeaders,...extraHeaders}});
}

export async function POST(request:Request){
  let input:{currentPassword:string;newPassword:string};
  try{input=await readPasswordChangeRequest(request,process.env.BETTER_AUTH_URL);}
  catch(reason){
    if(reason instanceof AccountRequestError)return error(reason.code==='ORIGIN_DENIED'?403:400,reason.code,reason.message);
    return error(400,'INVALID_REQUEST','Solicitação inválida.');
  }

  const access=await requireAccountPasswordApi();
  if(access.response)return access.response;
  try{
    await enforceUserRateLimit(access.context.actor.userId,'account:password-change',5,15*60);
    const revokedCount=await changeCredentialPassword(
      access.context.actor.userId,
      access.context.session.id,
      input.currentPassword,
      input.newPassword,
    );
    return Response.json({changed:true,revokedCount},{headers:responseHeaders});
  }catch(reason){
    if(reason instanceof UserRateLimitError)return error(429,'RATE_LIMITED','Muitas tentativas. Aguarde e tente novamente.',{'Retry-After':String(reason.retryAfter)});
    if(reason instanceof InvalidCurrentPasswordError)return error(400,'INVALID_CURRENT_PASSWORD','A senha atual não foi reconhecida.');
    if(reason instanceof CredentialPasswordUnavailableError)return error(503,'PASSWORD_CHANGE_UNAVAILABLE','Não foi possível alterar a senha.');
    if(reason instanceof CurrentSessionNotFoundError)return error(401,'AUTH_REQUIRED','Entre novamente para continuar.');
    if(reason instanceof PasswordChangeConflictError)return error(409,'PASSWORD_CHANGE_CONFLICT','A conta mudou durante a solicitação. Tente novamente.');
    return error(503,'PASSWORD_CHANGE_UNAVAILABLE','Não foi possível alterar a senha.');
  }
}

import 'server-only';
import {isTrustedMutationOrigin} from './request-security.mjs';
import {SchedulingConflictError,SchedulingNotFoundError} from '@/modules/scheduling/store';
import {UserRateLimitError} from './user-rate-limit';
import {SchedulingValidationError} from '@/modules/scheduling/input.mjs';
import {AvailabilityValidationError} from '@/modules/scheduling/availability.mjs';

export const schedulingHeaders={'Cache-Control':'private, no-store'};
export function schedulingError(status:number,code:string,message:string,extraHeaders:Record<string,string>={}){
  return Response.json({error:{code,message}},{status,headers:{...schedulingHeaders,...extraHeaders}});
}
export function validateSchedulingOrigin(request:Request){
  return isTrustedMutationOrigin(request.headers.get('origin'),process.env.BETTER_AUTH_URL)?null:schedulingError(403,'ORIGIN_DENIED','Origem não permitida.');
}
export async function readSchedulingJson(request:Request){
  const contentType=request.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase();
  if(contentType!=='application/json')throw new SchedulingValidationError('Envie os dados como application/json.');
  const declared=Number(request.headers.get('content-length')??0);
  if(Number.isFinite(declared)&&declared>8192)throw new SchedulingValidationError('O corpo excede o limite permitido.');
  const text=await request.text();
  if(new TextEncoder().encode(text).byteLength>8192)throw new SchedulingValidationError('O corpo excede o limite permitido.');
  try{return JSON.parse(text) as unknown;}catch{throw new SchedulingValidationError('JSON inválido.');}
}
export function schedulingException(error:unknown){
  if(error instanceof SchedulingValidationError||error instanceof AvailabilityValidationError)return schedulingError(400,'INVALID_SCHEDULE_INPUT',error.message);
  if(error instanceof SchedulingNotFoundError)return schedulingError(404,'NOT_FOUND','Recurso não encontrado.');
  if(error instanceof SchedulingConflictError)return schedulingError(409,'SCHEDULE_CONFLICT',error.message);
  if(error instanceof UserRateLimitError)return schedulingError(429,'RATE_LIMITED','Muitas tentativas. Aguarde e tente novamente.',{'Retry-After':String(error.retryAfter)});
  return schedulingError(503,'SCHEDULING_UNAVAILABLE','A agenda está temporariamente indisponível.');
}

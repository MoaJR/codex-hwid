import {isTrustedMutationOrigin} from './request-security.mjs';

export class AccountRequestError extends Error{
  /** @param {'ORIGIN_DENIED'|'INVALID_REQUEST'} [code] @param {string} [message] */
  constructor(code='INVALID_REQUEST',message='Solicitação inválida.'){super(message);this.name='AccountRequestError';this.code=code;}
}

/** @param {{state?:string,staffMfaRequired?:boolean,sessionMfaVerified?:boolean}|null|undefined} context */
export function canControlOwnSessions(context){
  return context?.state==='authenticated'&&(!context.staffMfaRequired||context.sessionMfaVerified===true);
}

/** @param {Request} request @param {string|undefined} configuredUrl */
export async function readSessionControlRequest(request,configuredUrl){
  if(!isTrustedMutationOrigin(request.headers.get('origin'),configuredUrl))throw new AccountRequestError('ORIGIN_DENIED','Origem não permitida.');
  const contentType=request.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase();
  if(contentType!=='application/json')throw new AccountRequestError('INVALID_REQUEST','Envie os dados como application/json.');
  const declared=Number(request.headers.get('content-length')??0);
  if(Number.isFinite(declared)&&declared>1024)throw new AccountRequestError('INVALID_REQUEST','O corpo excede o limite permitido.');
  const text=await request.text();
  if(new TextEncoder().encode(text).byteLength>1024)throw new AccountRequestError('INVALID_REQUEST','O corpo excede o limite permitido.');
  let body;try{body=JSON.parse(text);}catch{throw new AccountRequestError('INVALID_REQUEST','JSON inválido.');}
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==0)throw new AccountRequestError();
  return {};
}

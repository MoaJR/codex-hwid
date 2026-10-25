import {isTrustedMutationOrigin} from './request-security.mjs';

export class AccountRequestError extends Error{
  /** @param {'ORIGIN_DENIED'|'INVALID_REQUEST'|'PASSWORD_CONFIRMATION_MISMATCH'|'PASSWORD_REUSE'} [code] @param {string} [message] */
  constructor(code='INVALID_REQUEST',message='Solicitação inválida.'){super(message);this.name='AccountRequestError';this.code=code;}
}

/** @param {{state?:string,staffMfaRequired?:boolean,sessionMfaVerified?:boolean}|null|undefined} context */
export function canControlOwnSessions(context){
  return context?.state==='authenticated'&&(!context.staffMfaRequired||context.sessionMfaVerified===true);
}

/** @param {{state?:string,staffMfaRequired?:boolean,sessionMfaVerified?:boolean,user?:{twoFactorEnabled?:boolean}}|null|undefined} context */
export function canChangeOwnPassword(context){
  if(context?.state!=='authenticated'||typeof context.user?.twoFactorEnabled!=='boolean')return false;
  if(context.staffMfaRequired||context.user?.twoFactorEnabled)return context.sessionMfaVerified===true;
  return true;
}

/** @param {Request} request @param {string|undefined} configuredUrl @param {number} maxBytes */
async function readAccountJson(request,configuredUrl,maxBytes){
  if(!isTrustedMutationOrigin(request.headers.get('origin'),configuredUrl))throw new AccountRequestError('ORIGIN_DENIED','Origem não permitida.');
  const contentType=request.headers.get('content-type')?.split(';',1)[0].trim().toLowerCase();
  if(contentType!=='application/json')throw new AccountRequestError('INVALID_REQUEST','Envie os dados como application/json.');
  const declared=Number(request.headers.get('content-length')??0);
  if(Number.isFinite(declared)&&declared>maxBytes)throw new AccountRequestError('INVALID_REQUEST','O corpo excede o limite permitido.');
  const text=await request.text();
  if(new TextEncoder().encode(text).byteLength>maxBytes)throw new AccountRequestError('INVALID_REQUEST','O corpo excede o limite permitido.');
  try{return JSON.parse(text);}catch{throw new AccountRequestError('INVALID_REQUEST','JSON inválido.');}
}

/** @param {Request} request @param {string|undefined} configuredUrl */
export async function readSessionControlRequest(request,configuredUrl){
  const body=await readAccountJson(request,configuredUrl,1024);
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==0)throw new AccountRequestError();
  return {};
}

/** @param {unknown} body */
export function validatePasswordChangeBody(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new AccountRequestError();
  const value=/** @type {Record<string,unknown>} */(body);
  const keys=Object.keys(value).sort();
  if(keys.length!==3||keys[0]!=='confirmPassword'||keys[1]!=='currentPassword'||keys[2]!=='newPassword')throw new AccountRequestError();
  const currentPassword=value.currentPassword;
  const newPassword=value.newPassword;
  const confirmPassword=value.confirmPassword;
  if(typeof currentPassword!=='string'||currentPassword.length<1||currentPassword.length>128)throw new AccountRequestError('INVALID_REQUEST','Confira a senha atual.');
  if(typeof newPassword!=='string'||newPassword.length<12||newPassword.length>128)throw new AccountRequestError('INVALID_REQUEST','A nova senha deve ter entre 12 e 128 caracteres.');
  if(typeof confirmPassword!=='string'||confirmPassword!==newPassword)throw new AccountRequestError('PASSWORD_CONFIRMATION_MISMATCH','A confirmação da nova senha não coincide.');
  if(currentPassword===newPassword)throw new AccountRequestError('PASSWORD_REUSE','Escolha uma senha diferente da atual.');
  return {currentPassword,newPassword};
}

/** @param {Request} request @param {string|undefined} configuredUrl */
export async function readPasswordChangeRequest(request,configuredUrl){
  return validatePasswordChangeBody(await readAccountJson(request,configuredUrl,1024));
}

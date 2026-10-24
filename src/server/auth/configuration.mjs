/** @param {Record<string,string|undefined>} environment */
export function inspectAuthEnvironment(environment){
  const enabled=environment.AUTH_ENABLED==='true';
  const missing=['DATABASE_URL','BETTER_AUTH_SECRET','BETTER_AUTH_URL'].filter(name=>!environment[name]?.trim());
  /** @type {string[]} */ const invalid=[];
  if(environment.BETTER_AUTH_SECRET&&environment.BETTER_AUTH_SECRET.length<32)invalid.push('BETTER_AUTH_SECRET');
  if(environment.BETTER_AUTH_URL){
    try{
      const url=new URL(environment.BETTER_AUTH_URL);
      const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
      if((url.protocol!=='https:'&&!(url.protocol==='http:'&&local))||url.username||url.password||url.search||url.hash||(url.pathname!==''&&url.pathname!=='/'))invalid.push('BETTER_AUTH_URL');
    }catch{invalid.push('BETTER_AUTH_URL');}
  }
  return {enabled,configured:enabled&&missing.length===0&&invalid.length===0,missing,invalid};
}
/** @param {readonly string[]} roles */
export function requiresStaffMfa(roles){return roles.some(role=>['DOCTOR','SECRETARY','ADMIN'].includes(role));}

/** Uses only a successful server-library result, never submitted body fields.
 * @param {string} path @param {unknown} result @param {unknown} [newSession]
 * @returns {{token:string,userId:string,action:'MFA_TOTP_VERIFIED'|'MFA_BACKUP_CODE_USED'}|null}
 */
export function verifiedMfaSession(path,result,newSession){
  if(!['/two-factor/verify-totp','/two-factor/verify-backup-code'].includes(path)||!result||typeof result!=='object')return null;
  const action=path==='/two-factor/verify-totp'?'MFA_TOTP_VERIFIED':'MFA_BACKUP_CODE_USED';
  const rotated=/** @type {{session?:{token?:unknown},user?:{id?:unknown}}} */ (newSession);
  if(typeof rotated?.session?.token==='string'&&rotated.session.token.length>0&&typeof rotated.user?.id==='string')return {token:rotated.session.token,userId:rotated.user.id,action};
  const response=/** @type {{token?:unknown,user?:{id?:unknown}}} */ (result);
  if(typeof response.token!=='string'||response.token.length===0||typeof response.user?.id!=='string')return null;
  return {token:response.token,userId:response.user.id,action};
}
/** @param {{twoFactorEnabled:boolean,createdAt:Date,mfaVerifiedAt?:Date|null}} session @param {Date} now */
export function hasVerifiedMfa(session,now=new Date()){
  return session.twoFactorEnabled&&session.mfaVerifiedAt instanceof Date&&Number.isFinite(session.mfaVerifiedAt.getTime())&&session.mfaVerifiedAt>=session.createdAt&&session.mfaVerifiedAt<=now;
}

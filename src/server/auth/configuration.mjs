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

// The application-owned endpoint projects no tokens, IP addresses or user agents
// and records revocation in AuditEvent. Disable the provider's raw equivalents.
export const disabledSessionApiPaths=Object.freeze([
  '/list-sessions','/revoke-session','/revoke-sessions','/revoke-other-sessions','/change-password',
]);


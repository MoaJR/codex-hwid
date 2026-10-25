import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {assertLocalBaseUrl,buildSummary,createPacer,defaultAccountsFile,HttpClient,parseAccounts,signIn,sleep} from './lib/local-e2e.mjs';

// Aceite do marco 4D por HTTP contra um servidor local: dois acessos, revogação
// dos outros, troca de senha com restauração e bloqueio dos endpoints crus.
// Nada aqui imprime e-mail, senha, token ou identificador de sessão.
export const operation='ACCOUNT_E2E';
export const lockFile='.e2e-account.lock';
const cooldownMs=16*60*1000;

/** @param {string[]} args */
export function parseArguments(args){
  const options={confirm:null,baseUrl:process.env.E2E_BASE_URL??'http://localhost:3000',accountsFile:process.env.E2E_ACCOUNTS_FILE??defaultAccountsFile};
  for(let index=0;index<args.length;index++){
    const flag=args[index];
    if(flag==='--confirm')options.confirm=args[++index]??null;
    else if(flag==='--base-url')options.baseUrl=args[++index]??'';
    else if(flag==='--accounts')options.accountsFile=args[++index]??'';
    else throw new Error('E2E_ARGUMENT_UNKNOWN');
  }
  return options;
}

/**
 * A troca de senha tem limite de 5 tentativas por 15 minutos. O marcador evita
 * que duas execuções próximas consumam a cota e deixem a senha local alterada.
 * @param {{now?:number,readLock?:()=>Promise<string|null>,writeLock?:()=>Promise<void>}} [deps]
 */
export async function acquireCooldown(deps={}){
  const now=deps.now??Date.now();
  const readLock=deps.readLock??(()=>readFile(lockFile,'utf8').catch(()=>null));
  const writeLock=deps.writeLock??(()=>writeFile(lockFile,new Date(now).toISOString(),{mode:0o600}));
  const previous=await readLock();
  if(previous){
    const timestamp=Date.parse(previous.trim());
    if(Number.isFinite(timestamp)&&now-timestamp<cooldownMs)throw new Error('E2E_ACCOUNT_COOLDOWN');
  }
  await writeLock();
}

/** A new local password that never appears in the output. */
export function rotatePassword(){return randomBytes(18).toString('base64url').slice(0,20);}

/** @param {HttpClient} client @param {string} currentPassword @param {string} newPassword */
async function changePassword(client,currentPassword,newPassword){
  return client.request('/api/account/password',{method:'POST',body:{currentPassword,newPassword,confirmPassword:newPassword}});
}

/** @param {HttpClient} client */
async function sessionId(client){
  const result=await client.request('/api/auth/get-session');
  return result.status===200&&result.payload?.session?.id?String(result.payload.session.id):null;
}

async function run(options){
  const baseUrl=assertLocalBaseUrl(options.baseUrl);
  if(options.confirm!=='E2E')throw new Error('E2E_CONFIRMATION_REQUIRED');
  await acquireCooldown();
  const accounts=parseAccounts(await readFile(options.accountsFile,'utf8'));
  if(!accounts.PATIENT)throw new Error('E2E_ACCOUNT_MISSING_PATIENT');
  const account=accounts.PATIENT;

  /** @type {Record<string,boolean>} */
  const checks={
    twoLogins:false,revokeOthersSucceeded:false,revokedSessionDenied:false,currentSessionPreserved:false,
    unauthenticatedRevokeRejected:false,originRequired:false,rawSessionEndpointDisabled:false,rawPasswordEndpointDisabled:false,
    wrongCurrentPasswordRejected:false,passwordChanged:false,oldPasswordRejected:false,newPasswordAccepted:false,
    passwordRestored:false,originalPasswordAccepted:false,
  };
  const pace=createPacer();
  const loginPace=createPacer(5);
  let failedStep=null;let passwordChanged=false;let passwordRestored=false;
  let activeClient=null;let rotatedPassword=null;
  const expect=(name,condition)=>{if(!condition)throw new Error(`CHECK_FAILED_${name}`);checks[name]=true;};

  try{
    const first=await signIn(baseUrl,account,loginPace);
    const second=await signIn(baseUrl,account,loginPace);
    activeClient=first;
    const firstSessionId=await sessionId(first);
    const secondSessionId=await sessionId(second);
    expect('twoLogins',Boolean(firstSessionId&&secondSessionId&&firstSessionId!==secondSessionId));

    await pace();
    const revoked=await first.request('/api/account/sessions/revoke-others',{method:'POST',body:{}});
    expect('revokeOthersSucceeded',revoked.status===200&&Number(revoked.payload?.revokedCount)>=1);
    expect('revokedSessionDenied',(await sessionId(second))===null);
    expect('currentSessionPreserved',(await sessionId(first))===firstSessionId);

    const anonymous=new HttpClient(baseUrl);
    const anonymousRevoke=await anonymous.request('/api/account/sessions/revoke-others',{method:'POST',body:{}});
    expect('unauthenticatedRevokeRejected',anonymousRevoke.status===401);

    await pace();
    const withoutOrigin=await first.request('/api/account/sessions/revoke-others',{method:'POST',body:{},origin:false});
    expect('originRequired',withoutOrigin.status===403);

    expect('rawSessionEndpointDisabled',(await first.request('/api/auth/list-sessions')).status===404);
    expect('rawPasswordEndpointDisabled',(await first.request('/api/auth/change-password',{method:'POST',body:{}})).status===404);

    rotatedPassword=rotatePassword();
    await pace();
    const wrong=await changePassword(first,`${rotatedPassword}-${rotatedPassword}`,rotatedPassword);
    expect('wrongCurrentPasswordRejected',wrong.status===400&&wrong.payload?.error?.code==='INVALID_CURRENT_PASSWORD');

    await pace();
    const changed=await changePassword(first,account.password,rotatedPassword);
    expect('passwordChanged',changed.status===200&&changed.payload?.changed===true);
    passwordChanged=true;

    const oldAttempt=await new HttpClient(baseUrl).request('/api/auth/sign-in/email',{method:'POST',body:{email:account.email,password:account.password}});
    expect('oldPasswordRejected',oldAttempt.status===401);

    const rotated=await signIn(baseUrl,{email:account.email,password:rotatedPassword},loginPace);
    activeClient=rotated;checks.newPasswordAccepted=true;

    await pace();
    const restored=await changePassword(rotated,rotatedPassword,account.password);
    if(restored.status===429){
      await sleep((restored.retryAfter??900)*1000+500);
      await pace();
      const retried=await changePassword(rotated,rotatedPassword,account.password);
      expect('passwordRestored',retried.status===200&&retried.payload?.changed===true);
    }else{
      expect('passwordRestored',restored.status===200&&restored.payload?.changed===true);
    }
    passwordRestored=true;

    await signIn(baseUrl,account,loginPace);
    checks.originalPasswordAccepted=true;
  }catch(error){
    failedStep=error instanceof Error?error.message:'UNKNOWN_FAILURE';
  }finally{
    if(passwordChanged&&!passwordRestored&&rotatedPassword&&activeClient){
      try{await pace();const restored=await changePassword(activeClient,rotatedPassword,account.password);passwordRestored=restored.status===200;}catch{/* recuperação best-effort */}
    }
    if(passwordRestored)checks.passwordRestored=true;
  }
  const summary=buildSummary(operation,checks,failedStep);
  if(passwordChanged&&!passwordRestored)summary.manualAction='ROTATE_LOCAL_PATIENT_PASSWORD';
  return summary;
}

async function main(){
  let summary;
  try{
    summary=await run(parseArguments(process.argv.slice(2)));
  }catch(error){
    const message=error instanceof Error?error.message:'UNKNOWN_FAILURE';
    summary={operation,status:'refused',reason:message};
  }
  console.log(JSON.stringify(summary));
  if(summary.status!=='ready')process.exitCode=1;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main();
}


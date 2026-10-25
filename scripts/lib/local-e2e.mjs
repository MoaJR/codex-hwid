export const localHosts=Object.freeze(['localhost','127.0.0.1','[::1]']);
export const knownRoles=Object.freeze(['DOCTOR','SECRETARY','PATIENT','ADMIN']);
export const defaultAccountsFile='.env.local.accounts';

// Base comum dos aceites automatizados. Nenhum helper aqui pode apontar para
// fora da máquina local nem imprimir credencial, identificador ou dado pessoal.

/** @param {string} value */
export function assertLocalBaseUrl(value){
  let url;
  try{url=new URL(value);}catch{throw new Error('E2E_BASE_URL_INVALID');}
  if(!['http:','https:'].includes(url.protocol)||!localHosts.includes(url.hostname)||url.username||url.password||url.search||url.hash||(url.pathname!==''&&url.pathname!=='/'))throw new Error('E2E_BASE_URL_NOT_LOCAL');
  return url.origin;
}

/**
 * Reads the fictitious local identities written by the provisioning step.
 * The file uses `email|ROLE|password` and must stay outside Git.
 * @param {string} text
 * @returns {Record<string,{email:string,password:string}>}
 */
export function parseAccounts(text){
  const accounts={};
  for(const raw of text.split(/\r?\n/)){
    const line=raw.trim();
    if(!line||line.startsWith('#'))continue;
    const [email,role,...rest]=line.split('|');
    const password=rest.join('|').trim();
    if(!email||!role||!password)continue;
    const normalizedRole=role.trim().toUpperCase();
    if(!knownRoles.includes(normalizedRole))continue;
    accounts[normalizedRole]={email:email.trim(),password};
  }
  return accounts;
}

/** Only booleans and aggregate counts may leave an acceptance script. */
export function buildSummary(operation,checks,failedStep=null){
  const failed=Object.entries(checks).filter(([,pass])=>!pass).map(([name])=>name);
  return {
    operation,
    status:failed.length===0&&!failedStep?'ready':'failed',
    checks,
    failedChecks:failed,
    ...(failedStep?{failedStep}:{}),
  };
}

export function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

/** Keeps requests under the server's per-minute budget without weakening it. */
export function createPacer(limit=8){
  let bucket=-1;let count=0;
  return async()=>{
    const current=Math.floor(Date.now()/60000);
    if(bucket!==current){bucket=current;count=0;}
    if(count>=limit){
      await sleep((bucket+1)*60000-Date.now()+250);
      bucket=Math.floor(Date.now()/60000);count=0;
    }
    count++;
  };
}

export class HttpClient{
  /** @param {string} baseUrl */
  constructor(baseUrl){this.baseUrl=baseUrl;/** @type {Map<string,string>} */this.cookies=new Map();}
  /** @param {Response} response */
  absorb(response){
    for(const raw of response.headers.getSetCookie()){
      const pair=raw.split(';',1)[0];const index=pair.indexOf('=');
      if(index<1)continue;
      const name=pair.slice(0,index).trim();const value=pair.slice(index+1).trim();
      if(!value||/(?:^|;)\s*max-age=0(?:;|$)/i.test(raw))this.cookies.delete(name);
      else this.cookies.set(name,value);
    }
  }
  cookieHeader(){return [...this.cookies].map(([name,value])=>`${name}=${value}`).join('; ');}
  /**
   * @param {string} path
   * @param {{method?:string,body?:unknown,origin?:boolean,headers?:Record<string,string>}} [options]
   */
  async request(path,options={}){
    const headers={Accept:'application/json',...options.headers};
    if(this.cookies.size>0)headers.Cookie=this.cookieHeader();
    if(options.origin!==false)headers.Origin=this.baseUrl;
    if(options.body!==undefined)headers['Content-Type']='application/json';
    const response=await fetch(`${this.baseUrl}${path}`,{
      method:options.method??'GET',
      headers,
      body:options.body===undefined?undefined:JSON.stringify(options.body),
      redirect:'manual',
    });
    this.absorb(response);
    /** @type {any} */ let payload=null;
    const text=await response.text();
    if(text){try{payload=JSON.parse(text);}catch{payload=null;}}
    const retryAfter=Number(response.headers.get('retry-after'));
    return {status:response.status,payload,...(Number.isFinite(retryAfter)&&retryAfter>0?{retryAfter}:{})};
  }
}

/** Signs in with a fresh cookie jar, waiting for the provider window on 429. */
export async function signIn(baseUrl,account,pace=async()=>{}){
  for(let attempt=0;attempt<3;attempt++){
    await pace();
    const client=new HttpClient(baseUrl);
    const result=await client.request('/api/auth/sign-in/email',{method:'POST',body:{email:account.email,password:account.password}});
    if(result.status===200)return client;
    if(result.status!==429)break;
    await sleep((result.retryAfter??60)*1000+500);
  }
  throw new Error('SIGN_IN_FAILED');
}

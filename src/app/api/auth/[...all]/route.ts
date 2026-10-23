import {getAuth} from '@/server/auth';
function unavailable(){return Response.json({error:{code:'AUTH_UNAVAILABLE',message:'O acesso está temporariamente indisponível.'}},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'60'}});}
async function handle(request:Request){
  try{const auth=await getAuth();if(!auth)return unavailable();return await auth.handler(request);}catch{return unavailable();}
}
export const GET=handle;
export const POST=handle;

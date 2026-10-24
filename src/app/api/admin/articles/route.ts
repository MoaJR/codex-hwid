import {createEditorialArticle,listEditorialArticles} from '@/modules/content/store';
import {EditorialConflictError,EditorialValidationError,validateArticleInput} from '@/modules/content/editorial.mjs';
import {requireEditorialApi} from '@/server/auth/editorial-access';
import {isTrustedMutationOrigin} from '@/server/http/request-security.mjs';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
function jsonError(status:number,code:string,message:string){return Response.json({error:{code,message}},{status,headers});}
function conflict(error:unknown){return error instanceof EditorialConflictError||(typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:unknown}).code==='P2002');}

export async function GET(){
  const access=await requireEditorialApi('content.read');if(access.response)return access.response;
  try{return Response.json({items:await listEditorialArticles()},{headers});}
  catch{return jsonError(503,'CONTENT_UNAVAILABLE','Os conteúdos estão temporariamente indisponíveis.');}
}

export async function POST(request:Request){
  if(!isTrustedMutationOrigin(request.headers.get('origin'),process.env.BETTER_AUTH_URL))return jsonError(403,'ORIGIN_DENIED','Origem não permitida.');
  const access=await requireEditorialApi('content.write');if(access.response)return access.response;
  try{
    const length=Number(request.headers.get('content-length')??0);if(length>100000)return jsonError(413,'CONTENT_TOO_LARGE','O conteúdo excede o limite permitido.');
    const input=validateArticleInput(await request.json());
    const item=await createEditorialArticle(input,access.context.actor.userId);
    return Response.json({item},{status:201,headers});
  }catch(error){
    if(error instanceof EditorialValidationError)return jsonError(400,'INVALID_CONTENT',error.message);
    if(conflict(error))return jsonError(409,'CONTENT_CONFLICT','Já existe um conteúdo com esse endereço ou ele foi alterado.');
    return jsonError(503,'CONTENT_UNAVAILABLE','Não foi possível salvar o conteúdo.');
  }
}

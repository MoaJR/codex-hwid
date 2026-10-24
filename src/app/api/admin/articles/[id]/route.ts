import {getEditorialArticle,updateEditorialArticle} from '@/modules/content/store';
import {EditorialConflictError,EditorialValidationError,validateArticleInput,validateVersion} from '@/modules/content/editorial.mjs';
import {requireEditorialApi} from '@/server/auth/editorial-access';
import {isTrustedMutationOrigin} from '@/server/http/request-security.mjs';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
type Context={params:Promise<{id:string}>};
function jsonError(status:number,code:string,message:string){return Response.json({error:{code,message}},{status,headers});}
function conflict(error:unknown){return error instanceof EditorialConflictError||(typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:unknown}).code==='P2002');}

export async function GET(_:Request,{params}:Context){
  const access=await requireEditorialApi('content.read');if(access.response)return access.response;
  try{const item=await getEditorialArticle((await params).id);return item?Response.json({item},{headers}):jsonError(404,'NOT_FOUND','Conteúdo não encontrado.');}
  catch{return jsonError(503,'CONTENT_UNAVAILABLE','O conteúdo está temporariamente indisponível.');}
}

export async function PATCH(request:Request,{params}:Context){
  if(!isTrustedMutationOrigin(request.headers.get('origin'),process.env.BETTER_AUTH_URL))return jsonError(403,'ORIGIN_DENIED','Origem não permitida.');
  const access=await requireEditorialApi('content.write');if(access.response)return access.response;
  try{
    const length=Number(request.headers.get('content-length')??0);if(length>100000)return jsonError(413,'CONTENT_TOO_LARGE','O conteúdo excede o limite permitido.');
    const body:unknown=await request.json();
    if(!body||typeof body!=='object'||Array.isArray(body))throw new EditorialValidationError();
    const version=validateVersion((body as {version?:unknown}).version);
    const item=await updateEditorialArticle((await params).id,version,validateArticleInput(body),access.context.actor.userId);
    return Response.json({item},{headers});
  }catch(error){
    if(error instanceof EditorialValidationError)return jsonError(400,'INVALID_CONTENT',error.message);
    if(conflict(error))return jsonError(409,'CONTENT_CONFLICT','O conteúdo foi alterado ou não está mais em rascunho. Atualize a página.');
    return jsonError(503,'CONTENT_UNAVAILABLE','Não foi possível salvar o conteúdo.');
  }
}

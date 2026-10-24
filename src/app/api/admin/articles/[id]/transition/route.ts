import {transitionEditorialArticle,type EditorialTransitionAction} from '@/modules/content/store';
import {EditorialConflictError,EditorialValidationError,validateVersion} from '@/modules/content/editorial.mjs';
import {requireEditorialApi} from '@/server/auth/editorial-access';
import {isTrustedMutationOrigin} from '@/server/http/request-security.mjs';

export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
const actions=new Set<EditorialTransitionAction>(['SUBMIT_REVIEW','PUBLISH','RETURN_TO_DRAFT','ARCHIVE']);
type Context={params:Promise<{id:string}>};
function jsonError(status:number,code:string,message:string){return Response.json({error:{code,message}},{status,headers});}

export async function POST(request:Request,{params}:Context){
  if(!isTrustedMutationOrigin(request.headers.get('origin'),process.env.BETTER_AUTH_URL))return jsonError(403,'ORIGIN_DENIED','Origem não permitida.');
  try{
    const body:unknown=await request.json();
    if(!body||typeof body!=='object'||Array.isArray(body))throw new EditorialValidationError();
    const action=(body as {action?:unknown}).action;
    if(typeof action!=='string'||!actions.has(action as EditorialTransitionAction))throw new EditorialValidationError('Ação inválida.');
    const permission=action==='PUBLISH'?'content.publish':action==='SUBMIT_REVIEW'?'content.submit_review':'content.write';
    const access=await requireEditorialApi(permission);if(access.response)return access.response;
    const version=validateVersion((body as {version?:unknown}).version);
    const item=await transitionEditorialArticle((await params).id,version,action as EditorialTransitionAction,access.context.actor);
    return Response.json({item},{headers});
  }catch(error){
    if(error instanceof EditorialValidationError)return jsonError(400,'INVALID_TRANSITION',error.message);
    if(error instanceof EditorialConflictError)return jsonError(409,'CONTENT_CONFLICT',error.message);
    return jsonError(503,'CONTENT_UNAVAILABLE','Não foi possível alterar o estado do conteúdo.');
  }
}

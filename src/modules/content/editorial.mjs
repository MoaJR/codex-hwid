const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const blockTypes=new Set(['paragraph','heading','list']);
const statuses=new Set(['DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED']);

/** @typedef {'SUBMIT_REVIEW'|'PUBLISH'|'RETURN_TO_DRAFT'|'ARCHIVE'} EditorialTransitionAction */
/** @typedef {{type:'paragraph'|'heading',text:string}|{type:'list',items:string[]}} ValidatedBlock */
/** @typedef {{slug:string,title:string,excerpt:string,category:string,readingMinutes:number,editorialLabel:string,reviewNotice:string,blocks:ValidatedBlock[]}} ValidatedArticleInput */

export class EditorialValidationError extends Error{
  constructor(message='Dados editoriais inválidos.'){super(message);this.name='EditorialValidationError';}
}

export class EditorialConflictError extends Error{
  constructor(message='O conteúdo foi alterado em outra sessão. Atualize a página e tente novamente.'){super(message);this.name='EditorialConflictError';}
}

/** @param {unknown} value @returns {Record<string,unknown>|null} */
function record(value){return value&&typeof value==='object'&&!Array.isArray(value)?/** @type {Record<string,unknown>} */(value):null;}
/** @param {unknown} value @param {number} min @param {number} max @param {string} label */
function line(value,min,max,label){
  if(typeof value!=='string')throw new EditorialValidationError(`${label} inválido.`);
  const normalized=value.trim().replace(/\s+/g,' ');
  if(normalized.length<min||normalized.length>max)throw new EditorialValidationError(`${label} inválido.`);
  return normalized;
}

/** @param {unknown} value @returns {ValidatedArticleInput} */
export function validateArticleInput(value){
  const input=record(value);if(!input)throw new EditorialValidationError();
  const slug=line(input.slug,2,120,'Slug').toLowerCase();
  if(!slugPattern.test(slug))throw new EditorialValidationError('Slug inválido.');
  const readingMinutes=Number(input.readingMinutes);
  if(!Number.isInteger(readingMinutes)||readingMinutes<1||readingMinutes>60)throw new EditorialValidationError('Tempo de leitura inválido.');
  if(!Array.isArray(input.blocks)||input.blocks.length<1||input.blocks.length>100)throw new EditorialValidationError('Inclua de 1 a 100 blocos.');
  let totalCharacters=0;
  const candidates=/** @type {unknown[]} */(input.blocks);
  const blocks=candidates.map((candidate,index)=>{
    const block=record(candidate);if(!block||typeof block.type!=='string'||!blockTypes.has(block.type))throw new EditorialValidationError(`Bloco ${index+1} inválido.`);
    if(block.type==='list'){
      if(!Array.isArray(block.items)||!block.items.every(item=>typeof item==='string'))throw new EditorialValidationError(`Lista ${index+1} inválida.`);
      const items=/** @type {string[]} */(block.items).map(item=>item.trim()).filter(Boolean).map(item=>line(item,1,500,`Item da lista ${index+1}`));
      if(items.length<1||items.length>30)throw new EditorialValidationError(`Lista ${index+1} inválida.`);
      totalCharacters+=items.reduce((sum,item)=>sum+item.length,0);
      return /** @type {ValidatedBlock} */({type:'list',items});
    }
    const text=line(block.text,block.type==='heading'?2:1,block.type==='heading'?180:4000,`Texto do bloco ${index+1}`);
    totalCharacters+=text.length;
    const type=block.type==='heading'?'heading':'paragraph';
    return /** @type {ValidatedBlock} */({type,text});
  });
  if(totalCharacters>50000)throw new EditorialValidationError('O conteúdo excede o limite editorial.');
  return {
    slug,
    title:line(input.title,5,160,'Título'),
    excerpt:line(input.excerpt,20,320,'Resumo'),
    category:line(input.category,2,80,'Categoria'),
    readingMinutes,
    editorialLabel:line(input.editorialLabel,2,120,'Rótulo editorial'),
    reviewNotice:line(input.reviewNotice,10,500,'Aviso de revisão'),
    blocks,
  };
}

/** @param {unknown} value */
export function validateVersion(value){
  const version=Number(value);
  if(!Number.isInteger(version)||version<1)throw new EditorialValidationError('Versão inválida.');
  return version;
}

/** @param {{status:string,action:EditorialTransitionAction,roles:string[],now?:Date}} input */
export function editorialTransition({status,action,roles,now=new Date()}){
  if(!statuses.has(status)||!Array.isArray(roles)||!Number.isFinite(now.getTime()))throw new EditorialValidationError();
  const doctor=roles.includes('DOCTOR');
  if(action==='SUBMIT_REVIEW'&&status==='DRAFT')return {status:'IN_REVIEW',reviewedAt:null,publishedAt:null};
  if(action==='PUBLISH'&&status==='IN_REVIEW'&&doctor)return {status:'PUBLISHED',reviewedAt:now,publishedAt:now};
  if(action==='RETURN_TO_DRAFT'&&status==='IN_REVIEW')return {status:'DRAFT',reviewedAt:null,publishedAt:null};
  if(action==='RETURN_TO_DRAFT'&&status==='PUBLISHED'&&doctor)return {status:'DRAFT',reviewedAt:null,publishedAt:null};
  if(action==='RETURN_TO_DRAFT'&&status==='ARCHIVED')return {status:'DRAFT',reviewedAt:null,publishedAt:null};
  if(action==='ARCHIVE'&&status==='DRAFT')return {status:'ARCHIVED',reviewedAt:null,publishedAt:null};
  if(action==='ARCHIVE'&&status==='PUBLISHED'&&doctor)return {status:'ARCHIVED',reviewedAt:null,publishedAt:null};
  throw new EditorialConflictError('A transição editorial não é permitida neste estado.');
}

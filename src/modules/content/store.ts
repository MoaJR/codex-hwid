import 'server-only';
import {randomUUID} from 'node:crypto';
import {Prisma} from '@prisma/client';
import {getDb} from '@/server/db';
import type {Article,ArticleBlock} from '@/content/articles';
import {EditorialConflictError,editorialTransition} from './editorial.mjs';

export type ArticleStatus='DRAFT'|'IN_REVIEW'|'PUBLISHED'|'ARCHIVED';
export type EditorialTransitionAction='SUBMIT_REVIEW'|'PUBLISH'|'RETURN_TO_DRAFT'|'ARCHIVE';
export type EditorialArticle=Article&{
  id:string;
  version:number;
  status:ArticleStatus;
  createdAt:string;
  updatedAt:string;
  reviewedAt?:string;
};
export type EditorialArticleSummary=Omit<EditorialArticle,'blocks'|'reviewNotice'>;
type ArticleRow={
  id:string;slug:string;title:string;excerpt:string;category:string;readingMinutes:number;
  status:ArticleStatus;editorialLabel:string;reviewNotice:string;publishedAt:Date|null;version:number;
  reviewedAt:Date|null;createdAt:Date;updatedAt:Date;
};
type BlockRow={articleId:string;position:number;type:'PARAGRAPH'|'HEADING'|'LIST';text:string|null;items:string[]};
type EditorialInput={slug:string;title:string;excerpt:string;category:string;readingMinutes:number;editorialLabel:string;reviewNotice:string;blocks:ArticleBlock[]};

function validUuid(value:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);}
function mapBlock(row:BlockRow):ArticleBlock{
  if(row.type==='LIST')return {type:'list',items:row.items};
  return {type:row.type==='HEADING'?'heading':'paragraph',text:row.text??''};
}
function mapArticle(row:ArticleRow,blocks:BlockRow[]):EditorialArticle{
  return {
    id:row.id,slug:row.slug,title:row.title,excerpt:row.excerpt,category:row.category,
    readingMinutes:row.readingMinutes,status:row.status,editorialLabel:row.editorialLabel,
    reviewNotice:row.reviewNotice,publishedAt:row.publishedAt?.toISOString(),version:row.version,
    reviewedAt:row.reviewedAt?.toISOString(),createdAt:row.createdAt.toISOString(),updatedAt:row.updatedAt.toISOString(),
    blocks:blocks.sort((a,b)=>a.position-b.position).map(mapBlock),
  };
}
async function blocksForArticles(rows:ArticleRow[]):Promise<Map<string,BlockRow[]>>{
  if(rows.length===0)return new Map();
  const db=getDb();
  const ids=Prisma.join(rows.map(row=>Prisma.sql`${row.id}::uuid`));
  const blocks=await db.$queryRaw<BlockRow[]>(Prisma.sql`
    SELECT "articleId","position","type"::text AS "type","text","items"
    FROM "ArticleBlock"
    WHERE "articleId" IN (${ids})
    ORDER BY "articleId","position"
  `);
  const grouped=new Map<string,BlockRow[]>();
  for(const block of blocks){const current=grouped.get(block.articleId)??[];current.push(block);grouped.set(block.articleId,current);}
  return grouped;
}

export async function listPublishedFromDatabase():Promise<EditorialArticle[]>{
  const db=getDb();
  const rows=await db.$queryRaw<ArticleRow[]>`
    SELECT "id","slug","title","excerpt","category","readingMinutes","status"::text AS "status",
           "editorialLabel","reviewNotice","publishedAt","version","reviewedAt","createdAt","updatedAt"
    FROM "Article"
    WHERE "status" = 'PUBLISHED' AND "publishedAt" <= CURRENT_TIMESTAMP
    ORDER BY "publishedAt" DESC,"slug" ASC
  `;
  const grouped=await blocksForArticles(rows);
  return rows.map(row=>mapArticle(row,grouped.get(row.id)??[]));
}

export async function findPublishedInDatabase(slug:string):Promise<EditorialArticle|undefined>{
  const db=getDb();
  const rows=await db.$queryRaw<ArticleRow[]>`
    SELECT "id","slug","title","excerpt","category","readingMinutes","status"::text AS "status",
           "editorialLabel","reviewNotice","publishedAt","version","reviewedAt","createdAt","updatedAt"
    FROM "Article"
    WHERE "slug" = ${slug} AND "status" = 'PUBLISHED' AND "publishedAt" <= CURRENT_TIMESTAMP
    LIMIT 1
  `;
  if(!rows[0])return undefined;
  const grouped=await blocksForArticles(rows);
  return mapArticle(rows[0],grouped.get(rows[0].id)??[]);
}

export async function listEditorialArticles():Promise<EditorialArticleSummary[]>{
  const db=getDb();
  const rows=await db.$queryRaw<ArticleRow[]>`
    SELECT "id","slug","title","excerpt","category","readingMinutes","status"::text AS "status",
           "editorialLabel","reviewNotice","publishedAt","version","reviewedAt","createdAt","updatedAt"
    FROM "Article"
    ORDER BY "updatedAt" DESC,"slug" ASC
  `;
  return rows.map(row=>{const {blocks:_,reviewNotice:__,...summary}=mapArticle(row,[]);return summary;});
}

export async function getEditorialArticle(id:string):Promise<EditorialArticle|undefined>{
  if(!validUuid(id))return undefined;
  const db=getDb();
  const rows=await db.$queryRaw<ArticleRow[]>`
    SELECT "id","slug","title","excerpt","category","readingMinutes","status"::text AS "status",
           "editorialLabel","reviewNotice","publishedAt","version","reviewedAt","createdAt","updatedAt"
    FROM "Article" WHERE "id" = ${id}::uuid LIMIT 1
  `;
  if(!rows[0])return undefined;
  const grouped=await blocksForArticles(rows);
  return mapArticle(rows[0],grouped.get(rows[0].id)??[]);
}

async function insertBlocks(transaction:Prisma.TransactionClient,articleId:string,blocks:ArticleBlock[]){
  for(const [position,block] of blocks.entries()){
    await transaction.$executeRaw`
      INSERT INTO "ArticleBlock" ("id","articleId","position","type","text","items")
      VALUES (${randomUUID()}::uuid,${articleId}::uuid,${position},${block.type.toUpperCase()}::"ArticleBlockType",
              ${'text' in block?block.text:null},${'items' in block?block.items:[]}::text[])
    `;
  }
}

export async function createEditorialArticle(input:EditorialInput,actorUserId:string):Promise<EditorialArticle>{
  if(!validUuid(actorUserId))throw new EditorialConflictError();
  const db=getDb();
  const id=randomUUID();
  await db.$transaction(async transaction=>{
    await transaction.$executeRaw`
      INSERT INTO "Article" ("id","slug","title","excerpt","category","readingMinutes","status","editorialLabel","reviewNotice","version","createdById","updatedById","createdAt","updatedAt")
      VALUES (${id}::uuid,${input.slug},${input.title},${input.excerpt},${input.category},${input.readingMinutes},'DRAFT',${input.editorialLabel},${input.reviewNotice},1,${actorUserId}::uuid,${actorUserId}::uuid,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
    `;
    await insertBlocks(transaction,id,input.blocks);
    await transaction.$executeRaw`
      INSERT INTO "AuditEvent" ("id","action","outcome","source","actorUserId","resourceType","resourceId","occurredAt")
      VALUES (${randomUUID()}::uuid,'ARTICLE_CREATED','SUCCESS','EDITORIAL_API',${actorUserId}::uuid,'ARTICLE',${id}::uuid,CURRENT_TIMESTAMP)
    `;
  });
  const created=await getEditorialArticle(id);if(!created)throw new EditorialConflictError();return created;
}

export async function updateEditorialArticle(id:string,version:number,input:EditorialInput,actorUserId:string):Promise<EditorialArticle>{
  if(!validUuid(id)||!validUuid(actorUserId))throw new EditorialConflictError();
  const db=getDb();
  await db.$transaction(async transaction=>{
    const changed=await transaction.$queryRaw<{version:number}[]>`
      UPDATE "Article"
      SET "slug"=${input.slug},"title"=${input.title},"excerpt"=${input.excerpt},"category"=${input.category},
          "readingMinutes"=${input.readingMinutes},"editorialLabel"=${input.editorialLabel},"reviewNotice"=${input.reviewNotice},
          "updatedById"=${actorUserId}::uuid,"updatedAt"=CURRENT_TIMESTAMP,"version"="version"+1
      WHERE "id"=${id}::uuid AND "version"=${version} AND "status"='DRAFT'
      RETURNING "version"
    `;
    if(changed.length!==1)throw new EditorialConflictError();
    await transaction.$executeRaw`DELETE FROM "ArticleBlock" WHERE "articleId"=${id}::uuid`;
    await insertBlocks(transaction,id,input.blocks);
    await transaction.$executeRaw`
      INSERT INTO "AuditEvent" ("id","action","outcome","source","actorUserId","resourceType","resourceId","occurredAt")
      VALUES (${randomUUID()}::uuid,'ARTICLE_UPDATED','SUCCESS','EDITORIAL_API',${actorUserId}::uuid,'ARTICLE',${id}::uuid,CURRENT_TIMESTAMP)
    `;
  });
  const updated=await getEditorialArticle(id);if(!updated)throw new EditorialConflictError();return updated;
}

const actionAudit:Record<EditorialTransitionAction,string>={SUBMIT_REVIEW:'ARTICLE_SUBMITTED_FOR_REVIEW',PUBLISH:'ARTICLE_PUBLISHED',RETURN_TO_DRAFT:'ARTICLE_RETURNED_TO_DRAFT',ARCHIVE:'ARTICLE_ARCHIVED'};
export async function transitionEditorialArticle(id:string,version:number,action:EditorialTransitionAction,actor:{userId:string;roles:string[]}):Promise<EditorialArticle>{
  if(!validUuid(id)||!validUuid(actor.userId))throw new EditorialConflictError();
  const db=getDb();
  await db.$transaction(async transaction=>{
    const locked=await transaction.$queryRaw<{status:ArticleStatus;version:number}[]>`
      SELECT "status"::text AS "status","version" FROM "Article" WHERE "id"=${id}::uuid FOR UPDATE
    `;
    if(!locked[0]||locked[0].version!==version)throw new EditorialConflictError();
    const next=editorialTransition({status:locked[0].status,action,roles:actor.roles});
    const reviewer=action==='PUBLISH'?actor.userId:null;
    const publisher=action==='PUBLISH'?actor.userId:null;
    const changed=await transaction.$queryRaw<{version:number}[]>`
      UPDATE "Article"
      SET "status"=${next.status}::"ArticleStatus","reviewedAt"=${next.reviewedAt},"publishedAt"=${next.publishedAt},
          "reviewedById"=${reviewer}::uuid,"publishedById"=${publisher}::uuid,"updatedById"=${actor.userId}::uuid,
          "updatedAt"=CURRENT_TIMESTAMP,"version"="version"+1
      WHERE "id"=${id}::uuid AND "version"=${version} AND "status"=${locked[0].status}::"ArticleStatus"
      RETURNING "version"
    `;
    if(changed.length!==1)throw new EditorialConflictError();
    await transaction.$executeRaw`
      INSERT INTO "AuditEvent" ("id","action","outcome","source","actorUserId","resourceType","resourceId","occurredAt")
      VALUES (${randomUUID()}::uuid,${actionAudit[action]},'SUCCESS','EDITORIAL_API',${actor.userId}::uuid,'ARTICLE',${id}::uuid,CURRENT_TIMESTAMP)
    `;
  });
  const updated=await getEditorialArticle(id);if(!updated)throw new EditorialConflictError();return updated;
}

import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'node:crypto';
import {sourceArticles} from '../src/content/articles-data.mjs';

export function articleSeedData(article){
  const publishedAt=article.status==='PUBLISHED'&&article.publishedAt?new Date(article.publishedAt):null;
  if(article.status==='PUBLISHED'&&(!publishedAt||!Number.isFinite(publishedAt.getTime())))throw new Error('Artigo publicado sem data válida.');
  return {
    slug:article.slug,
    title:article.title,
    excerpt:article.excerpt,
    category:article.category,
    readingMinutes:article.readingMinutes,
    status:article.status,
    editorialLabel:article.editorialLabel,
    reviewNotice:article.reviewNotice,
    publishedAt,
    blocks:{create:article.blocks.map((block,position)=>({
      position,
      type:block.type.toUpperCase(),
      text:'text' in block?block.text:null,
      items:'items' in block?block.items:[],
    }))},
  };
}

async function seed(){
  const db=new PrismaClient({log:[],errorFormat:'minimal'});
  try{
    const result=await db.$transaction(async transaction=>{
      let inserted=0;let skipped=0;
      for(const article of sourceArticles){
        const existing=await transaction.article.findUnique({where:{slug:article.slug},select:{id:true}});
        if(existing){skipped++;continue;}
        const id=randomUUID();
        await transaction.article.create({data:{id,...articleSeedData(article)}});
        await transaction.auditEvent.create({data:{action:'ARTICLE_IMPORTED',outcome:'SUCCESS',source:'TRUSTED_BUILD',resourceType:'ARTICLE',resourceId:id}});
        inserted++;
      }
      return {inserted,skipped};
    });
    console.log(JSON.stringify({operation:'ARTICLE_SOURCE_SEED',status:'complete',...result}));
  }finally{await db.$disconnect();}
}

if(import.meta.url===new URL(process.argv[1],`file://${process.cwd()}/`).href){
  seed().catch(()=>{console.error('Não foi possível importar os artigos iniciais.');process.exitCode=1;});
}

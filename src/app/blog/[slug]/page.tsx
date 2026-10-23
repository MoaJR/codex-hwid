import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {articleReader} from '@/modules/content/repository';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const article=articleReader.findBySlug(slug);return {title:article?`${article.title} | Dr. Douglas Vaz`:'Artigo não encontrado',description:article?.excerpt};}
export default async function ArticlePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;const article=articleReader.findBySlug(slug);if(!article)notFound();
  const related=articleReader.list().filter(item=>item.slug!==slug).slice(0,2);
  return <><SiteHeader/><main id="main-content"><section className="page-intro container article-intro"><Link className="text-link" href="/blog">← Todas as leituras</Link><p className="eyebrow">{article.category}</p><h1>{article.title}</h1><p>{article.excerpt}</p><div className="article-meta"><span>{article.readingMinutes} min de leitura</span><span>{article.editorialLabel}</span></div></section><section className="container section article-layout"><article className="panel article-body"><aside className="notice demo-notice">{article.reviewNotice}</aside>{article.blocks.map((block,index)=>{if(block.type==='heading')return <h2 key={index}>{block.text}</h2>;if(block.type==='list')return <ul key={index}>{block.items.map((item,i)=><li key={i}>{item}</li>)}</ul>;return <p key={index}>{block.text}</p>;})}<p className="notice">Conteúdo educativo. Não estabelece diagnóstico nem substitui avaliação individual.</p><Link href="/agendar" className="button">Conhecer o atendimento →</Link></article><aside className="panel article-sidebar"><p className="eyebrow">Continue a leitura</p>{related.map(item=><div key={item.slug}><h2><Link href={`/blog/${item.slug}`}>{item.title}</Link></h2><p>{item.excerpt}</p><Link className="text-link" href={`/blog/${item.slug}`}>Ler artigo →</Link></div>)}</aside></section></main><SiteFooter/></>;
}

import type {Metadata} from 'next';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {ArticleEditor} from '@/components/editorial/article-editor';
import {requireEditorialPage} from '@/server/auth/editorial-page';
import {getEditorialArticle} from '@/modules/content/store';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Editar conteúdo | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default async function EditContent({params}:{params:Promise<{id:string}>}){
  const context=await requireEditorialPage('content.read');
  const item=await getEditorialArticle((await params).id);if(!item)notFound();
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><Link className="text-link" href="/medico/conteudos">← Conteúdos</Link><span className="eyebrow">Área editorial</span><h1>{item.title}</h1><p>Edite rascunhos e controle cada mudança de estado de forma explícita.</p></section><section className="container section"><ArticleEditor item={item} canPublish={context.actor.roles.includes('DOCTOR')}/></section></main><SiteFooter/></>;
}

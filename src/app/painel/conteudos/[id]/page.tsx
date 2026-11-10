import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {PageHeader} from '@/components/dashboard/page-header';
import {ArticleEditor} from '@/components/editorial/article-editor';
import {requireEditorialPage} from '@/server/auth/editorial-page';
import {getEditorialArticle} from '@/modules/content/store';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Editar conteúdo | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default async function EditContent({params}:{params:Promise<{id:string}>}){
  const context=await requireEditorialPage('content.read');
  const item=await getEditorialArticle((await params).id);if(!item)notFound();
  return <>
    <PageHeader back={{href:'/painel/conteudos',label:'Conteúdos'}} eyebrow="Área editorial" title={item.title} description="Edite rascunhos e controle cada mudança de estado de forma explícita."/>
    <ArticleEditor item={item} canPublish={context.actor.roles.includes('DOCTOR')}/>
  </>;
}

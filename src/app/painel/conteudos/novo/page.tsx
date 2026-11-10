import type {Metadata} from 'next';
import {PageHeader} from '@/components/dashboard/page-header';
import {ArticleEditor} from '@/components/editorial/article-editor';
import {requireEditorialPage} from '@/server/auth/editorial-page';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Novo conteúdo | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default async function NewContent(){
  const context=await requireEditorialPage('content.write');
  return <>
    <PageHeader back={{href:'/painel/conteudos',label:'Conteúdos'}} eyebrow="Novo rascunho" title="Escreva com segurança editorial" description="O texto será salvo como rascunho. A publicação exige uma etapa separada de revisão."/>
    <ArticleEditor canPublish={context.actor.roles.includes('DOCTOR')}/>
  </>;
}

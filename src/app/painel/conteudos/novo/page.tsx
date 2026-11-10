import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {ArticleEditor} from '@/components/editorial/article-editor';
import {requireEditorialPage} from '@/server/auth/editorial-page';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Novo conteúdo | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default async function NewContent(){
  const context=await requireEditorialPage('content.write');
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><Link className="text-link" href="/medico/conteudos">← Conteúdos</Link><span className="eyebrow">Novo rascunho</span><h1>Escreva com segurança editorial.</h1><p>O texto será salvo como rascunho. A publicação exige uma etapa separada de revisão.</p></section><section className="container section"><ArticleEditor canPublish={context.actor.roles.includes('DOCTOR')}/></section></main><SiteFooter/></>;
}

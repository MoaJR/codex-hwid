import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {requireEditorialPage} from '@/server/auth/editorial-page';
import {listEditorialArticles} from '@/modules/content/store';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Conteúdos | Dr. Douglas Vaz',robots:{index:false,follow:false}};
const statusLabel={DRAFT:'Rascunho',IN_REVIEW:'Em revisão',PUBLISHED:'Publicado',ARCHIVED:'Arquivado'} as const;

export default async function ContentDashboard(){
  await requireEditorialPage('content.read');
  const items=await listEditorialArticles();
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Área editorial</span><h1>Conteúdos do blog.</h1><p>Crie rascunhos, envie para revisão e publique somente depois da validação clínica.</p><div className="form-actions"><Link className="button" href="/medico/conteudos/novo">Novo rascunho</Link><Link className="button button-outline" href="/conta">Minha conta</Link></div></section><section className="container section"><div className="editorial-list">{items.map(item=><article className="panel editorial-list-item" key={item.id}><div><span className={`status-badge status-${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span><p className="eyebrow">{item.category}</p><h2><Link href={`/medico/conteudos/${item.id}`}>{item.title}</Link></h2><p>{item.excerpt}</p></div><div className="editorial-list-meta"><span>Versão {item.version}</span><span>{new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(item.updatedAt))}</span><Link className="text-link" href={`/medico/conteudos/${item.id}`}>Abrir conteúdo →</Link></div></article>)}{items.length===0&&<div className="panel blog-empty"><h2>Nenhum conteúdo cadastrado.</h2><p>Crie o primeiro rascunho para iniciar o fluxo editorial.</p><Link className="button" href="/medico/conteudos/novo">Criar rascunho</Link></div>}</div></section></main><SiteFooter/></>;
}

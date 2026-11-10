import type {Metadata} from 'next';
import Link from 'next/link';
import {PageHeader} from '@/components/dashboard/page-header';
import {requireEditorialPage} from '@/server/auth/editorial-page';
import {listEditorialArticles} from '@/modules/content/store';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Conteúdos | Dr. Douglas Vaz',robots:{index:false,follow:false}};
const statusLabel={DRAFT:'Rascunho',IN_REVIEW:'Em revisão',PUBLISHED:'Publicado',ARCHIVED:'Arquivado'} as const;
const dateTime=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'});

export default async function ContentDashboard(){
  await requireEditorialPage('content.read');
  const items=await listEditorialArticles();
  return <>
    <PageHeader eyebrow="Site" title="Conteúdos do blog" description="Crie rascunhos, envie para revisão e publique somente depois da validação clínica." actions={<Link className="button" href="/painel/conteudos/novo">Novo rascunho</Link>}/>
    <div className="editorial-list">{items.map(item=><article className="app-card editorial-list-item" key={item.id}><div><span className={`status-badge status-${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span><p className="app-eyebrow">{item.category}</p><h2><Link href={`/painel/conteudos/${item.id}`}>{item.title}</Link></h2><p>{item.excerpt}</p></div><div className="editorial-list-meta"><span>Versão {item.version}</span><span>{dateTime.format(new Date(item.updatedAt))}</span><Link className="text-link" href={`/painel/conteudos/${item.id}`}>Abrir conteúdo →</Link></div></article>)}{items.length===0&&<div className="app-card app-empty"><h2>Nenhum conteúdo cadastrado.</h2><p>Crie o primeiro rascunho para iniciar o fluxo editorial.</p><Link className="button" href="/painel/conteudos/novo">Criar rascunho</Link></div>}</div>
  </>;
}

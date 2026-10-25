import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {listEditorialArticles} from '@/modules/content/store';
import {requirePermissionPage} from '@/server/auth/panel-access';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Administração | Dr. Douglas Vaz',robots:{index:false,follow:false}};
const statusLabel={DRAFT:'Rascunhos',IN_REVIEW:'Em revisão',PUBLISHED:'Publicados',ARCHIVED:'Arquivados'} as const;

export default async function AdminPage(){
  await requirePermissionPage('settings.manage');
  const articles=await listEditorialArticles();
  const counts={DRAFT:0,IN_REVIEW:0,PUBLISHED:0,ARCHIVED:0};
  for(const article of articles)counts[article.status]++;
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Administração</span><h1>Painel administrativo.</h1><p>Visão dos recursos administrativos habilitados para esta conta.</p><div className="form-actions"><Link className="button" href="/medico/conteudos">Gerenciar conteúdos</Link><Link className="button button-outline" href="/painel">Voltar ao painel</Link></div></section><section className="container section"><div className="admin-summary">{Object.entries(counts).map(([status,count])=><div className="panel" key={status}><strong>{count}</strong><span>{statusLabel[status as keyof typeof statusLabel]}</span></div>)}</div><div className="two-column admin-columns"><section className="panel"><p className="eyebrow">Fluxo editorial</p><h2>Conteúdos recentes</h2>{articles.slice(0,5).map(article=><div className="admin-content-row" key={article.id}><div><span className={`status-badge status-${article.status.toLowerCase()}`}>{statusLabel[article.status]}</span><h3>{article.title}</h3></div><Link className="text-link" href={`/medico/conteudos/${article.id}`}>Abrir →</Link></div>)}{articles.length===0&&<p>Nenhum conteúdo cadastrado.</p>}</section><aside className="panel soft-panel"><p className="eyebrow">Limites do acesso</p><h2>Administração sem acesso clínico.</h2><p>O perfil administrativo pode preparar conteúdos e gerenciar configurações autorizadas. Publicação clínica continua exclusiva do médico.</p><p>Agenda, dados de pacientes e prontuário não são liberados para o administrador.</p><Link className="button button-outline" href="/conta">Segurança da conta</Link></aside></div></section></main><SiteFooter/></>;
}

import type {Metadata} from 'next';
import Link from 'next/link';
import {PageHeader} from '@/components/dashboard/page-header';
import {labelsForRoles} from '@/modules/account/panel-access.mjs';
import {listEditorialArticles,type ArticleStatus} from '@/modules/content/store';
import {can} from '@/server/authorization';
import {requirePermissionPage} from '@/server/auth/panel-access';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Administração | Dr. Douglas Vaz',robots:{index:false,follow:false}};

const flow:ArticleStatus[]=['DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED'];
const statusLabel={DRAFT:'Rascunhos',IN_REVIEW:'Em revisão',PUBLISHED:'Publicados',ARCHIVED:'Arquivados'} as const;
const statusSingular={DRAFT:'Rascunho',IN_REVIEW:'Em revisão',PUBLISHED:'Publicado',ARCHIVED:'Arquivado'} as const;
const statusHint={DRAFT:'Em preparação',IN_REVIEW:'Aguardando validação',PUBLISHED:'Visíveis no site',ARCHIVED:'Fora do site'} as const;
const dateTime=new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'});
const RECENT_LIMIT=5;

export default async function AdminPage(){
  const context=await requirePermissionPage('settings.manage');
  const articles=await listEditorialArticles();
  const roles=labelsForRoles(context.actor.roles);
  const actor=context.actor;
  const counts:Record<ArticleStatus,number>={DRAFT:0,IN_REVIEW:0,PUBLISHED:0,ARCHIVED:0};
  for(const article of articles)counts[article.status]++;
  const total=articles.length;
  const percentage=(value:number)=>total===0?0:Math.round((value/total)*100);
  const lastUpdate=articles[0]?.updatedAt;
  const canEdit=can(actor,'content.write');
  // Agenda, paciente e prontuário nunca vêm do papel administrativo. A checagem
  // abaixo avalia somente ADMIN, com o próprio usuário como recurso: quando a
  // conta também é médico, a agenda abre pelo papel DOCTOR em /painel/agenda.
  const scopes=[
    {id:'edit',title:'Preparar e editar rascunhos',detail:'Criar e alterar conteúdos antes da revisão.',allowed:can(actor,'content.write')},
    {id:'review',title:'Enviar para revisão',detail:'Mover um rascunho para a fila de revisão editorial.',allowed:can(actor,'content.submit_review')},
    {id:'publish',title:'Publicar ou retirar do site',detail:'Exclusivo do médico titular; a administração não publica.',allowed:can(actor,'content.publish')},
    {id:'settings',title:'Configurações administrativas',detail:'Acesso a esta área administrativa.',allowed:can(actor,'settings.manage')},
    {id:'clinical',title:'Agenda, pacientes e prontuário',detail:'Não são concedidos pelo papel administrativo.',allowed:can({userId:actor.userId,roles:['ADMIN']},'appointment.read',{appointmentDoctorUserId:actor.userId})},
  ];
  const recent=articles.slice(0,RECENT_LIMIT);
  const remaining=articles.slice(RECENT_LIMIT);
  return <>
    <PageHeader eyebrow="Gestão" title="Administração" description="Indicadores do conteúdo editorial e os limites reais desta conta. Agenda, pacientes e prontuário não fazem parte deste módulo." meta={<div className="admin-badges" aria-label="Perfis vinculados à conta">{roles.map(role=><span className="status-badge" key={role}>{role}</span>)}</div>} actions={<><Link className="button" href="/painel/conteudos">Gerenciar conteúdos</Link><Link className="button button-outline" href="/blog">Ver blog público</Link></>}/>
    <section className="admin-shell">
      <section className="admin-block" aria-labelledby="admin-overview-title">
        <div className="admin-section-head">
          <h2 id="admin-overview-title">Visão editorial</h2>
          <p>{total===0?'Nenhum conteúdo cadastrado':`${total} ${total===1?'conteúdo':'conteúdos'} no fluxo editorial`}{lastUpdate?` · última atualização em ${dateTime.format(new Date(lastUpdate))}`:''}</p>
        </div>
        <dl className="admin-kpis">
          {flow.map(status=><div className="admin-kpi" key={status}><dt>{statusLabel[status]}</dt><dd>{counts[status]}</dd><p>{statusHint[status]}</p></div>)}
        </dl>
      </section>
      <div className="admin-grid">
        <section className="panel admin-panel" aria-labelledby="admin-flow-title">
          <div className="admin-panel-head">
            <p className="eyebrow">Distribuição</p>
            <h2 id="admin-flow-title">Fluxo editorial</h2>
            {total>0&&<p className="admin-panel-lead">Participação de cada etapa nos {total} conteúdos cadastrados.</p>}
          </div>
          {total===0?(
            <div className="admin-empty">
              <p>Nenhum conteúdo cadastrado ainda. O primeiro rascunho inicia o fluxo editorial.</p>
              {canEdit&&<Link className="button" href="/painel/conteudos/novo">Criar primeiro rascunho</Link>}
            </div>
          ):(
            <>
              <div className="admin-pipeline" aria-hidden="true">
                <div className="admin-pipeline-track">
                  {flow.filter(status=>counts[status]>0).map(status=><span className={`admin-pipeline-segment is-${status.toLowerCase()}`} style={{width:`${percentage(counts[status])}%`}} key={status}/>)}
                </div>
              </div>
              <ul className="admin-legend">
                {flow.map(status=><li key={status}><span className={`admin-legend-dot is-${status.toLowerCase()}`} aria-hidden="true"/><span className="admin-legend-label">{statusLabel[status]}</span><span className="admin-legend-value">{counts[status]} · {percentage(counts[status])}%</span></li>)}
              </ul>
            </>
          )}
          <p className="admin-note">Enviar para revisão, publicar e retirar seguem o workflow auditado. Cada alteração editorial é registrada na auditoria.</p>
        </section>
        <section className="panel admin-panel" aria-labelledby="admin-scope-title">
          <div className="admin-panel-head">
            <p className="eyebrow">Autorização por requisição</p>
            <h2 id="admin-scope-title">Alcances desta conta</h2>
            <p className="admin-panel-lead">Derivado dos papéis gravados para esta sessão. Acumular papéis não cria herança.</p>
          </div>
          <ul className="admin-scope-list">
            {scopes.map(scope=><li className="admin-scope-item" key={scope.id}><div><strong>{scope.title}</strong><p>{scope.detail}</p></div><span className={`status-badge admin-scope-state ${scope.allowed?'is-allowed':'is-denied'}`}>{scope.allowed?'Permitido':'Não concedida'}</span></li>)}
          </ul>
        </section>
      </div>
      <div className="admin-grid admin-grid-main">
        <section className="panel admin-panel" aria-labelledby="admin-content-title">
          <div className="admin-panel-head">
            <p className="eyebrow">Fila de trabalho</p>
            <h2 id="admin-content-title">Conteúdos recentes</h2>
            <p className="admin-panel-lead">{total===0?'Nada para revisar ainda.':`Os ${recent.length} mais recentes por atualização.`}</p>
          </div>
          <div className="admin-articles">
            {recent.map(article=><article className="admin-article" key={article.id}>
              <div className="admin-article-main">
                <span className={`status-badge status-${article.status.toLowerCase()}`}>{statusSingular[article.status]}</span>
                <h3><Link href={`/painel/conteudos/${article.id}`}>{article.title}</Link></h3>
                <p className="admin-article-meta">{article.category} · versão {article.version} · atualizado em {dateTime.format(new Date(article.updatedAt))}</p>
              </div>
              <div className="admin-article-actions">
                {article.status==='PUBLISHED'&&<Link className="text-link" href={`/blog/${article.slug}`}>Ver no site <span aria-hidden="true">→</span></Link>}
                <Link className="text-link" href={`/painel/conteudos/${article.id}`}>Abrir <span aria-hidden="true">→</span></Link>
              </div>
            </article>)}
          </div>
          {total===0&&<div className="admin-empty">
            <p>Nenhum conteúdo cadastrado. O blog público continua exibindo o que já está publicado.</p>
            {canEdit&&<Link className="button" href="/painel/conteudos/novo">Criar rascunho</Link>}
          </div>}
          {remaining.length>0&&<details className="admin-disclosure">
            <summary>Ver todos os {total} conteúdos</summary>
            <ul className="admin-disclosure-list">
              {remaining.map(article=><li key={article.id}><span className={`status-badge status-${article.status.toLowerCase()}`}>{statusSingular[article.status]}</span><Link href={`/painel/conteudos/${article.id}`}>{article.title}</Link><span className="admin-disclosure-meta">{dateTime.format(new Date(article.updatedAt))}</span></li>)}
            </ul>
          </details>}
        </section>
        <aside className="panel soft-panel admin-panel" aria-labelledby="admin-limits-title">
          <div className="admin-panel-head">
            <p className="eyebrow">Limites do acesso</p>
            <h2 id="admin-limits-title">Administração sem acesso clínico.</h2>
          </div>
          <p>Esta área reúne apenas conteúdo editorial e as configurações autorizadas. O perfil administrativo pode preparar conteúdos; a publicação no site continua exclusiva do médico titular.</p>
          <p>Agenda, dados de pacientes e prontuário não são liberados por herança administrativa.</p>
          <div className="admin-aside-actions">
            <Link className="button button-outline" href="/painel/conta">Segurança da conta</Link>
            <Link className="button button-outline" href="/painel">Visão geral</Link>
          </div>
        </aside>
      </div>
    </section>
  </>;
}

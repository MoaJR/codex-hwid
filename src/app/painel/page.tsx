import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {SignOutButton} from '@/components/auth/sign-out-button';
import {labelsForRoles,modulesForRoles} from '@/modules/account/panel-access.mjs';
import {requirePanelPage} from '@/server/auth/panel-access';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Painel | Dr. Douglas Vaz',robots:{index:false,follow:false}};

export default async function PanelPage(){
  const context=await requirePanelPage();
  const modules=modulesForRoles(context.actor.roles);
  const roles=labelsForRoles(context.actor.roles);
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Área segura</span><h1>Olá, {context.user.name}.</h1><p>Acesse somente os módulos liberados para o seu perfil.</p><div className="portal-meta" aria-label="Perfis vinculados">{roles.map(role=><span className="status-badge" key={role}>{role}</span>)}</div></section><section className="container section"><div className="portal-grid">{modules.map(module=><Link className="panel portal-card" href={module.href} key={module.id}><span className="portal-card-icon" aria-hidden="true">{module.symbol}</span><div><h2>{module.title}</h2><p>{module.description}</p><span className="text-link">Abrir módulo <span aria-hidden="true">→</span></span></div></Link>)}</div>{modules.length===0&&<div className="panel portal-empty"><h2>Nenhum módulo vinculado.</h2><p>Sua conta está autenticada, mas ainda não possui um perfil operacional. Procure a equipe responsável pelo acesso.</p><Link className="button button-outline" href="/conta">Abrir minha conta</Link></div>}<div className="portal-signout"><SignOutButton/></div></section></main><SiteFooter/></>;
}

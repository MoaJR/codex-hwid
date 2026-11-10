import type {Metadata} from 'next';
import Link from 'next/link';
import {Icon} from '@/components/dashboard/icons';
import {PageHeader} from '@/components/dashboard/page-header';
import {labelsForRoles,modulesForRoles,profileLabelForRoles} from '@/modules/account/panel-access.mjs';
import {requirePanelPage} from '@/server/auth/panel-access';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Visão geral | Dr. Douglas Vaz',robots:{index:false,follow:false}};

export default async function PanelPage(){
  const context=await requirePanelPage();
  const modules=modulesForRoles(context.actor.roles).filter(module=>module.id!=='overview');
  const profile=profileLabelForRoles(context.actor.roles);
  const roles=labelsForRoles(context.actor.roles);
  const firstName=context.user.name.trim().split(/\s+/)[0]||context.user.name;
  return <>
    <PageHeader eyebrow="Visão geral" title={`Olá, ${firstName}.`} description="Acesse os módulos liberados para o seu perfil." meta={<>{profile&&<span className="status-badge">{profile}</span>}<span className="visually-hidden">Papéis vinculados: {roles.join(', ')}</span></>}/>
    {modules.length>0
      ?<ul className="app-module-grid" aria-label="Módulos disponíveis">{modules.map(module=><li key={module.id}><Link className="app-module-card" href={module.href}><span className="app-module-icon"><Icon name={module.icon} size={22}/></span><span className="app-module-text"><strong>{module.title}</strong><span>{module.description}</span></span><span className="app-module-arrow" aria-hidden="true">→</span></Link></li>)}</ul>
      :<div className="app-card app-empty"><h2>Nenhum módulo vinculado.</h2><p>Sua conta está autenticada, mas ainda não possui um perfil operacional. Procure a equipe responsável pelo acesso.</p><Link className="button button-outline" href="/painel/conta">Abrir minha conta</Link></div>}
  </>;
}

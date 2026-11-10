import type {Metadata} from 'next';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {SignOutButton} from '@/components/auth/sign-out-button';
import {RevokeOtherSessionsButton} from '@/components/auth/revoke-other-sessions-button';
import {ChangePasswordForm} from '@/components/auth/change-password-form';
import {getSessionContext} from '@/server/auth/session';
import {can} from '@/server/authorization';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Minha conta | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default async function Account(){
  const context=await getSessionContext();
  if(context.state==='anonymous')redirect('/login');
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Acesso individual</span><h1>Minha conta</h1></section><section className="container section"><div className="panel auth-panel">{context.state==='unavailable'?<><h2>Acesso em configuração.</h2><p>O acesso autenticado ainda não está disponível neste ambiente. O site público continua acessível.</p><Link className="button" href="/">Voltar ao site</Link></>:<><h2>Olá, {context.user.name}.</h2><p>Sua sessão foi verificada no servidor.</p><dl className="booking-review"><div><dt>E-mail</dt><dd>{context.user.email}</dd></div></dl><div className="button-row"><Link className="button" href="/painel">Abrir painel</Link>{can(context.actor,'appointment.read',{appointmentDoctorUserId:context.actor.userId})&&<Link className="button button-outline" href="/medico/agenda">Abrir agenda</Link>}{can(context.actor,'content.read')&&<Link className="button button-outline" href="/medico/conteudos">Gerenciar conteúdos</Link>}{can(context.actor,'settings.manage')&&<Link className="button button-outline" href="/admin">Administração</Link>}</div><p className="notice">Esta página gerencia apenas identidade e segurança da conta. Ela não oferece acesso a prontuários ou outros dados clínicos.</p><section className="account-security" aria-labelledby="account-security-title"><h3 id="account-security-title">Segurança da conta</h3><div className="account-security-action"><h4>Sessões conectadas</h4><p>Se você não reconhecer outro acesso, encerre todas as demais sessões. Este acesso será preservado e a ação ficará registrada para sua segurança.</p><RevokeOtherSessionsButton/></div><div className="account-security-action"><h4>Alterar senha</h4><p>Confirme a senha atual para definir uma nova. A alteração preserva este acesso, encerra os demais e fica registrada na auditoria.</p><ChangePasswordForm/></div></section><SignOutButton/></>}</div></section></main><SiteFooter/></>;
}

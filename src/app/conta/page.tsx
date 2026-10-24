import type {Metadata} from 'next';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {SignOutButton} from '@/components/auth/sign-out-button';
import {RevokeOtherSessionsButton} from '@/components/auth/revoke-other-sessions-button';
import {TwoFactorSetup} from '@/components/auth/two-factor-setup';
import {getSessionContext} from '@/server/auth/session';
import {can} from '@/server/authorization';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Minha conta | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default async function Account(){
  const context=await getSessionContext();
  if(context.state==='anonymous')redirect('/login');
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Acesso individual</span><h1>Minha conta</h1></section><section className="container section"><div className="panel auth-panel">{context.state==='unavailable'?<><h2>Acesso em configuração.</h2><p>O acesso autenticado ainda não está disponível neste ambiente. O site público e a demonstração continuam acessíveis.</p><Link className="button" href="/">Voltar ao site</Link></>:<><h2>Olá, {context.user.name}.</h2><p>Sua sessão foi verificada no servidor.</p><dl className="booking-review"><div><dt>E-mail</dt><dd>{context.user.email}</dd></div><div><dt>Verificação em duas etapas</dt><dd>{context.user.twoFactorEnabled?'Ativada':'Ainda não ativada'}</dd></div></dl>{!context.user.twoFactorEnabled&&<TwoFactorSetup/>}{context.user.twoFactorEnabled&&context.staffMfaRequired&&!context.sessionMfaVerified&&<p className="notice demo-notice">Esta sessão precisa concluir a verificação em duas etapas antes de receber acesso a módulos administrativos ou clínicos. <Link className="text-link" href="/verificar-acesso">Verificar agora →</Link></p>}<div className="button-row">{context.sessionMfaVerified&&can(context.actor,'appointment.read',{appointmentDoctorUserId:context.actor.userId})&&<Link className="button" href="/medico/agenda">Abrir agenda</Link>}{context.sessionMfaVerified&&can(context.actor,'content.read')&&<Link className="button button-outline" href="/medico/conteudos">Gerenciar conteúdos</Link>}</div><p className="notice">A agenda está em validação controlada com identidades fictícias. Esta tela não oferece acesso a prontuários ou outros dados clínicos.</p>{(!context.staffMfaRequired||context.sessionMfaVerified)&&<section className="account-security" aria-labelledby="account-security-title"><h3 id="account-security-title">Segurança da conta</h3><p>Se você não reconhecer outro acesso, encerre todas as demais sessões. Este acesso será preservado e a ação ficará registrada para sua segurança.</p><RevokeOtherSessionsButton/></section>}<SignOutButton/></>}</div></section></main><SiteFooter/></>;
}

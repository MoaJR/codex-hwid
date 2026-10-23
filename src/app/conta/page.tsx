import type {Metadata} from 'next';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {SignOutButton} from '@/components/auth/sign-out-button';
import {getSessionContext} from '@/server/auth/session';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Minha conta | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default async function Account(){
  const context=await getSessionContext();
  if(context.state==='anonymous')redirect('/login');
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Acesso individual</span><h1>Minha conta</h1></section><section className="container section"><div className="panel auth-panel">{context.state==='unavailable'?<><h2>Acesso em configuração.</h2><p>O acesso autenticado ainda não está disponível neste ambiente. O site público e a demonstração continuam acessíveis.</p><Link className="button" href="/">Voltar ao site</Link></>:<><h2>Olá, {context.user.name}.</h2><p>Sua sessão foi verificada no servidor.</p><dl className="booking-review"><div><dt>E-mail</dt><dd>{context.user.email}</dd></div><div><dt>Verificação em duas etapas</dt><dd>{context.user.twoFactorEnabled?'Ativada':'Ainda não ativada'}</dd></div></dl>{context.staffMfaRequired&&!context.sessionMfaVerified&&<p className="notice demo-notice">Esta sessão precisa concluir a verificação em duas etapas antes de receber acesso a módulos administrativos ou clínicos.</p>}<p className="notice">Os portais operacionais ainda estão em implementação. Esta tela não oferece acesso a prontuários ou dados clínicos.</p><SignOutButton/></>}</div></section></main><SiteFooter/></>;
}

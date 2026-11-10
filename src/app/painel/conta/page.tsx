import type {Metadata} from 'next';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import {PageHeader} from '@/components/dashboard/page-header';
import {RevokeOtherSessionsButton} from '@/components/auth/revoke-other-sessions-button';
import {ChangePasswordForm} from '@/components/auth/change-password-form';
import {getSessionContext} from '@/server/auth/session';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Minha conta | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default async function Account(){
  const context=await getSessionContext();
  if(context.state==='anonymous')redirect('/login');
  if(context.state==='unavailable')return <div className="container section"><div className="panel auth-panel"><h1>Acesso em configuração.</h1><p>O acesso autenticado ainda não está disponível neste ambiente. O site público continua acessível.</p><Link className="button" href="/">Voltar ao site</Link></div></div>;
  return <>
    <PageHeader eyebrow="Acesso individual" title="Minha conta" description="Identidade e segurança do seu acesso. Esta página não oferece acesso a prontuários ou outros dados clínicos."/>
    <div className="app-stack">
      <section className="app-card" aria-labelledby="account-identity-title">
        <h2 id="account-identity-title">Identificação</h2>
        <dl className="app-definition"><div><dt>Nome</dt><dd>{context.user.name}</dd></div><div><dt>E-mail</dt><dd>{context.user.email}</dd></div></dl>
      </section>
      <section className="app-card account-security" aria-labelledby="account-security-title">
        <h2 id="account-security-title">Segurança da conta</h2>
        <div className="account-security-action"><h3>Sessões conectadas</h3><p>Se você não reconhecer outro acesso, encerre todas as demais sessões. Este acesso será preservado e a ação ficará registrada para sua segurança.</p><RevokeOtherSessionsButton/></div>
        <div className="account-security-action"><h3>Alterar senha</h3><p>Confirme a senha atual para definir uma nova. A alteração preserva este acesso, encerra os demais e fica registrada na auditoria.</p><ChangePasswordForm/></div>
      </section>
    </div>
  </>;
}

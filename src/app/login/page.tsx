import type {Metadata} from 'next';
import {LoginForm} from '@/components/auth/login-form';
import {SiteHeader, SiteFooter} from '@/components/site/site-shell';
import {getAuthConfigurationStatus} from '@/server/auth/config';

export const metadata:Metadata = {
  title:'Entrar | Dr. Douglas Vaz',
  description:'Acesso à plataforma do consultório Dr. Douglas Vaz.',
  robots:{index:false,follow:false},
};
export const dynamic = 'force-dynamic';

export default async function LoginPage(){
  const {configured} = await getAuthConfigurationStatus();
  return <><SiteHeader/><main id="main-content"><section className="page-intro container"><p className="eyebrow">Seu espaço de cuidado</p><h1>Bem-vindo ao seu acompanhamento.</h1><p>Entre para acessar os recursos disponíveis para sua conta.</p></section><section className="container content-section"><div className="content-grid"><div className="panel"><h2>Entrar na plataforma</h2><LoginForm configured={configured}/></div><aside className="panel soft-panel"><p className="eyebrow">Antes de começar</p><h2>Seu acesso é individual.</h2><p>Mantenha suas credenciais em sigilo e utilize um dispositivo de confiança. A disponibilidade de recursos depende das permissões vinculadas à sua conta.</p><p className="body-copy">Depois da entrada, o painel apresenta somente os módulos autorizados para paciente, médico, secretaria ou administrador.</p><p className="notice">Este canal não oferece atendimento de emergência.</p></aside></div></section></main><SiteFooter/></>;
}

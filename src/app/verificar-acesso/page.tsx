import type {Metadata} from 'next';
import Link from 'next/link';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {VerifyForm} from '@/components/auth/verify-form';
import {getAuthConfigurationStatus} from '@/server/auth/config';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Verificar acesso | Dr. Douglas Vaz',robots:{index:false,follow:false}};
export default function Verify(){return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Verificação em duas etapas</span><h1>Confirme seu acesso.</h1><p>Use o aplicativo autenticador ou um dos códigos de recuperação guardados durante a ativação.</p></section><section className="container section"><div className="panel auth-panel"><VerifyForm configured={getAuthConfigurationStatus().configured}/><Link href="/login" className="text-link">Voltar para entrar →</Link></div></section></main><SiteFooter/></>}

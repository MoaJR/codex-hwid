import type { Metadata } from 'next';
import Link from 'next/link';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {treatments} from '@/content/treatments';
export const metadata:Metadata={title:'Tratamentos | Dr. Douglas Vaz'};
export default function Treatments(){return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Áreas de cuidado</span><h1>Compreender é o primeiro passo.</h1><p>Informação para ajudar você a reconhecer quando buscar uma avaliação. Cada acompanhamento começa por uma conversa individual.</p></section><section className="container section"><div className="treatment-grid treatment-directory">{treatments.map(t=><Link className="panel treatment-card" key={t.slug} href={`/tratamentos/${t.slug}`}><h2>{t.title}</h2><p>{t.intro}</p><span>Saiba mais ↗</span></Link>)}</div><p className="notice">Conteúdo educativo. Os sinais apresentados não estabelecem diagnóstico e podem ter diferentes causas.</p></section></main><SiteFooter/></>}

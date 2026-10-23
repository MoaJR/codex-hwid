import type {Metadata} from 'next';
import {SiteHeader,SiteFooter} from '@/components/site/site-shell';
import {BookingFlow} from '@/components/booking/booking-flow';
import {getDemoDates} from '@/components/booking/selection.mjs';
export const metadata:Metadata={title:'Conheça o agendamento | Dr. Douglas Vaz'};
export const dynamic='force-dynamic';
export default function Schedule(){return <><SiteHeader/><main id="main-content"><section className="page-intro container"><span className="eyebrow">Um passo de cada vez</span><h1>Reserve um espaço para você.</h1><p>Conheça as etapas previstas para escolher seu atendimento.</p></section><section className="container section booking-container"><div className="notice demo-notice"><strong>Agendamento demonstrativo.</strong> Nenhuma data representa disponibilidade real e nenhuma consulta será reservada.</div><BookingFlow dates={getDemoDates()}/></section></main><SiteFooter/></>}

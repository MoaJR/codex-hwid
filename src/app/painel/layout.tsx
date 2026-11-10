import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {AppShell} from '@/components/dashboard/app-shell';
import {SiteHeader} from '@/components/site/site-shell';
import {labelsForRoles,mobileNavigationForRoles,navigationForRoles,profileLabelForRoles} from '@/modules/account/panel-access.mjs';
import {getSessionContext} from '@/server/auth/session';

export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Painel | Dr. Douglas Vaz',robots:{index:false,follow:false}};

// A casca só decide a apresentação. Visitante vai ao login; cada página mantém o
// guard de permissão próprio e a autorização nunca depende deste menu.
export default async function PanelLayout({children}:{children:React.ReactNode}){
  const context=await getSessionContext();
  if(context.state==='anonymous')redirect('/login');
  if(context.state==='unavailable')return <><SiteHeader/><main id="main-content">{children}</main></>;
  const roles=context.actor.roles;
  const profile=profileLabelForRoles(roles)??labelsForRoles(roles).join(' · ');
  return <AppShell navigation={navigationForRoles(roles)} mobileNavigation={mobileNavigationForRoles(roles)} userName={context.user.name} profileLabel={profile||null}>{children}</AppShell>;
}

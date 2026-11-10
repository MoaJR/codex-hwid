'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {SignOutButton} from '@/components/auth/sign-out-button';
import {sectionForPath} from '@/modules/account/panel-access.mjs';
import {Icon} from './icons';

export type NavItem={id:string;title:string;href:string;icon:string};
export type NavGroup={label:string;items:NavItem[]};
export type MobileNavItem=NavItem&{shortTitle?:string};
export type MobileNavigation={items:MobileNavItem[];hasMore:boolean};
type Props={navigation:NavGroup[];mobileNavigation:MobileNavigation;userName:string;profileLabel:string|null;children:ReactNode};

const DESKTOP_QUERY='(min-width: 901px)';
const COLLAPSE_KEY='painel:sidebar';

function isActive(pathname:string,href:string){
  if(href==='/painel')return pathname==='/painel';
  return pathname===href||pathname.startsWith(`${href}/`);
}
function initials(name:string){
  const parts=name.trim().split(/\s+/).filter(Boolean);
  const letters=(parts[0]?.[0]??'')+(parts.length>1?parts[parts.length-1][0]:'');
  return letters.toUpperCase()||'?';
}

/**
 * Casca do dashboard: menu lateral fixo e recolhível no desktop e gaveta no
 * mobile, com barra inferior de destinos frequentes. Somente estado de
 * abertura, recolhimento e item ativo vivem aqui; o conteúdo continua sendo
 * Server Component recebido por `children`. O menu espelha as permissões, mas
 * não as concede: cada rota tem o próprio guard server-side.
 */
export function AppShell({navigation,mobileNavigation,userName,profileLabel,children}:Props){
  const pathname=usePathname();
  const [open,setOpen]=useState(false);
  // Recolhimento começa expandido no SSR e é restaurado após a montagem: nenhum
  // atributo dependente do navegador entra no HTML, então não há mismatch de
  // hidratação. As transições só ligam depois de restaurar a preferência.
  const [collapsed,setCollapsed]=useState(false);
  const [ready,setReady]=useState(false);
  const toggleRef=useRef<HTMLButtonElement>(null);
  const sidebarRef=useRef<HTMLElement>(null);
  const wasOpen=useRef(false);

  const close=useCallback(()=>setOpen(false),[]);

  const section=sectionForPath(navigation,pathname);

  useEffect(()=>{
    try{setCollapsed(window.localStorage.getItem(COLLAPSE_KEY)==='collapsed');}catch{/* preferência indisponível */}
    setReady(true);
  },[]);

  useEffect(()=>{
    if(!ready)return;
    try{window.localStorage.setItem(COLLAPSE_KEY,collapsed?'collapsed':'expanded');}catch{/* preferência indisponível */}
  },[collapsed,ready]);

  useEffect(()=>{setOpen(false);},[pathname]);

  useEffect(()=>{
    if(!open)return;
    function onKey(event:KeyboardEvent){if(event.key==='Escape')setOpen(false);}
    const media=window.matchMedia(DESKTOP_QUERY);
    function onChange(event:MediaQueryListEvent){if(event.matches)setOpen(false);}
    document.addEventListener('keydown',onKey);
    media.addEventListener('change',onChange);
    sidebarRef.current?.querySelector<HTMLElement>('a[href]')?.focus();
    return()=>{document.removeEventListener('keydown',onKey);media.removeEventListener('change',onChange);};
  },[open]);

  // Devolve o foco ao botão que abriu a gaveta quando ela fecha.
  useEffect(()=>{
    if(wasOpen.current&&!open)toggleRef.current?.focus();
    wasOpen.current=open;
  },[open]);

  return <div className="app-shell" data-open={open?'true':'false'} data-collapsed={collapsed?'true':'false'} data-ready={ready?'true':'false'} data-mobile-nav={mobileNavigation.items.length>0?'true':'false'}>
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <aside id="app-sidebar" ref={sidebarRef} className="app-sidebar" aria-label="Menu do painel">
      <div className="app-sidebar-head">
        <Link className="app-brand" href="/painel" aria-label="Douglas Vaz — visão geral do painel">
          <span className="app-brand-mark" aria-hidden="true">DV</span>
          <span className="app-brand-text">Douglas Vaz<small>Psiquiatria</small></span>
        </Link>
        <button type="button" className="app-icon-button app-sidebar-collapse" onClick={()=>setCollapsed(current=>!current)} aria-label={collapsed?'Expandir menu':'Recolher menu'} aria-expanded={!collapsed} aria-controls="app-sidebar"><Icon name={collapsed?'expand':'collapse'}/></button>
        <button type="button" className="app-icon-button app-sidebar-close" onClick={close} aria-label="Fechar menu"><Icon name="close"/></button>
      </div>
      <nav className="app-nav" aria-label="Navegação principal do painel">
        {navigation.map(group=><div className="app-nav-group" key={group.label}>
          <p className="app-nav-label" id={`nav-${group.label}`}>{group.label}</p>
          <ul aria-labelledby={`nav-${group.label}`}>
            {group.items.map(item=>{
              const active=isActive(pathname,item.href);
              return <li key={item.id}><Link className="app-nav-link" href={item.href} aria-current={active?'page':undefined} data-active={active?'true':'false'} title={collapsed?item.title:undefined}><Icon name={item.icon}/><span>{item.title}</span></Link></li>;
            })}
          </ul>
        </div>)}
      </nav>
      <div className="app-sidebar-foot">
        <Link className="app-nav-link" href="/" title={collapsed?'Ver site público':undefined}><Icon name="external"/><span>Ver site público</span></Link>
        <div className="app-user">
          <span className="app-avatar" aria-hidden="true">{initials(userName)}</span>
          <div className="app-user-text"><strong>{userName}</strong>{profileLabel&&<span>{profileLabel}</span>}</div>
        </div>
        <SignOutButton/>
      </div>
    </aside>
    <button type="button" className="app-scrim" tabIndex={-1} aria-hidden="true" onClick={close}/>
    <div className="app-body" inert={open}>
      <header className="app-topbar">
        <button ref={toggleRef} type="button" className="app-icon-button app-menu-toggle" onClick={()=>setOpen(true)} aria-label="Abrir menu" aria-expanded={open} aria-controls="app-sidebar"><Icon name="menu"/></button>
        <span className="app-topbar-title">{section?section.title:'Painel'}</span>
        <span className="app-topbar-user" aria-hidden="true">{initials(userName)}</span>
      </header>
      <main id="main-content" className="app-content" tabIndex={-1}>{children}</main>
      {mobileNavigation.items.length>0&&<nav className="app-bottom-nav" aria-label="Navegação rápida do painel">
        <ul>
          {mobileNavigation.items.map(item=>{
            const active=isActive(pathname,item.href);
            return <li key={item.id}><Link href={item.href} aria-current={active?'page':undefined} data-active={active?'true':'false'}><Icon name={item.icon}/><span>{item.shortTitle??item.title}</span></Link></li>;
          })}
          {mobileNavigation.hasMore&&<li><button type="button" onClick={()=>setOpen(true)} aria-controls="app-sidebar" aria-expanded={open} aria-label="Mais opções do menu"><Icon name="menu"/><span>Mais</span></button></li>}
        </ul>
      </nav>}
    </div>
  </div>;
}


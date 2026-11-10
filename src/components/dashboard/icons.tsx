import type {ReactNode} from 'react';

// Ícones de interface em traço único (24×24, stroke 1.75). São decorativos:
// o nome acessível vem sempre do texto vizinho, por isso `aria-hidden`.
const paths:Record<string,ReactNode>={
  home:<><path d="M4 11.5 12 5l8 6.5"/><path d="M6 10.5V19h12v-8.5"/><path d="M10 19v-5h4v5"/></>,
  heart:<path d="M12 19.5s-7-4.2-7-9.6A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7 2.3c0 5.4-7 9.6-7 9.6Z"/>,
  calendar:<><rect x="4" y="5.5" width="16" height="14" rx="2.5"/><path d="M8 3.5v4M16 3.5v4M4 10h16"/></>,
  article:<><path d="M7 4h8l4 4v12H7z"/><path d="M15 4v4h4M10 12h6M10 16h6"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4"/></>,
  user:<><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5"/></>,
  logout:<><path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10"/><path d="M14 8l4 4-4 4M18 12H9"/></>,
  menu:<path d="M4 7h16M4 12h16M4 17h16"/>,
  close:<path d="M6 6l12 12M18 6 6 18"/>,
  external:<><path d="M14 5h5v5M19 5l-8 8"/><path d="M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4"/></>,
};

export type IconName=keyof typeof paths;

export function Icon({name,size=20}:{name:string;size?:number}){
  const shape=paths[name];
  if(!shape)return null;
  return <svg className="app-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{shape}</svg>;
}

import Link from 'next/link';
import type {ReactNode} from 'react';

type Props={title:string;eyebrow?:string;description?:string;back?:{href:string;label:string};meta?:ReactNode;actions?:ReactNode};

export function PageHeader({title,eyebrow,description,back,meta,actions}:Props){
  return <header className="app-page-header">
    <div className="app-page-header-text">
      {back&&<Link className="text-link app-back" href={back.href}><span aria-hidden="true">←</span> {back.label}</Link>}
      {eyebrow&&<p className="app-eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description&&<p className="app-page-lead">{description}</p>}
      {meta&&<div className="app-page-meta">{meta}</div>}
    </div>
    {actions&&<div className="app-page-actions">{actions}</div>}
  </header>;
}

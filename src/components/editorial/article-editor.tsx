'use client';

import {useState,type FormEvent} from 'react';
import Link from 'next/link';
import type {ArticleBlock} from '@/content/articles';
import type {EditorialArticle,EditorialTransitionAction} from '@/modules/content/store';

type Props={item?:EditorialArticle;canPublish:boolean};
const statusLabel={DRAFT:'Rascunho',IN_REVIEW:'Em revisão',PUBLISHED:'Publicado',ARCHIVED:'Arquivado'} as const;
const genericError='Não foi possível concluir a operação. Atualize a página e tente novamente.';

function errorMessage(value:unknown){
  if(!value||typeof value!=='object')return genericError;
  const error=(value as {error?:unknown}).error;
  return error&&typeof error==='object'&&typeof (error as {message?:unknown}).message==='string'?(error as {message:string}).message:genericError;
}
function emptyBlock(type:ArticleBlock['type']):ArticleBlock{return type==='list'?{type,items:['']}:{type,text:''};}

export function ArticleEditor({item,canPublish}:Props){
  const [blocks,setBlocks]=useState<ArticleBlock[]>(item?.blocks??[emptyBlock('paragraph')]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const editable=!item||item.status==='DRAFT';

  function replaceBlock(index:number,block:ArticleBlock){setBlocks(current=>current.map((value,position)=>position===index?block:value));}
  function move(index:number,direction:-1|1){setBlocks(current=>{const target=index+direction;if(target<0||target>=current.length)return current;const next=[...current];[next[index],next[target]]=[next[target],next[index]];return next;});}
  function remove(index:number){setBlocks(current=>current.length===1?current:current.filter((_,position)=>position!==index));}

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy||!editable)return;setBusy(true);setMessage('');
    const form=new FormData(event.currentTarget);
    const payload={
      slug:String(form.get('slug')??''),title:String(form.get('title')??''),excerpt:String(form.get('excerpt')??''),
      category:String(form.get('category')??''),readingMinutes:Number(form.get('readingMinutes')),
      editorialLabel:String(form.get('editorialLabel')??''),reviewNotice:String(form.get('reviewNotice')??''),
      blocks,...(item?{version:item.version}:{}),
    };
    try{
      const response=await fetch(item?`/api/admin/articles/${item.id}`:'/api/admin/articles',{method:item?'PATCH':'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const data:unknown=await response.json();if(!response.ok){setMessage(errorMessage(data));return;}
      const saved=data&&typeof data==='object'?(data as {item?:unknown}).item:undefined;
      const id=saved&&typeof saved==='object'&&'id' in saved&&typeof saved.id==='string'?saved.id:item?.id;
      if(id)window.location.assign(`/medico/conteudos/${id}`);else setMessage(genericError);
    }catch{setMessage(genericError);}finally{setBusy(false);}
  }

  async function transition(action:EditorialTransitionAction){
    if(!item||busy)return;
    const warnings:Partial<Record<EditorialTransitionAction,string>>={PUBLISH:'Publicar este texto no blog agora?',RETURN_TO_DRAFT:item.status==='PUBLISHED'?'Retirar este texto do blog e voltar ao rascunho?':undefined,ARCHIVE:'Arquivar este rascunho?'};
    if(warnings[action]&&!window.confirm(warnings[action]))return;
    setBusy(true);setMessage('');
    try{
      const response=await fetch(`/api/admin/articles/${item.id}/transition`,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,version:item.version})});
      const data:unknown=await response.json();if(!response.ok){setMessage(errorMessage(data));return;}
      window.location.reload();
    }catch{setMessage(genericError);}finally{setBusy(false);}
  }

  return <div className="editorial-workspace">
    {item&&<div className="editorial-status"><span className={`status-badge status-${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span><span>Versão {item.version}</span><span>Atualizado em {new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(item.updatedAt))}</span></div>}
    {!editable&&<p className="notice">Para editar campos e blocos, devolva este conteúdo ao rascunho. A versão publicada permanece estável até essa ação explícita.</p>}
    <form onSubmit={save} aria-busy={busy}>
      <fieldset disabled={!editable||busy}>
        <div className="form-grid">
          <div><label htmlFor="article-title">Título</label><input id="article-title" name="title" required minLength={5} maxLength={160} defaultValue={item?.title}/></div>
          <div><label htmlFor="article-slug">Endereço do artigo</label><input id="article-slug" name="slug" required minLength={2} maxLength={120} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="titulo-do-artigo" defaultValue={item?.slug}/></div>
          <div><label htmlFor="article-category">Categoria</label><input id="article-category" name="category" required minLength={2} maxLength={80} defaultValue={item?.category}/></div>
          <div><label htmlFor="article-minutes">Minutos de leitura</label><input id="article-minutes" name="readingMinutes" type="number" required min={1} max={60} defaultValue={item?.readingMinutes??3}/></div>
        </div>
        <label htmlFor="article-excerpt">Resumo</label><textarea id="article-excerpt" name="excerpt" required minLength={20} maxLength={320} defaultValue={item?.excerpt}/>
        <div className="form-grid">
          <div><label htmlFor="article-label">Rótulo editorial</label><input id="article-label" name="editorialLabel" required minLength={2} maxLength={120} defaultValue={item?.editorialLabel??'Conteúdo educativo'}/></div>
          <div><label htmlFor="article-notice">Aviso de revisão</label><textarea id="article-notice" name="reviewNotice" required minLength={10} maxLength={500} defaultValue={item?.reviewNotice??'Informação educativa; não substitui avaliação individual.'}/></div>
        </div>
        <section className="editorial-blocks" aria-labelledby="article-blocks-title"><div className="section-heading"><div><p className="eyebrow">Estrutura</p><h2 id="article-blocks-title">Blocos do artigo</h2></div><div className="button-row"><button type="button" className="button button-outline" onClick={()=>setBlocks(current=>[...current,emptyBlock('heading')])}>+ Título</button><button type="button" className="button button-outline" onClick={()=>setBlocks(current=>[...current,emptyBlock('paragraph')])}>+ Parágrafo</button><button type="button" className="button button-outline" onClick={()=>setBlocks(current=>[...current,emptyBlock('list')])}>+ Lista</button></div></div>
          {blocks.map((block,index)=><div className="editorial-block panel" key={index}>
            <div className="editorial-block-toolbar"><strong>Bloco {index+1}</strong><select aria-label={`Tipo do bloco ${index+1}`} value={block.type} onChange={event=>replaceBlock(index,emptyBlock(event.target.value as ArticleBlock['type']))}><option value="heading">Título</option><option value="paragraph">Parágrafo</option><option value="list">Lista</option></select><button type="button" onClick={()=>move(index,-1)} disabled={index===0}>↑</button><button type="button" onClick={()=>move(index,1)} disabled={index===blocks.length-1}>↓</button><button type="button" onClick={()=>remove(index)} disabled={blocks.length===1}>Remover</button></div>
            {block.type==='list'?<><label htmlFor={`block-${index}`}>Um item por linha</label><textarea id={`block-${index}`} value={block.items.join('\n')} onChange={event=>replaceBlock(index,{type:'list',items:event.target.value.split('\n')})} required/></>:<><label htmlFor={`block-${index}`}>{block.type==='heading'?'Título da seção':'Texto do parágrafo'}</label><textarea id={`block-${index}`} value={block.text} onChange={event=>replaceBlock(index,{type:block.type,text:event.target.value})} required/></>}
          </div>)}
        </section>
      </fieldset>
      {editable&&<div className="form-actions"><button className="button" type="submit" disabled={busy}>{busy?'Salvando…':item?'Salvar nova versão':'Criar rascunho'}</button><Link href="/medico/conteudos" className="button button-outline">Cancelar</Link></div>}
    </form>
    {item&&<section className="editorial-actions panel" aria-labelledby="editorial-actions-title"><h2 id="editorial-actions-title">Fluxo editorial</h2><p>Alterações de estado usam a versão atual e ficam registradas na auditoria.</p><div className="form-actions">
      {item.status==='DRAFT'&&<><button className="button" type="button" disabled={busy} onClick={()=>transition('SUBMIT_REVIEW')}>Enviar para revisão</button><button className="button button-outline" type="button" disabled={busy} onClick={()=>transition('ARCHIVE')}>Arquivar</button></>}
      {item.status==='IN_REVIEW'&&<><button className="button button-outline" type="button" disabled={busy} onClick={()=>transition('RETURN_TO_DRAFT')}>Devolver ao rascunho</button>{canPublish&&<button className="button" type="button" disabled={busy} onClick={()=>transition('PUBLISH')}>Publicar agora</button>}</>}
      {item.status==='PUBLISHED'&&<><Link className="button button-outline" href={`/blog/${item.slug}`}>Ver publicação</Link>{canPublish&&<button className="button" type="button" disabled={busy} onClick={()=>transition('RETURN_TO_DRAFT')}>Retirar e editar</button>}</>}
      {item.status==='ARCHIVED'&&<button className="button" type="button" disabled={busy} onClick={()=>transition('RETURN_TO_DRAFT')}>Restaurar como rascunho</button>}
    </div></section>}
    {message&&<p className="form-error" role="alert">{message}</p>}
  </div>;
}

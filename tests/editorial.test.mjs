import test from 'node:test';
import assert from 'node:assert/strict';
import {EditorialConflictError,validateArticleInput,validateVersion,editorialTransition} from '../src/modules/content/editorial.mjs';

const valid=()=>({slug:'um-artigo-seguro',title:'Um artigo seguro',excerpt:'Resumo editorial com tamanho suficiente para validação.',category:'Bem-estar',readingMinutes:3,editorialLabel:'Conteúdo revisado',reviewNotice:'Informação educativa; não substitui avaliação individual.',blocks:[{type:'heading',text:'Primeiro tópico'},{type:'paragraph',text:'Conteúdo claro.'},{type:'list',items:['Primeiro item','Segundo item']}]});

test('entrada editorial é normalizada e limitada',()=>{
  const parsed=validateArticleInput({...valid(),title:'  Um   artigo seguro  '});
  assert.equal(parsed.title,'Um artigo seguro');
  assert.equal(parsed.blocks[2].items.length,2);
  assert.equal(validateVersion('2'),2);
  assert.throws(()=>validateArticleInput({...valid(),slug:'Slug Inválido'}),/Slug inválido/);
  assert.throws(()=>validateArticleInput({...valid(),blocks:[]}),/1 a 100 blocos/);
  assert.throws(()=>validateVersion(0),/Versão inválida/);
});

test('workflow exige revisão e médico para publicar ou retirar publicação',()=>{
  const now=new Date('2026-10-24T12:00:00Z');
  assert.equal(editorialTransition({status:'DRAFT',action:'SUBMIT_REVIEW',roles:['ADMIN'],now}).status,'IN_REVIEW');
  assert.throws(()=>editorialTransition({status:'IN_REVIEW',action:'PUBLISH',roles:['ADMIN'],now}),EditorialConflictError);
  const published=editorialTransition({status:'IN_REVIEW',action:'PUBLISH',roles:['DOCTOR'],now});
  assert.deepEqual(published,{status:'PUBLISHED',reviewedAt:now,publishedAt:now});
  assert.equal(editorialTransition({status:'PUBLISHED',action:'RETURN_TO_DRAFT',roles:['DOCTOR'],now}).status,'DRAFT');
  assert.equal(editorialTransition({status:'ARCHIVED',action:'RETURN_TO_DRAFT',roles:['ADMIN'],now}).status,'DRAFT');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {sourceArticles} from '../src/content/articles-data.mjs';
import {articleSeedData} from '../scripts/seed-articles.mjs';

test('importação editorial preserva blocos e publica somente com data válida',()=>{
  const published=articleSeedData(sourceArticles.find(article=>article.status==='PUBLISHED'));
  const draft=articleSeedData(sourceArticles.find(article=>article.status==='DRAFT'));
  assert.ok(published.publishedAt instanceof Date);
  assert.equal(draft.publishedAt,null);
  assert.deepEqual(published.blocks.create.map(block=>block.position),published.blocks.create.map((_,index)=>index));
  assert.ok(published.blocks.create.some(block=>block.type==='LIST'&&block.items.length>0&&block.text===null));
});

test('importação recusa publicação sem data válida',()=>{
  assert.throws(()=>articleSeedData({...sourceArticles[0],publishedAt:'inválida'}),/data válida/);
});

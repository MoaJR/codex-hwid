import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migrationUrl=new URL('../prisma/migrations/20261024110000_add_editorial_cms/migration.sql',import.meta.url);

test('migration editorial cria workflow, concorrência e blocos ordenados',async()=>{
  const sql=await readFile(migrationUrl,'utf8');
  assert.match(sql,/CREATE TYPE "ArticleStatus" AS ENUM \('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED'\)/);
  assert.match(sql,/"version" INTEGER NOT NULL DEFAULT 1/);
  assert.match(sql,/Article_slug_format_check/);
  assert.match(sql,/Article_published_at_check/);
  assert.match(sql,/ArticleBlock_content_check/);
  assert.match(sql,/ArticleBlock_articleId_position_key/);
  assert.match(sql,/ArticleBlock_articleId_fkey[\s\S]*ON DELETE CASCADE/);
  assert.match(sql,/AuditEvent_resourceType_resourceId_occurredAt_idx/);
  assert.equal((sql.match(/ON DELETE SET NULL/g)??[]).length,4);
});

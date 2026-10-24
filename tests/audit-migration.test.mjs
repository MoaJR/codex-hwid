import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migrationUrl=new URL('../prisma/migrations/20261024000000_add_access_audit/migration.sql',import.meta.url);

test('migration de auditoria preserva eventos e permite remoção futura do usuário',async()=>{
  const sql=await readFile(migrationUrl,'utf8');
  assert.match(sql,/CREATE TABLE "AuditEvent"/);
  assert.match(sql,/"action" TEXT NOT NULL/);
  assert.match(sql,/"occurredAt" TIMESTAMP\(3\) NOT NULL DEFAULT CURRENT_TIMESTAMP/);
  assert.equal((sql.match(/ON DELETE SET NULL/g)??[]).length,2);
  assert.match(sql,/AuditEvent_subjectUserId_occurredAt_idx/);
});

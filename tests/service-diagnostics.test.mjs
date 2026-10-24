import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectServices} from '../scripts/check-services.mjs';
import {getMissingDatabaseReport} from '../scripts/check-database.mjs';
test('service diagnostics never echo credential values, URLs or hosts',()=>{
  const fake='sentinel-do-not-log';
  const report=inspectServices({DATABASE_URL:`postgresql://user:${fake}@not-a-real-host.invalid/db`,BLOB_READ_WRITE_TOKEN:fake});
  const output=JSON.stringify(report);
  assert(!output.includes(fake));assert(!output.includes('not-a-real-host.invalid'));assert(!output.includes('postgresql://'));
  assert.equal(report.variables.DATABASE_URL,true);assert.equal(report.variables.BLOB_READ_WRITE_TOKEN,true);assert.equal(report.connectionChecked,false);
});
test('database diagnostic without credentials fails safely before loading a client',()=>{
  assert.deepEqual(getMissingDatabaseReport({}),{status:'not_configured',code:'DATABASE_URL_MISSING',operation:'SELECT 1',schemaChecked:false});
  assert.equal(getMissingDatabaseReport({DATABASE_URL:'postgresql://placeholder'}),null);
});

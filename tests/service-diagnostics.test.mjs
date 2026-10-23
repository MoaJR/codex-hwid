import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('service diagnostics never echo credential values, URLs or hosts',()=>{
  const fake='sentinel-do-not-log';
  const result=spawnSync(process.execPath,['scripts/check-services.mjs'],{cwd:root,encoding:'utf8',env:{DATABASE_URL:`postgresql://user:${fake}@not-a-real-host.invalid/db`,BLOB_READ_WRITE_TOKEN:fake}});
  assert.equal(result.status,0);
  const out=result.stdout+result.stderr;
  assert(!out.includes(fake));assert(!out.includes('not-a-real-host.invalid'));assert(!out.includes('postgresql://'));
  const report=JSON.parse(result.stdout);assert.equal(report.variables.DATABASE_URL,true);assert.equal(report.variables.BLOB_READ_WRITE_TOKEN,true);assert.equal(report.connectionChecked,false);
});
test('database diagnostic without credentials fails safely before loading a client',()=>{
  const result=spawnSync(process.execPath,['scripts/check-database.mjs'],{cwd:root,encoding:'utf8',env:{}});
  assert.equal(result.status,1);assert.equal(result.stderr,'');assert.equal(JSON.parse(result.stdout).code,'DATABASE_URL_MISSING');
});

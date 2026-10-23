import test from 'node:test';
import assert from 'node:assert/strict';
import {getBuildScripts} from '../scripts/build.mjs';

test('build de produção aplica migrations antes de compilar o Next.js',()=>{
  assert.deepEqual(getBuildScripts({VERCEL_ENV:'production'}),[
    'db:generate',
    'db:inspect:schema',
    'db:migrate:deploy',
    'build:next',
  ]);
});

test('build local e preview não alteram o banco compartilhado',()=>{
  assert.deepEqual(getBuildScripts({VERCEL_ENV:'preview'}),['db:generate','build:next']);
  assert.deepEqual(getBuildScripts({}),['db:generate','build:next']);
});

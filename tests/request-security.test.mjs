import test from 'node:test';
import assert from 'node:assert/strict';
import {isTrustedMutationOrigin} from '../src/server/http/request-security.mjs';

test('mutações editoriais exigem a origem canônica exata',()=>{
  const configured='https://drdouglasvaz.vercel.app';
  assert.equal(isTrustedMutationOrigin(configured,configured),true);
  assert.equal(isTrustedMutationOrigin('https://drdouglasvaz.vercel.app/',configured),false);
  assert.equal(isTrustedMutationOrigin('https://outro.exemplo',configured),false);
  assert.equal(isTrustedMutationOrigin(null,configured),false);
});

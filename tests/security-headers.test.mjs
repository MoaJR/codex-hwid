import test from 'node:test';
import assert from 'node:assert/strict';
import {createContentSecurityPolicy,getSecurityHeaders} from '../src/server/http/security-headers.mjs';

test('produção bloqueia enquadramento, objetos e origens externas por padrão',()=>{
  const headers=new Map(getSecurityHeaders('production').map(({key,value})=>[key,value]));
  const policy=headers.get('Content-Security-Policy');
  assert.match(policy,/default-src 'self'/);
  assert.match(policy,/frame-ancestors 'none'/);
  assert.match(policy,/object-src 'none'/);
  assert.match(policy,/upgrade-insecure-requests/);
  assert.doesNotMatch(policy,/unsafe-eval/);
  assert.equal(headers.get('X-Frame-Options'),'DENY');
  assert.equal(headers.get('X-Content-Type-Options'),'nosniff');
  assert.equal(headers.get('Referrer-Policy'),'strict-origin-when-cross-origin');
});

test('desenvolvimento permite somente os recursos adicionais exigidos pelo hot reload',()=>{
  const policy=createContentSecurityPolicy('development');
  assert.match(policy,/script-src 'self' 'unsafe-inline' 'unsafe-eval'/);
  assert.match(policy,/connect-src 'self' ws: wss:/);
  assert.doesNotMatch(policy,/upgrade-insecure-requests/);
});

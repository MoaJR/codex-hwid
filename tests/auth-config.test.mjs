import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectAuthEnvironment} from '../src/server/auth/configuration.mjs';
const configured={AUTH_ENABLED:'true',DATABASE_URL:'postgresql://placeholder',BETTER_AUTH_SECRET:'test-only-secret-that-is-longer-than-32-characters',BETTER_AUTH_URL:'https://example.test'};
test('auth disabled by default even when provider configuration exists',()=>{assert.equal(inspectAuthEnvironment({...configured,AUTH_ENABLED:undefined}).configured,false)});
test('missing connection or secret never enables login',()=>{for(const name of ['DATABASE_URL','BETTER_AUTH_SECRET','BETTER_AUTH_URL'])assert.equal(inspectAuthEnvironment({...configured,[name]:undefined}).configured,false)});
test('production auth origin rejects HTTP, user info, arbitrary paths and invalid urls',()=>{for(const url of ['http://example.test','https://user:secret@example.test','https://example.test/path','https://example.test?x=1','invalid'])assert.equal(inspectAuthEnvironment({...configured,BETTER_AUTH_URL:url}).configured,false)});
test('localhost dev origin and HTTPS production origin can be configured',()=>{assert.equal(inspectAuthEnvironment(configured).configured,true);assert.equal(inspectAuthEnvironment({...configured,BETTER_AUTH_URL:'http://localhost:3000'}).configured,true)});
test('short secrets are rejected and status never includes secret values',()=>{assert.equal(inspectAuthEnvironment({...configured,BETTER_AUTH_SECRET:'short'}).configured,false);const output=JSON.stringify(inspectAuthEnvironment(configured));assert(!output.includes(configured.BETTER_AUTH_SECRET));assert(!output.includes(configured.DATABASE_URL));});

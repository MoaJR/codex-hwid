import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inspectAuthEnvironment,requiresStaffMfa} from '../src/server/auth/configuration.mjs';
const configured={AUTH_ENABLED:'true',DATABASE_URL:'postgresql://placeholder',BETTER_AUTH_SECRET:'test-only-secret-that-is-longer-than-32-characters',BETTER_AUTH_URL:'https://example.test'};
test('auth disabled by default even when provider configuration exists',()=>{assert.equal(inspectAuthEnvironment({...configured,AUTH_ENABLED:undefined}).configured,false)});
test('missing connection or secret never enables login',()=>{for(const name of ['DATABASE_URL','BETTER_AUTH_SECRET','BETTER_AUTH_URL'])assert.equal(inspectAuthEnvironment({...configured,[name]:undefined}).configured,false)});
test('production auth origin rejects HTTP, user info, arbitrary paths and invalid urls',()=>{for(const url of ['http://example.test','https://user:secret@example.test','https://example.test/path','https://example.test?x=1','invalid'])assert.equal(inspectAuthEnvironment({...configured,BETTER_AUTH_URL:url}).configured,false)});
test('localhost dev origin and HTTPS production origin can be configured',()=>{assert.equal(inspectAuthEnvironment(configured).configured,true);assert.equal(inspectAuthEnvironment({...configured,BETTER_AUTH_URL:'http://localhost:3000'}).configured,true)});
test('short secrets are rejected and status never includes secret values',()=>{assert.equal(inspectAuthEnvironment({...configured,BETTER_AUTH_SECRET:'short'}).configured,false);const output=JSON.stringify(inspectAuthEnvironment(configured));assert(!output.includes(configured.BETTER_AUTH_SECRET));assert(!output.includes(configured.DATABASE_URL));});
test('all staff roles require MFA, patient role does not grant staff bypass',()=>{for(const role of ['DOCTOR','SECRETARY','ADMIN'])assert.equal(requiresStaffMfa([role]),true);assert.equal(requiresStaffMfa(['PATIENT','ADMIN']),true);assert.equal(requiresStaffMfa(['PATIENT']),false);});

test('MFA stamp cannot come from password login, submitted role or failed result',async()=>{
 const {verifiedMfaSession}=await import('../src/server/auth/configuration.mjs');
 assert.equal(verifiedMfaSession('/sign-in/email',{token:'t',user:{id:'u'}}),null);
 assert.equal(verifiedMfaSession('/two-factor/verify-totp',{error:'invalid',body:{mfaVerifiedAt:'today'}}),null);
 assert.deepEqual(verifiedMfaSession('/two-factor/verify-totp',{token:'server-token',user:{id:'server-user'}}),{token:'server-token',userId:'server-user'});
});
test('old password-only sessions stay denied after user enables MFA',async()=>{
 const {hasVerifiedMfa}=await import('../src/server/auth/configuration.mjs');
 const createdAt=new Date('2026-10-23T12:00:00Z');const now=new Date('2026-10-23T13:00:00Z');
 assert.equal(hasVerifiedMfa({twoFactorEnabled:true,createdAt,mfaVerifiedAt:null},now),false);
 assert.equal(hasVerifiedMfa({twoFactorEnabled:true,createdAt,mfaVerifiedAt:new Date('2026-10-23T12:30:00Z')},now),true);
 assert.equal(hasVerifiedMfa({twoFactorEnabled:true,createdAt,mfaVerifiedAt:new Date('2026-10-24')},now),false);
 assert.equal(hasVerifiedMfa({twoFactorEnabled:false,createdAt,mfaVerifiedAt:new Date('2026-10-23T12:30:00Z')},now),false);
});

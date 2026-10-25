import test from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';

// Decisão de 25/10/2026: o produto não usa mais segundo fator. Estes testes
// impedem que telas, endpoints ou exigências de MFA voltem sem uma decisão nova,
// e garantem que autorização, titularidade e negação por padrão continuam no servidor.
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('superfícies de dois fatores foram removidas do código',async()=>{
  for(const path of [
    'src/app/verificar-acesso/page.tsx',
    'src/components/auth/verify-form.tsx',
    'src/components/auth/two-factor-setup.tsx',
    'src/server/auth/mfa-routing.mjs',
    'src/server/auth/verify-access-routing.mjs',
    'src/server/auth/pending-mfa.mjs',
    'src/server/auth/pending-mfa-request.ts',
  ])await assert.rejects(access(new URL(path,root)),`${path} deveria ter sido removido`);
});

test('provider de autenticação não registra plugin nem carimbo de MFA',async()=>{
  const provider=await read('src/server/auth/provider.ts');
  assert.doesNotMatch(provider,/twoFactor|two-factor|better-auth\/plugins/i);
  assert.doesNotMatch(provider,/mfaVerifiedAt|trustDevice/i);
  assert.match(provider,/emailAndPassword:\{enabled:true,disableSignUp:true/);
  assert.match(provider,/disabledPaths:\[\.\.\.disabledSessionApiPaths\]/);
});

test('sessão, autorização e configuração não dependem de MFA',async()=>{
  const sources=await Promise.all([
    read('src/server/auth/session.ts'),
    read('src/server/auth/authorize.ts'),
    read('src/server/auth/configuration.mjs'),
    read('src/server/http/account-request.mjs'),
  ]);
  for(const source of sources)assert.doesNotMatch(source,/staffMfa|mfaVerified|twoFactor|verifiedMfaSession|requiresStaffMfa/i);
});

test('login, conta e painel não anunciam verificação em duas etapas',async()=>{
  for(const file of ['src/components/auth/login-form.tsx','src/app/conta/page.tsx','src/modules/account/panel-access.mjs']){
    const source=await read(file);
    assert.doesNotMatch(source,/twoFactor|verificar-acesso|duas etapas/i,file);
    assert.doesNotMatch(source,/\bMFA\b/,file);
  }
});

test('guardas continuam negando por padrão e redirecionando visitante ao login',async()=>{
  for(const file of ['src/server/auth/panel-access.ts','src/server/auth/scheduling-access.ts','src/server/auth/editorial-page.ts']){
    const source=await read(file);
    assert.match(source,/if\(context\.state==='anonymous'\)redirect\('\/login'\)/,file);
    assert.match(source,/authorizeSession\(/,`${file} deve autorizar no servidor`);
  }
});

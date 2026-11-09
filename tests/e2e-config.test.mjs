import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Guarda da suíte de navegador. A política é a mesma dos aceites em scripts/:
// nenhum alvo fora de loopback, sem reaproveitar servidor alheio e sem esconder
// falha com `.only`.
const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('playwright recusa alvo que não seja loopback antes de abrir navegador', async () => {
  const config = await read('playwright.config.ts');
  assert.match(config, /assertLocalBaseUrl/, 'a config precisa usar o helper de loopback do projeto');
  assert.match(config, /E2E_BASE_URL_NOT_LOCAL|assertLocalBaseUrl/, 'o guard precisa abortar o run');
});

test('playwright não reaproveita servidor alheio por padrão', async () => {
  const config = await read('playwright.config.ts');
  assert.doesNotMatch(config, /reuseExistingServer:\s*true/, 'reaproveitar servidor pode testar outro produto');
  assert.match(config, /E2E_REUSE_SERVER/, 'o reaproveitamento precisa ser opt-in explícito');
});

test('specs não escondem falha com only nem fixme', async () => {
  for (const spec of ['public', 'identity', 'guards', 'roles']){
    const source = await read(`tests/e2e/${spec}.spec.ts`);
    assert.doesNotMatch(source, /test\.only\(/, `${spec}.spec.ts não pode usar test.only`);
    assert.doesNotMatch(source, /test\.fixme\(/, `${spec}.spec.ts não pode usar test.fixme`);
  }
});

test('artefatos do playwright ficam fora do Git', async () => {
  const ignore = await read('.gitignore');
  for (const artifact of ['test-results/', 'playwright-report/', 'blob-report/']){
    assert.ok(ignore.includes(artifact), `.gitignore precisa ignorar ${artifact}`);
  }
});

test('specs autenticados exigem confirmação e identidades fictícias locais', async () => {
  const accounts = await read('tests/e2e/fixtures/accounts.ts');
  assert.match(accounts, /E2E_CONFIRM !== 'E2E'/, 'sem confirmação explícita não se lê credencial');
  assert.match(accounts, /\.env\.local\.accounts/, 'a fixture usa o arquivo de identidades fictícias, fora do Git');
  assert.doesNotMatch(accounts, /console\.log\([^)]*(email|password)/i, 'nunca imprimir credencial');
});

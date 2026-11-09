import {defineConfig, devices} from '@playwright/test';
import {assertLocalBaseUrl} from './scripts/lib/local-e2e.mjs';

// Política única do projeto: nenhum aceite roda fora de loopback.
// `assertLocalBaseUrl` é o mesmo helper usado por e2e:scheduling e e2e:account;
// ele lança antes de qualquer navegador abrir, então o run aborta aqui.
const baseURL = assertLocalBaseUrl(process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3000');
const port = new URL(baseURL).port || '3000';
// `dev` serve o código com HMR (rápido, com ruído de WebSocket);
// `start` usa o build de `npm run build:next` e é o modo fiel para aceite.
const serverCommand = process.env.E2E_SERVER === 'start' ? 'npm run start' : 'npm run dev';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'test-results',
  // O login é limitado no servidor: manter um worker evita 429 e corrida de sessão.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 45_000,
  expect: {timeout: 8_000},
  reporter: process.env.CI ? [['list'], ['html', {open: 'never'}]] : [['list']],
  use: {
    baseURL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: {...devices['Desktop Chrome'], viewport: {width: 1280, height: 900}},
    },
    {
      name: 'mobile-chromium',
      use: {...devices['Pixel 7']},
    },
  ],
  webServer: {
    command: `${serverCommand} -- --port ${port}`,
    url: baseURL,
    // Nunca reaproveitar um processo que não seja o nosso: um servidor estranho
    // na porta faria a suíte testar outro produto. E2E_REUSE_SERVER=1 apenas
    // quando o servidor local foi iniciado por você.
    reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
    timeout: 180_000,
  },
});

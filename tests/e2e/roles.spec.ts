import {test, expect} from '@playwright/test';
import {loadLocalAccounts, signIn} from './fixtures/accounts';
import {expectNoHorizontalOverflow, expectSingleHeading, trackRuntimeErrors} from './fixtures/app';

// O login é limitado no servidor (5/min por IP) e a fila da fixture pode esperar
// uma janela inteira quando outra suíte acabou de autenticar.
test.describe.configure({timeout: 150_000});

// Aceite autenticado: exige E2E_CONFIRM=E2E, alvo loopback (validado no config)
// e as identidades fictícias de .env.local.accounts. Sem isso, o teste é
// declarado como não aplicável em vez de falhar silenciosamente.
const missingAccounts = 'requer E2E_CONFIRM=E2E e identidades fictícias locais';

test('médico vê agenda e conteúdos no painel', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.DOCTOR, missingAccounts);
  await signIn(page, accounts!.DOCTOR);
  await expect(page.getByRole('heading', {name: /^Olá,/})).toBeVisible();
  await expect(page.getByRole('link', {name: /Agenda/})).toBeVisible();
  await expect(page.getByRole('link', {name: /Conteúdos/})).toBeVisible();
});

test('administrador vê a administração e a agenda só quando também é médico', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.ADMIN, missingAccounts);
  await signIn(page, accounts!.ADMIN);
  await expect(page.getByRole('link', {name: /Administração/})).toBeVisible();

  // A união é por papéis gravados: se a conta também tem DOCTOR, a agenda abre;
  // caso contrário o guard devolve ao painel. Nunca por herança de ADMIN.
  const roleText = (await page.locator('.app-page-meta .visually-hidden').textContent()) ?? '';
  const hasDoctor = /Médico/.test(roleText);
  await page.goto('/painel/agenda');
  if(hasDoctor){
    await expect(page).not.toHaveURL(/\/login/);
  }else{
    await expect(page).toHaveURL(/\/painel$/);
  }
});

test('cards do painel não se repetem e refletem a união dos papéis', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.DOCTOR, missingAccounts);
  await signIn(page, accounts!.DOCTOR);
  const titles = (await page.locator('.app-module-card strong').allTextContents()).map(title => title.trim());
  expect(titles.length).toBeGreaterThan(0);
  expect(new Set(titles).size, 'a união de papéis não pode duplicar módulos').toBe(titles.length);

  // Titular com DOCTOR+ADMIN: Agenda, Conteúdos, Administração e Minha conta.
  // ADMIN não herda a agenda — quando a Agenda aparece, quem autoriza é DOCTOR.
  const badges = (await page.locator('.app-page-meta .status-badge').allTextContents()).map(badge => badge.trim());
  if(badges.includes('Médico') && badges.includes('Administrador')){
    expect([...titles].sort()).toEqual(['Administração', 'Agenda', 'Conteúdos', 'Minha conta']);
  }
});

test('paciente não acessa a agenda da clínica', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.PATIENT, missingAccounts);
  await signIn(page, accounts!.PATIENT);
  await page.goto('/painel/agenda');
  await expect(page).toHaveURL(/\/painel$/);
});

test('administração mostra indicadores reais, escopos e nenhum acesso clínico', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.ADMIN, missingAccounts);
  await signIn(page, accounts!.ADMIN);
  const errors = trackRuntimeErrors(page);
  await page.goto('/painel/administracao');
  await expectSingleHeading(page);
  await expect(page.getByRole('heading', {name: /Alcances desta conta/i})).toBeVisible();

  // Indicadores saem da consulta editorial: precisam ser números, não texto fixo.
  const indicators = page.locator('.admin-kpi dd');
  await expect(indicators).toHaveCount(4);
  const counts: number[] = [];
  for(const value of await indicators.allTextContents()){
    const parsed = Number(value.trim());
    expect(Number.isInteger(parsed), `indicador inválido: ${value}`).toBe(true);
    counts.push(parsed);
  }

  // ADMIN não herda agenda: o escopo clínico aparece negado com rótulo textual.
  await expect(page.locator('.admin-scope-item')).toHaveCount(5);
  await expect(page.locator('.admin-scope-state').filter({hasText: 'Não concedida'})).not.toHaveCount(0);

  // O fluxo editorial é estado explícito: legenda completa com conteúdo ou vazio real.
  const total = counts.reduce((sum, value) => sum + value, 0);
  if(total > 0){
    await expect(page.locator('.admin-legend li')).toHaveCount(4);
  }else{
    await expect(page.locator('.admin-empty')).not.toHaveCount(0);
  }

  await expectNoHorizontalOverflow(page);
  expect(errors, `erros de console em /admin: ${errors.join(' | ')}`).toEqual([]);
});

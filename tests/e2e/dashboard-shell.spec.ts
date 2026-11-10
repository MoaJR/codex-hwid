import {test, expect} from '@playwright/test';
import {loadLocalAccounts, signIn} from './fixtures/accounts';
import {expectNoHorizontalOverflow, trackRuntimeErrors} from './fixtures/app';

// Aceite do dashboard unificado: menu lateral único, um perfil por conta e
// rotas antigas redirecionadas. Exige E2E_CONFIRM=E2E e identidades fictícias.
test.describe.configure({timeout: 150_000});

const missing = 'requer E2E_CONFIRM=E2E e identidades fictícias locais';

test('rotas antigas redirecionam permanentemente para o painel unificado', async ({request}) => {
  const legacy = [
    ['/admin', '/painel/administracao'],
    ['/conta', '/painel/conta'],
    ['/paciente', '/painel/acompanhamento'],
    ['/medico/agenda', '/painel/agenda'],
    ['/medico/conteudos', '/painel/conteudos'],
  ] as const;
  for(const [source, destination] of legacy){
    const response = await request.get(source, {maxRedirects: 0});
    expect(response.status(), source).toBe(308);
    expect(response.headers()['location'], source).toContain(destination);
  }
});

test('menu lateral do titular reúne médico e administração em uma única navegação', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.DOCTOR, missing);
  await signIn(page, accounts!.DOCTOR);

  const nav = page.getByRole('navigation', {name: 'Navegação principal do painel'});
  await expect(nav).toBeVisible();
  for(const name of ['Visão geral', 'Agenda', 'Conteúdos', 'Minha conta']){
    await expect(nav.getByRole('link', {name, exact: true})).toBeVisible();
  }
  const seen = await nav.getByRole('link').allTextContents();
  expect(new Set(seen.map(text => text.trim())).size, 'o menu não pode duplicar itens').toBe(seen.length);

  // Item ativo identificado por estado acessível, não apenas por cor.
  await page.goto('/painel/agenda');
  await expect(nav.getByRole('link', {name: 'Agenda', exact: true})).toHaveAttribute('aria-current', 'page');
  await expect(nav.getByRole('link', {name: 'Visão geral', exact: true})).not.toHaveAttribute('aria-current', 'page');
});

test('secretária e paciente não recebem itens editoriais no menu', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.SECRETARY && !accounts?.PATIENT, missing);

  if(accounts?.SECRETARY){
    await signIn(page, accounts.SECRETARY);
    const nav = page.getByRole('navigation', {name: 'Navegação principal do painel'});
    await expect(nav.getByRole('link', {name: 'Agenda', exact: true})).toBeVisible();
    await expect(nav.getByRole('link', {name: 'Conteúdos', exact: true})).toHaveCount(0);
    await expect(nav.getByRole('link', {name: 'Administração', exact: true})).toHaveCount(0);
  }

  if(accounts?.PATIENT){
    await signIn(page, accounts.PATIENT);
    const nav = page.getByRole('navigation', {name: 'Navegação principal do painel'});
    await expect(nav.getByRole('link', {name: 'Meu acompanhamento', exact: true})).toBeVisible();
    await expect(nav.getByRole('link', {name: 'Agenda', exact: true})).toHaveCount(0);
    await expect(nav.getByRole('link', {name: 'Administração', exact: true})).toHaveCount(0);
  }
});

test('gaveta do menu abre, fecha com Escape e devolve o foco sem erro de console', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.DOCTOR, missing);
  await signIn(page, accounts!.DOCTOR);
  const errors = trackRuntimeErrors(page);
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/painel');

  const toggle = page.getByRole('button', {name: 'Abrir menu'});
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const sidebar = page.locator('#app-sidebar');
  await expect(sidebar).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();

  expect(errors, `erros de console: ${errors.join(' | ')}`).toEqual([]);
});

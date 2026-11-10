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

test('sidebar recolhe no desktop, preserva rótulos acessíveis e lembra a preferência', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.DOCTOR, missing);
  await signIn(page, accounts!.DOCTOR);
  await page.setViewportSize({width: 1280, height: 900});
  await page.goto('/painel');

  const shell = page.locator('.app-shell');
  const sidebar = page.locator('#app-sidebar');
  await expect(shell).toHaveAttribute('data-collapsed', 'false');
  const expanded = (await sidebar.boundingBox())?.width ?? 0;

  await page.getByRole('button', {name: 'Recolher menu'}).click();
  await expect(shell).toHaveAttribute('data-collapsed', 'true');
  const collapsed = (await sidebar.boundingBox())?.width ?? 0;
  expect(collapsed, 'a sidebar recolhida precisa ser mais estreita').toBeLessThan(expanded);

  // O rótulo sai do campo visual, mas continua acessível: nada é removido do DOM.
  const nav = page.getByRole('navigation', {name: 'Navegação principal do painel'});
  await expect(nav.getByRole('link', {name: 'Agenda', exact: true})).toBeVisible();
  await expect(nav.getByRole('link', {name: 'Agenda', exact: true})).toHaveAttribute('title', 'Agenda');
  await expectNoHorizontalOverflow(page);

  // A preferência sobrevive ao recarregamento, sem erro de hidratação.
  const errors = trackRuntimeErrors(page);
  await page.reload({waitUntil: 'domcontentloaded'});
  await expect(shell).toHaveAttribute('data-collapsed', 'true');

  await page.getByRole('button', {name: 'Expandir menu'}).click();
  await expect(shell).toHaveAttribute('data-collapsed', 'false');
  expect(errors, `erros de console: ${errors.join(' | ')}`).toEqual([]);
});

test('cabeçalho mobile mostra a seção atual do painel', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.DOCTOR, missing);
  await signIn(page, accounts!.DOCTOR);
  await page.setViewportSize({width: 390, height: 844});

  await page.goto('/painel');
  await expect(page.locator('.app-topbar-title')).toHaveText('Visão geral');
  await page.goto('/painel/conta');
  await expect(page.locator('.app-topbar-title')).toHaveText('Minha conta');
});

test('barra inferior do titular traz destinos frequentes e abre o menu completo', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.DOCTOR, missing);
  await signIn(page, accounts!.DOCTOR);
  const errors = trackRuntimeErrors(page);
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/painel');

  const bottom = page.getByRole('navigation', {name: 'Navegação rápida do painel'});
  await expect(bottom).toBeVisible();
  await expect(bottom.getByRole('link')).toHaveCount(3);
  await expect(bottom.getByRole('link', {name: 'Início'})).toHaveAttribute('aria-current', 'page');
  await expect(bottom.getByRole('link', {name: 'Agenda'})).not.toHaveAttribute('aria-current', 'page');
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', {name: 'Mais opções do menu'}).click();
  await expect(page.getByRole('button', {name: 'Abrir menu'})).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#app-sidebar')).toBeVisible();
  await expect(bottom).toBeHidden();

  await page.keyboard.press('Escape');
  await expect(bottom).toBeVisible();
  expect(errors, `erros de console: ${errors.join(' | ')}`).toEqual([]);
});

test('paciente usa a barra inferior própria, sem destinos profissionais', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.PATIENT, missing);
  await signIn(page, accounts!.PATIENT);
  await page.setViewportSize({width: 360, height: 800});
  await page.goto('/painel/acompanhamento');

  const bottom = page.getByRole('navigation', {name: 'Navegação rápida do painel'});
  await expect(bottom.getByRole('link')).toHaveCount(3);
  await expect(bottom.getByRole('link', {name: 'Acompanhar'})).toHaveAttribute('aria-current', 'page');
  await expect(bottom.getByRole('link', {name: 'Agenda'})).toHaveCount(0);
  await expect(bottom.getByRole('link', {name: 'Conteúdos'})).toHaveCount(0);
  await expect(bottom.getByRole('link', {name: 'Administração'})).toHaveCount(0);
  await expect(bottom.getByRole('button', {name: 'Mais opções do menu'})).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});


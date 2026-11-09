import {test, expect} from '@playwright/test';
import {expectNoHorizontalOverflow, expectSingleHeading, trackRuntimeErrors} from './fixtures/app';

const publicPages = [
  '/',
  '/sobre',
  '/tratamentos',
  '/tratamentos/ansiedade',
  '/consulta-online',
  '/agendar',
  '/contato',
  '/privacidade',
  '/blog',
];

for(const path of publicPages){
  test(`página pública ${path} responde, tem um h1 e não quebra o layout`, async ({page}) => {
    const errors = trackRuntimeErrors(page);
    const response = await page.goto(path, {waitUntil: 'domcontentloaded'});
    expect(response?.status(), `status de ${path}`).toBe(200);
    await expectSingleHeading(page);
    await expectNoHorizontalOverflow(page);
    expect(errors, `erros de console em ${path}: ${errors.join(' | ')}`).toEqual([]);
  });
}

test('artigo publicado abre a partir do índice do blog', async ({page}) => {
  const errors = trackRuntimeErrors(page);
  await page.goto('/blog');
  const articles = page.locator('a[href^="/blog/"]');
  const total = await articles.count();
  expect(total, 'o índice precisa listar ao menos um artigo publicado').toBeGreaterThan(0);
  const href = await articles.first().getAttribute('href');
  const response = await page.goto(href ?? '/blog');
  expect(response?.status(), `status de ${href}`).toBe(200);
  await expectSingleHeading(page);
  await expectNoHorizontalOverflow(page);
  expect(errors, `erros de console em ${href}: ${errors.join(' | ')}`).toEqual([]);
});

test('home em 360px não cria rolagem horizontal', async ({page}) => {
  await page.setViewportSize({width: 360, height: 800});
  await page.goto('/');
  await expectNoHorizontalOverflow(page);
});

test('navegação principal leva às páginas públicas por teclado', async ({page}) => {
  await page.goto('/');
  const link = page.locator('.desktop-nav a', {hasText: 'Tratamentos'}).first();
  if(!(await link.isVisible())) test.skip(true, 'menu desktop não é exibido nesta viewport');
  await link.focus();
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/tratamentos$/);
  await expectSingleHeading(page);
});

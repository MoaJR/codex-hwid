import {test, expect} from '@playwright/test';
import {loadLocalAccounts, signIn} from './fixtures/accounts';
import {expectNoHorizontalOverflow} from './fixtures/app';

test.describe.configure({timeout: 150_000});

const widths = [320, 360, 390, 768, 1024, 1440];

test('administração não gera overflow e mantém alvos e foco em 320–1440 px', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.ADMIN, 'requer E2E_CONFIRM=E2E e identidades fictícias locais');
  await signIn(page, accounts!.ADMIN);

  for(const width of widths){
    await page.setViewportSize({width, height: 900});
    await page.goto('/painel/administracao');
    await expect(page.getByRole('heading', {level: 1})).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // Alvo mínimo de 44 px nas ações principais da área administrativa.
    for(const name of ['Gerenciar conteúdos', 'Ver blog público']){
      const box = await page.getByRole('link', {name}).first().boundingBox();
      expect(box, `link ausente: ${name}`).not.toBeNull();
      expect(box!.height, `${name} em ${width}px`).toBeGreaterThanOrEqual(44);
    }
  }

  // Foco visível: o primeiro link da página precisa ter contorno ao receber Tab.
  await page.setViewportSize({width: 390, height: 900});
  await page.goto('/painel/administracao');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const outline = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if(!el) return null;
    const style = getComputedStyle(el);
    return {width: parseFloat(style.outlineWidth), style: style.outlineStyle, shadow: style.boxShadow};
  });
  expect(outline).not.toBeNull();
  expect(outline!.style !== 'none' || outline!.shadow !== 'none').toBe(true);
});

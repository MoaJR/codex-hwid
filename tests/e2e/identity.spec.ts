import {test, expect} from '@playwright/test';

test('wordmark do consultório está no cabeçalho', async ({page}) => {
  await page.goto('/');
  const brand = page.locator('.brand').first();
  await expect(brand).toBeVisible();
  await expect(brand).toContainText('Douglas Vaz');
  await expect(brand).toContainText('PSIQUIATRIA');
});

test('fundo do site é o cinza claro do manual', async ({page}) => {
  await page.goto('/');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(242, 242, 242)');
});

test('ação primária usa o azul principal da marca', async ({page}) => {
  await page.goto('/agendar');
  const button = page.locator('main a.button:not(.button-outline)').first();
  await expect(button).toBeVisible();
  await expect(button).toHaveCSS('background-color', 'rgb(3, 103, 166)');
});

test('nenhum texto visível abaixo de 12px', async ({page}) => {
  await page.goto('/');
  const offenders = await page.evaluate(() => {
    const found: string[] = [];
    for(const node of Array.from(document.querySelectorAll('body *'))){
      const element = node as HTMLElement;
      if(element.children.length > 0) continue;
      if(!element.textContent || !element.textContent.trim()) continue;
      const style = window.getComputedStyle(element);
      if(style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      const size = Number.parseFloat(style.fontSize);
      if(Number.isFinite(size) && size > 0 && size < 12){
        found.push(`${element.tagName.toLowerCase()}.${String(element.className)} (${size}px)`);
      }
    }
    return found.slice(0, 12);
  });
  expect(offenders, `fontes abaixo do piso de 12px: ${offenders.join(', ')}`).toEqual([]);
});

test('foco por teclado é visível', async ({page}) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if(!active) return null;
    const style = window.getComputedStyle(active);
    return {style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth)};
  });
  expect(focus, 'o primeiro Tab precisa focar um elemento').not.toBeNull();
  expect(focus?.style).not.toBe('none');
  expect(focus?.width ?? 0).toBeGreaterThanOrEqual(2);
});

test('acionador do menu mobile tem alvo de 44px', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'regra específica do menu mobile');
  await page.goto('/');
  const summary = page.locator('.mobile-navigation summary');
  await expect(summary).toBeVisible();
  const box = await summary.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});

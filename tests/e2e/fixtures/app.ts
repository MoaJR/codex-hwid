import {expect, type Page} from '@playwright/test';

/** Coleta erros de console e exceções não tratadas: hidratação quebrada reprova o teste. */
export function trackRuntimeErrors(page: Page){
  const errors: string[] = [];
  // O HMR do `next dev` falha o handshake WebSocket quando o servidor é
  // iniciado pelo Playwright. É ruído do modo de desenvolvimento, não defeito
  // do produto: ao rodar com `E2E_SERVER=start` ele não aparece.
  const devServerNoise = /\/_next\/hmr|webpack-hmr/;
  page.on('console', message => {
    if(message.type() !== 'error') return;
    const text = message.text();
    if(devServerNoise.test(text)) return;
    errors.push(text);
  });
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

export async function expectNoHorizontalOverflow(page: Page){
  const overflow = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow, 'nenhuma viewport pode ter rolagem horizontal').toBeLessThanOrEqual(1);
}

export async function expectSingleHeading(page: Page){
  await expect(page.locator('h1'), 'cada página declara um único h1').toHaveCount(1);
}

import {test, expect} from '@playwright/test';
import {loadLocalAccounts, signIn} from './fixtures/accounts';
import {expectNoHorizontalOverflow, expectSingleHeading, trackRuntimeErrors} from './fixtures/app';

test.describe.configure({timeout: 180_000});

const widths = [320, 360, 390, 768, 1024, 1440];
const missing = 'requer E2E_CONFIRM=E2E e identidades fictícias locais';

const routes: Array<{role: 'PATIENT' | 'DOCTOR'; paths: string[]}> = [
  {role: 'PATIENT', paths: ['/painel', '/painel/acompanhamento', '/painel/conta']},
  {role: 'DOCTOR', paths: ['/painel', '/painel/agenda', '/painel/conteudos', '/painel/conta']},
];

for(const {role, paths} of routes){
  test(`portais de ${role} sem overflow, com h1 único e sem erro de console (320–1440 px)`, async ({page}) => {
    const accounts = await loadLocalAccounts();
    test.skip(!accounts?.[role], missing);
    await signIn(page, accounts![role]);
    // Rastreia só depois do login: o 429 do limite de autenticação não é defeito das páginas.
    const errors = trackRuntimeErrors(page);

    for(const path of paths){
      for(const width of widths){
        await page.setViewportSize({width, height: 900});
        await page.goto(path, {waitUntil: 'domcontentloaded'});
        await expectSingleHeading(page);
        await expectNoHorizontalOverflow(page);

        // Botões e links de ação visíveis precisam ter alvo de toque de 44 px em viewport estreita.
        if(width <= 430){
          const small = await page.evaluate(() => {
            const targets = Array.from(document.querySelectorAll<HTMLElement>('main a.button, main button.button'));
            return targets
              .filter(el => el.offsetParent !== null)
              .map(el => ({text: (el.textContent ?? '').trim().slice(0, 40), height: el.getBoundingClientRect().height}))
              .filter(item => item.height < 44);
          });
          expect(small, `alvos menores que 44px em ${path} (${width}px)`).toEqual([]);
        }
      }
    }
    expect(errors, `erros de console: ${errors.join(' | ')}`).toEqual([]);
  });
}

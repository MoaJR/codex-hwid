import {test, expect} from '@playwright/test';

// Auditoria estrutural sem dependência nova (axe não está instalado). Cobre o que
// é verificável de forma determinística; não substitui revisão manual com leitor de tela.
const pages = ['/', '/sobre', '/tratamentos', '/consulta-online', '/agendar', '/contato', '/privacidade', '/blog', '/login'];

for(const path of pages){
  test(`estrutura acessível básica em ${path}`, async ({page}) => {
    await page.goto(path, {waitUntil: 'domcontentloaded'});

    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page.locator('main#main-content'), 'um único main com id do skip link').toHaveCount(1);
    await expect(page.locator('a[href="#main-content"]').first(), 'link Pular para o conteúdo').toBeAttached();
    await expect(page.locator('header').first()).toBeAttached();
    await expect(page.locator('footer').first()).toBeAttached();

    const issues = await page.evaluate(() => {
      const found: string[] = [];
      const name = (el: Element) => (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.textContent || '').trim();
      document.querySelectorAll('a[href]').forEach(a => {
        if(!name(a) && !a.querySelector('img[alt]:not([alt=""])')) found.push(`link sem nome: ${a.getAttribute('href')}`);
      });
      document.querySelectorAll('button').forEach(b => {
        if(!name(b)) found.push('botão sem nome acessível');
      });
      document.querySelectorAll('img').forEach(img => {
        if(!img.hasAttribute('alt')) found.push(`img sem alt: ${img.getAttribute('src')}`);
      });
      document.querySelectorAll('input:not([type=hidden]):not([type=submit]), select, textarea').forEach(field => {
        const id = field.getAttribute('id');
        const labelled = field.closest('label') || (id && document.querySelector(`label[for="${id}"]`))
          || field.getAttribute('aria-label') || field.getAttribute('aria-labelledby');
        if(!labelled) found.push(`campo sem label: ${field.getAttribute('name') ?? field.tagName}`);
      });
      const levels = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => Number(h.tagName[1]));
      for(let i = 1; i < levels.length; i++){
        if(levels[i] - levels[i - 1] > 1) found.push(`salto de heading h${levels[i - 1]} → h${levels[i]}`);
      }
      document.querySelectorAll('[tabindex]').forEach(el => {
        if(Number(el.getAttribute('tabindex')) > 0) found.push('tabindex positivo');
      });
      return found;
    });
    expect(issues, `problemas de acessibilidade em ${path}`).toEqual([]);
  });
}

test('foco por teclado é visível no primeiro controle da home', async ({page}) => {
  await page.goto('/', {waitUntil: 'domcontentloaded'});
  await page.keyboard.press('Tab');
  const visible = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if(!el || el === document.body) return false;
    const style = getComputedStyle(el);
    return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
  });
  expect(visible).toBe(true);
});

import {test, expect} from '@playwright/test';

const protectedPages = [
  '/painel',
  '/painel/conta',
  '/painel/acompanhamento',
  '/painel/administracao',
  '/painel/agenda',
  '/painel/conteudos',
  '/painel/conteudos/novo',
];

for(const path of protectedPages){
  test(`anônimo em ${path} termina no login`, async ({page}) => {
    await page.goto(path, {waitUntil: 'domcontentloaded'});
    await expect(page).toHaveURL(/\/login(\?|$)/);
    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByRole('button', {name: 'Entrar com segurança'})).toBeVisible();
  });
}

test('API da agenda responde 401 sem sessão', async ({request}) => {
  const response = await request.get('/api/medico/agenda');
  expect(response.status()).toBe(401);
});

test('endpoints crus do provedor permanecem desativados', async ({request}) => {
  const list = await request.get('/api/auth/list-sessions');
  expect(list.status()).toBe(404);
});

test('protótipo estático antigo não existe', async ({request}) => {
  const response = await request.get('/demonstracao.html');
  expect(response.status()).toBe(404);
});

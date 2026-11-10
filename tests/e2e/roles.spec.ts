import {test, expect} from '@playwright/test';
import {loadLocalAccounts, signIn} from './fixtures/accounts';

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
  const badges = await page.locator('.portal-meta .status-badge').allTextContents();
  const hasDoctor = badges.some(badge => badge.trim() === 'Médico');
  await page.goto('/medico/agenda');
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
  const titles = (await page.locator('.portal-card h2').allTextContents()).map(title => title.trim());
  expect(titles.length).toBeGreaterThan(0);
  expect(new Set(titles).size, 'a união de papéis não pode duplicar módulos').toBe(titles.length);

  // Titular com DOCTOR+ADMIN: Agenda, Conteúdos, Administração e Minha conta.
  // ADMIN não herda a agenda — quando a Agenda aparece, quem autoriza é DOCTOR.
  const badges = (await page.locator('.portal-meta .status-badge').allTextContents()).map(badge => badge.trim());
  if(badges.includes('Médico') && badges.includes('Administrador')){
    expect([...titles].sort()).toEqual(['Administração', 'Agenda', 'Conteúdos', 'Minha conta']);
  }
});

test('paciente não acessa a agenda da clínica', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.PATIENT, missingAccounts);
  await signIn(page, accounts!.PATIENT);
  await page.goto('/medico/agenda');
  await expect(page).toHaveURL(/\/painel$/);
});

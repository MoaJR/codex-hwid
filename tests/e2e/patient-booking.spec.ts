import {test, expect, type Page} from '@playwright/test';
import {loadLocalAccounts, signIn} from './fixtures/accounts';
import {expectNoHorizontalOverflow, trackRuntimeErrors} from './fixtures/app';

// Aceite da Fase 5B no navegador: solicitação de horário pelo paciente,
// retirada da própria pendência e cancelamento do próprio atendimento.
// A aprovação pela equipe é exercitada por HTTP em e2e:patient-booking para
// não consumir a cota de login (5/min por IP) com uma segunda conta por teste.
test.describe.configure({timeout: 180_000});

const missingAccounts = 'requer E2E_CONFIRM=E2E e identidades fictícias locais';

/** Painel de pendências; `section.panel` evita casar com o container da página. */
function pendingPanel(page: Page){
  return page.locator('section.panel').filter({has: page.getByRole('heading', {name: /Solicitações enviadas/})});
}

/**
 * Uma pendência anterior (por execução interrompida) bloquearia a nova
 * solicitação, porque existe no máximo uma por paciente. O próprio teste a
 * retira antes de começar, mantendo a suíte idempotente.
 */
async function clearPending(page: Page){
  await page.goto('/painel/acompanhamento', {waitUntil: 'domcontentloaded'});
  const panel = pendingPanel(page);
  for(let attempt = 0; attempt < 5; attempt++){
    const withdraw = panel.getByRole('button', {name: /^Retirar solicitação/});
    if(await withdraw.count() === 0) return;
    await withdraw.first().click();
    await panel.getByRole('button', {name: 'Confirmar retirada'}).click();
    await expect(page.getByRole('status').filter({hasText: 'Solicitação retirada'})).toBeVisible();
    await page.reload({waitUntil: 'domcontentloaded'});
  }
}

test('paciente vê a solicitação de horário, retira a pendência e mantém a agenda intacta', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.PATIENT, missingAccounts);
  const errors = trackRuntimeErrors(page);
  await signIn(page, accounts!.PATIENT);
  await clearPending(page);

  await expect(page.getByRole('heading', {name: /^Meu acompanhamento/})).toBeVisible();
  await expect(page.getByRole('heading', {name: /Escolha um horário disponível/})).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const daySelect = page.getByLabel('Dia disponível');
  const hasDay = await daySelect.locator('option').count();
  if(hasDay > 1){
    await daySelect.selectOption({index: 1});
    const slotLabel = page.locator('.booking-slot').first();
    await expect(slotLabel).toBeVisible();
    await slotLabel.click();
    await expect(page.locator('.booking-slot input').first()).toBeChecked();
    await page.getByRole('button', {name: 'Enviar solicitação'}).click();
    await expect(page.getByRole('status').filter({hasText: 'Solicitação enviada'})).toBeVisible();

    await page.reload({waitUntil: 'domcontentloaded'});
    const panel = pendingPanel(page);
    await expect(panel).toBeVisible();
    await panel.getByRole('button', {name: /^Retirar solicitação/}).first().click();
    await panel.getByRole('button', {name: 'Confirmar retirada'}).click();
    await expect(page.getByRole('status').filter({hasText: 'Solicitação retirada'})).toBeVisible();
  }else{
    // Sem horário livre na janela, a tela precisa explicar o estado vazio.
    await expect(page.getByText('Nenhum horário livre nesta janela')).toBeVisible();
  }

  expect(errors, `erros de console em /painel/acompanhamento: ${errors.join(' | ')}`).toEqual([]);
});

test('paciente não acessa rotas de equipe nem endpoints administrativos', async ({page}) => {
  const accounts = await loadLocalAccounts();
  test.skip(!accounts?.PATIENT, missingAccounts);
  await signIn(page, accounts!.PATIENT);
  await page.goto('/painel/agenda');
  await expect(page).toHaveURL(/\/painel$/);
  const agenda = await page.request.get('/api/medico/appointment-requests');
  expect(agenda.status()).toBe(403);
  const queue = await page.request.post('/api/paciente/appointment-requests', {data: {serviceId: '00000000-0000-4000-8000-000000000000', date: '2026-12-01', time: '09:00'}});
  expect([400, 403, 409]).toContain(queue.status());
});

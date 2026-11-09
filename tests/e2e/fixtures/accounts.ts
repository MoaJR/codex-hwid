import type {Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

// O Playwright roda a suíte a partir da raiz do projeto; não usar import.meta.url
// porque os specs são transpilados para CJS.
const accountsPath = resolve(process.cwd(), '.env.local.accounts');
const helperUrl = pathToFileURL(resolve(process.cwd(), 'scripts/lib/local-e2e.mjs')).href;

export type LocalAccounts = Record<string, {email: string; password: string}>;

const knownRoles = ['DOCTOR', 'SECRETARY', 'PATIENT', 'ADMIN'];

/**
 * Mesmo formato de `scripts/lib/local-e2e.mjs` (`email|PAPEL|senha`).
 * Existe como fallback porque o bundler do Playwright pode converter o import
 * dinâmico do helper em `require`, indisponível para um `.mjs` ESM.
 */
function parseAccountsFallback(text: string): LocalAccounts{
  const accounts: LocalAccounts = {};
  for(const raw of text.split(/\r?\n/)){
    const line = raw.trim();
    if(!line || line.startsWith('#')) continue;
    const [email, role, ...rest] = line.split('|');
    const password = rest.join('|').trim();
    if(!email || !role || !password) continue;
    const normalized = role.trim().toUpperCase();
    if(!knownRoles.includes(normalized)) continue;
    accounts[normalized] = {email: email.trim(), password};
  }
  return accounts;
}

/**
 * Identidades fictícias locais, fora do Git. Só são lidas com `E2E_CONFIRM=E2E`;
 * o alvo loopback já é garantido pelo `playwright.config.ts`.
 */
export async function loadLocalAccounts(): Promise<LocalAccounts | null>{
  if(process.env.E2E_CONFIRM !== 'E2E') return null;
  try{
    const text = await readFile(accountsPath, 'utf8');
    try{
      const {parseAccounts} = await import(helperUrl);
      return parseAccounts(text) as LocalAccounts;
    }catch{
      return parseAccountsFallback(text);
    }
  }catch(error){
    if(process.env.E2E_DEBUG_ACCOUNTS === '1') console.error('[e2e] contas locais indisponíveis:', error);
    return null;
  }
}

export async function signIn(page: Page, account: {email: string; password: string}){
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(account.email);
  await page.getByLabel('Senha').fill(account.password);
  const [response] = await Promise.all([
    page.waitForResponse(result => result.url().includes('/api/auth/sign-in/email')),
    page.getByRole('button', {name: 'Entrar com segurança'}).click(),
  ]);
  if(response.status() !== 200){
    // Sem ecoar credencial: só o status e a ação necessária.
    throw new Error(
      `login recusado (${response.status()}): confira BETTER_AUTH_URL, AUTH_ENABLED e as identidades fictícias locais`,
    );
  }
  await page.waitForURL(/\/painel/);
}

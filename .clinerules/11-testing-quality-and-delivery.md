# Qualidade, testes e entrega

## Antes de editar
- Inspecione implementação, testes e convenções próximas.
- Defina o comportamento esperado e cenários de regressão.
- Não altere contratos existentes sem mapear consumidores.
- Não remova testes para fazer a suíte passar.

## Testes
Adicione testes proporcionais ao risco:
- unitários para domínio, políticas, normalização e validação;
- integração para repositórios, transações e autorização;
- contrato para APIs e status;
- E2E para fluxos por papel e regressões críticas;
- acessibilidade para componentes e jornadas relevantes.
Teste explicitamente negações, não apenas caminhos felizes.

## Checks padrão
Execute, quando aplicável:
```bash
npm test
npm run typecheck
npm run build:next
```
Para mudanças em agenda/conta, com PostgreSQL local e identidades fictícias provisionadas:
```bash
npm run e2e:scheduling
npm run e2e:account
npm run scheduling:check
```
`npm run privacy:check` somente em banco local e somente leitura. Não execute E2E autenticado sem verificar que o alvo é loopback e que as identidades são fictícias.

## Frontend com Playwright
Todo fluxo de interface tem cobertura de navegador em `tests/e2e` (`*.spec.ts`), além dos testes de domínio em `tests/`.
```bash
npm run e2e:frontend        # suíte Playwright (Chromium)
npm run e2e:frontend:ui     # modo interativo, uso local
npm run e2e:frontend:report # relatório da última execução
```
- Instalação única do navegador: `npx playwright install chromium`.
- O `playwright.config.ts` **aborta** quando `E2E_BASE_URL` não é loopback. Não contorne essa guarda.
- Specs autenticados exigem `E2E_CONFIRM=E2E`, identidades fictícias de `.env.local.accounts` e um login por papel (`storageState`); nunca aponte para Produção.
- `test-results/`, `playwright-report/` e `blob-report/` ficam fora do Git.
- Cobrir: páginas públicas, guardas de rota, união de papéis no `/painel`, estados vazio/erro, ausência de erro de console ou hidratação, overflow em 320–1440 e os invariantes da identidade (cor primária, piso de 12px, alvo de 44px, foco visível).
- Não silencie falha com `test.skip`, `test.fixme` ou timeout maior: corrija o produto ou registre a pendência.

## UI review
- Revisar visualmente em viewport mobile e desktop.
- Testar teclado, foco, zoom, leitor de tela quando possível e reduced motion.
- Verificar console, hydration warnings, requests, overflow e layout shift.
- Verificar loading, empty, error, denied e success.

## Entrega
No resumo final informe:
1. o que mudou e por quê;
2. arquivos principais alterados;
3. decisões assumidas e pontos que exigem confirmação;
4. testes/checks executados e resultados reais;
5. limitações ou checks não executados.
Nunca afirme “testado”, “acessível”, “seguro” ou “pronto para produção” sem evidência adequada.

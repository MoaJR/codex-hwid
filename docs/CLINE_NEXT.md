# CLINE_NEXT — continuidade de execução

**Este é o arquivo de handoff obrigatório entre chats.** Ele é vivo e deve ser atualizado no fim de cada tarefa.

## Instrução de entrada
1. Leia este arquivo inteiro antes de iniciar.
2. Leia `.clinerules/CLINE_START.md` e as regras específicas em `.clinerules/`.
3. Leia `docs/PRODUCT_BASELINE.md`, `docs/VISUAL_IDENTITY.md`, `docs/UX_NAVIGATION.md`, `docs/PROGRESS.md` e os documentos diretamente relacionados à tarefa.
4. Inspecione o código e os testes atuais. Não presuma que a documentação descreve perfeitamente o estado implementado.
5. Continue do item **Próxima tarefa** abaixo. Se estiver vazio ou obsoleto, faça uma avaliação breve do estado e escolha o próximo passo de maior valor, sem ficar parado pedindo um plano genérico.

## Autonomia
Você tem autonomia para investigar, planejar, implementar, refatorar, criar/editar arquivos, corrigir bugs, melhorar UX/UI, acessibilidade, responsividade, testes e documentação necessários ao objetivo. Não trate este documento como uma lista de proibições de produto. Se uma solução melhor exigir mudar a abordagem, explique e execute localmente quando seguro.

Não faça deploy/publicação, alterações remotas, operações destrutivas em dados, nem mudanças irreversíveis fora do ambiente local sem autorização explícita. Nunca leia ou exponha segredos, credenciais ou dados reais de pacientes. Use identidades e dados fictícios em desenvolvimento e testes. Se uma decisão clínica, legal ou de privacidade for necessária e não estiver documentada, registre a dúvida e avance nas partes independentes.

## Registro da sessão atual
- Data: 11/11/2026
- Objetivo solicitado: continuar a partir de **Próxima tarefa** — auditar e concluir a navegação unificada da Área profissional (sidebar desktop persistente/colapsável, mobile com drawer e sem overflow, portal do paciente separado), com autonomia para implementar.
- O que foi investigado: `CLINE_NEXT.md`, `.clinerules/*`, `PROGRESS.md`, `ARCHITECTURE.md`, `UX_NAVIGATION.md`, `ROUTES.md`, `DESIGN_SYSTEM.md`; `src/app/painel/layout.tsx` e páginas, `src/components/dashboard/{app-shell,page-header,icons}.tsx`, `src/modules/account/panel-access.mjs`, `src/app/globals.css`, `src/styles/tokens.css`, `next.config.mjs`, `tests/panel-access.test.mjs`, `tests/design-tokens.test.mjs` e os specs Playwright de casca/portais/papéis/guardas.
- Constatação principal: unificação de rotas, menu único e gaveta já existiam (10/11/2026). Faltavam os três requisitos da própria tarefa ainda não implementados: sidebar **colapsável** com rótulos acessíveis e tooltip, **título da seção** na topbar e **barra inferior** opcional no mobile.
- O que foi implementado:
  - `src/modules/account/panel-access.mjs`: `shortTitle` por módulo, `mobileNavigationForRoles` (até 3 destinos + `hasMore`; `admin` nunca na barra) e `sectionForPath` (exata → aninhada mais específica → `null`; `/painel` só exato). Só apresentação: `Role`, `UserRole`, `policy.mjs`, schema e provisionamento intactos.
  - `app-shell.tsx`: colapso desktop via `data-collapsed`/`--sidebar-current-width`, preferência em `localStorage` restaurada só após a hidratação (`data-ready` evita mismatch e animação no load), rótulos clipados (nome acessível preservado), `title` como tooltip, monograma "DV", topbar com a seção atual, barra inferior mobile (`aria-label` próprio, `aria-current`, 44 px, safe-area, oculta com a gaveta aberta) e "Mais opções do menu".
  - `layout.tsx` passa `mobileNavigation`; `icons.tsx` ganhou `collapse`/`expand`; `sign-out-button.tsx` envolve o rótulo em `<span>` para permitir o clipe sem perder o nome acessível.
  - `tokens.css`: `--sidebar-width-collapsed: 76px` e `--app-bottom-nav-height: 60px`. `globals.css`: bloco recolhido, `.app-body` com `margin-left` variável, barra inferior, `data-mobile-nav` reservando espaço no conteúdo e reduced motion incluindo o `.app-body`.
  - Testes: 3 guardas novas em `tests/panel-access.test.mjs`, 1 em `tests/design-tokens.test.mjs` e 4 aceites novos em `tests/e2e/dashboard-shell.spec.ts` (colapso + persistência + rótulos, título da topbar, barra do titular com "Mais", barra do paciente sem destinos profissionais).
  - Docs: `UX_NAVIGATION.md` (Estado implementado), `DESIGN_SYSTEM.md §11`, `ARCHITECTURE.md` (rotas `/paciente` e `/admin` que ainda apareciam como atuais), `ROUTES.md` (descrição da casca), `DECISIONS.md` (decisão de 11/11 sobre recolhimento e barra inferior), `PROGRESS.md` e este arquivo.
- Arquivos alterados: `src/modules/account/panel-access.mjs`, `src/components/dashboard/app-shell.tsx`, `src/components/dashboard/icons.tsx`, `src/components/auth/sign-out-button.tsx`, `src/app/painel/layout.tsx`, `src/app/globals.css`, `src/styles/tokens.css`, `tests/panel-access.test.mjs`, `tests/design-tokens.test.mjs`, `tests/e2e/dashboard-shell.spec.ts`, `docs/{UX_NAVIGATION,DESIGN_SYSTEM,ARCHITECTURE,ROUTES,DECISIONS,PROGRESS,CLINE_NEXT}.md`. `next-env.d.ts` foi regravado pelo `next build` (`.next/dev/types` → `.next/types`), não é edição manual.
- Testes e validações executados (resultado real):
  - `npm test` → **188/188 passaram**, 0 falhas.
  - `npm run typecheck` → saída 0.
  - `npm run build:next` → concluído (duas vezes; a segunda após corrigir `display:block` da barra inferior).
  - `@playwright/test@1.65.0` instalado em `node_modules` (`package-lock.json` inalterado) e Chromium 1254 baixado; `chromium.launch()` confirmado.
  - Servidor de produção em `127.0.0.1:3000` (build final): `public.spec.ts` + `a11y-structure.spec.ts` + `identity.spec.ts` + `dashboard-shell.spec.ts` → **56 passaram / 16 não aplicáveis / 0 falhas**; dos 14 não aplicáveis de `dashboard-shell.spec.ts`, todos são aceites autenticados (o redirect 308 passou).
  - Harness de layout em navegador real (fora do repositório, CSS compilado + marcação equivalente do `AppShell`): 320/360/390/768/900 px com barra inferior fixa, itens de 44 px, reserva de 108 px e zero overflow; 901/1024/1280/1440 px com sidebar 272 px, conteúdo deslocado e sem barra; recolhida 76 px com rótulo clipado 1×1, monograma visível e zero overflow; gaveta em 320 px visível (272 px) e barra oculta. O harness encontrou um defeito real — `.app-bottom-nav` herdava `display:none` — já corrigido.
- Problemas encontrados / decisões pendentes:
  - **Bloqueio de ambiente:** os aceites autenticados leem `.env.local.accounts` e o servidor lê `.env.local`; aqui os arquivos existem apenas como `env.local` e `env.local.accounts` (sem ponto inicial). Nada foi lido, copiado ou renomeado por causa da regra de segredos, e o alvo do banco não pôde ser comprovado local sem expor credenciais. Por isso os 5 aceites novos e os 3 antigos da casca **não foram executados** aqui.
  - Decisão: tooltip nativa via `title` em vez de tooltip customizada, porque a sidebar usa `overflow-y:auto` e recortaria um pseudo-elemento fora dos 76 px. Os rótulos continuam acessíveis por clipe (não por `display:none`).
  - Decisão: barra inferior limitada a 3 destinos + "Mais" para caber em 320 px com alvo de 44 px; `admin` fica no drawer por não ser destino frequente e por não sugerir permissão.
  - `next-env.d.ts` aparece modificado no Git por efeito do build.
- Estado atual: casca profissional única com menu agrupado, sidebar recolhível no desktop, gaveta acessível e barra inferior no mobile; portal do paciente usa a mesma casca com navegação própria (Visão geral, Meu acompanhamento, Minha conta) e sem itens profissionais. Suíte unitária, typecheck e build verdes; aceites autenticados pendentes por falta de `.env.local`.

## Registro de infraestrutura — 11/11/2026
- Sintoma: `git push` falhava com `ERROR: Permission to MoaJR/codex-hwid.git denied to ZoomproStudio`, embora `git ls-remote origin` funcionasse (o repositório é público, então a leitura anônima mascarava o problema de escrita).
- Causa: o remote usava `git@github.com:MoaJR/codex-hwid.git` e `~/.ssh/config` não possui bloco `Host github.com`; o SSH oferecia a chave padrão `~/.ssh/id_ed25519`, que o GitHub associa à conta **ZoomproStudio**, sem permissão de escrita neste repositório. A chave `~/.ssh/id_ed25519_github_pessoal` corresponde à conta **MoaJR** (dona do repositório).
- Correção aplicada (somente configuração local, nenhum arquivo de produto alterado): `git remote set-url origin git@github-pessoal:MoaJR/codex-hwid.git`, usando o alias `github-pessoal` já existente com `IdentitiesOnly yes`.
- Verificações: `ssh -T git@github-pessoal` → `Hi MoaJR!`; `git push origin main` → `8bbe29d..13e35f7`; `git status -sb` → `## main...origin/main` sem `ahead`; `git ls-tree -r origin/main` → apenas `.env.example` entre os arquivos `.env*`, nenhum segredo publicado.
- Regra prática para próximas sessões: repositórios da conta pessoal (`MoaJR`) devem usar o alias `github-pessoal:` na URL do remote; repositórios da empresa usam `github-zoompro:`. Não altere `Host github.com` globalmente sem revisar todos os repositórios, porque isso troca a identidade padrão do SSH.
- Pendência de decisão: o commit `13e35f7` está assinado como `Zoompro <dev@zoomprostudio.com.br>` (configuração global de `user.name`/`user.email`). Mantido como está por não haver autorização para reescrever o commit. Se a autoria precisar ser `MoaJR`, o ajuste é `git commit --amend --reset-author` com `-c user.name/-c user.email` pontuais, sem alterar o `.gitconfig` global.

## Próxima tarefa
### 1. Executar os aceites autenticados da casca (bloqueado por ambiente)
- **Objetivo:** rodar `npm run e2e:frontend` com o build servido em loopback e identidades **fictícias** locais, validando os 5 aceites novos de `tests/e2e/dashboard-shell.spec.ts` e a regressão de `portals-responsive.spec.ts` e `roles.spec.ts`.
- **Como preparar (ação do responsável, fora do agente):** criar `.env.local` com banco local descartável e `AUTH_ENABLED` conforme `docs/LOCAL_DEVELOPMENT.md`, e `.env.local.accounts` no formato `email|PAPEL|senha`; provisionar com `npm run auth:provision` e semear com `npm run db:seed:scheduling`. Nunca apontar para Produção.
- **Comando:** `E2E_CONFIRM=E2E E2E_SERVER=start npm run e2e:frontend` (o `playwright.config.ts` aborta fora de loopback).
- **Critérios:** colapso e persistência verdes; topbar com a seção correta; barra do titular com 3 destinos + "Mais"; barra do paciente sem agenda, conteúdos ou administração; zero erro de console e zero overflow em 320–1440.
- **Se algo falhar:** corrigir o produto, não o teste; não usar `test.skip`/timeout maior para silenciar.

### 2. Depois disso — diferenciar a experiência do paciente na casca
- **Objetivo:** o portal do paciente compartilha a casca profissional (decisão de 10/11). Avaliar se o cabeçalho deve indicar "Área do paciente" em vez do wordmark "Psiquiatria", mantendo a marca e sem criar segunda aplicação.
- **Início sugerido:** `profileForRoles`/`profileLabelForRoles` já distinguem `PATIENT`; ajustar apenas `app-shell.tsx` (rótulo do cabeçalho e do topbar) e cobrir em `tests/e2e/dashboard-shell.spec.ts` + `tests/panel-access.test.mjs`. Não alterar guards nem dados.


## Regra obrigatória de encerramento
Ao terminar qualquer tarefa:
1. Atualize o registro da sessão atual com fatos, não intenções.
2. Atualize **Próxima tarefa** com o próximo passo mais útil e específico.
3. Atualize `docs/PROGRESS.md` e demais documentos impactados.
4. Verifique que este arquivo continua sendo a primeira leitura do próximo chat.
5. Não marque como concluído o que não foi validado. Se a tarefa ficou incompleta, registre exatamente onde parou e como retomar.

Não apague o histórico útil deste arquivo: substitua apenas o registro da sessão atual e a próxima tarefa; mantenha decisões e contexto necessários para continuidade.

# Progresso — 25/10/2026

## Fase atual: 5A + 4D — portais por papel, agenda interna e segurança da conta
- Better Auth 1.7.12 com adaptador Prisma, sessão em banco e plugin TOTP.
- /login, /verificar-acesso e /conta; handlers /api/auth/[...all].
- AUTH_ENABLED desabilitado por padrão no código e habilitado somente em Produção após o provisionamento. Sem signup público, account linking ou contas/senhas padrão.
- Papéis obtidos do banco a partir da sessão; guard com MFA da sessão específica para staff.
- Schema atual com 20 modelos e sete enums validado por getDMMF/getConfig WASM; identidade, auditoria, conteúdo e agenda permanecem no mesmo histórico de migrations.
- Prisma Postgres de produção inspecionado após a migration: 12/12 tabelas, colunas, índices, constraints, enum e limite de humor correspondem ao projeto.
- Histórico reconciliado pelo comando oficial do Prisma; o deploy `dpl_E2kAqStdH6dq81ea91mEZmKgJsrV` aplicou `20261024000000_add_access_audit` e terminou em `READY`.
- Onboarding TOTP implementado com QR Code local, chave manual, confirmação do primeiro código e códigos de recuperação.
- Provisionamento confiável implementado em `auth:provision`: sem signup público, sem senha em argumento e com revogação da sessão de bootstrap.
- Auditoria persistente instalada para provisionamento, TOTP e uso de código de recuperação; sem conteúdo clínico.
- Build aplica migrations e inspeciona o resultado somente em produção; preview e local não alteram o banco compartilhado.
- Cabeçalhos de segurança explícitos para todas as rotas: CSP, bloqueio de frame/objeto, `nosniff`, política de referência e Permissions Policy.
- Primeira conta provisionada em terminal confiável, conforme confirmação do responsável em 24/10/2026; nenhuma credencial foi enviada ou registrada no repositório.
- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` e `AUTH_ENABLED=true` configurados somente em Produção; o valor do secret não foi exibido.
- Login, ativação de TOTP e segundo acesso com MFA concluídos pelo responsável; runtime permaneceu sem erros.
- Controle de sessões 4C implementado em `/conta`: encerra somente outros acessos ativos, preserva a sessão atual, exige MFA da equipe, limita tentativas e grava auditoria sem token, IP ou navegador. Endpoints crus de listagem e revogação do provedor permanecem desativados; a troca de senha recebe a rota própria descrita no marco 4D.
- Troca de senha 4D implementada por rota própria: exige senha atual, confirmação e MFA para equipe ou qualquer conta com 2FA; usa o hash oficial do Better Auth, mantém somente a sessão atual, limita tentativas e grava `PASSWORD_CHANGED` atomicamente com a nova credencial e a revogação. O endpoint cru do provedor continua desativado.
- Deployment `dpl_BxiSYGnVGejz8gG5hqFso1kMDFk8` publicou o marco 4D no commit `7de56b6`: pipeline de produção concluído, domínio principal atualizado, health 200, conta anônima redirecionada ao login, rota própria limitada a POST, endpoint cru em 404 e nenhum erro de runtime na janela verificada.
- Deployment `dpl_93G7PjBHTE2Yw3TDYZeiN2CrEMRJ` publicou o controle de sessões e executou o checker da agenda com todas as invariantes aprovadas; health respondeu 200, rotas cruas desativadas responderam 404 e a janela de runtime ficou sem erros.
- CMS 3B implementado com blocos ordenados, rascunho, revisão, publicação, arquivamento reversível, controle de versão e auditoria por artigo.
- `DOCTOR` publica/retira; `ADMIN` escreve e envia para revisão; paciente e secretaria não recebem permissão editorial.
- Deployment `dpl_BXk3pVf4cfrmjJbUBrAd9f3vUQdA` aplicou `20261024110000_add_editorial_cms`, confirmou 14/14 tabelas e importou quatro artigos (`inserted: 4`, `skipped: 0`).
- Ciclo editorial completo rascunho → revisão → retorno → arquivamento executado pelo responsável; o blog permaneceu com três artigos, o item interno continuou em 404 e a API anônima em 401.
- Fase 5A implementada localmente: agenda interna com serviços, regras semanais, exceções, consultas, histórico, rate limit próprio e bloqueio GiST de sobreposição.
- Médico opera a própria agenda; secretaria mantém escrita de agenda da clínica única; administrador não recebe acesso. MFA da sessão continua obrigatório para equipe.
- O protótipo estático e o agendamento fictício foram retirados. `/agendar` agora encaminha ao painel protegido ou ao primeiro contato e não recebe dados pessoais nem realiza reserva pública.
- `/painel` foi implementado como entrada autenticada e apresenta os módulos permitidos pelos papéis da sessão. Login e verificação MFA retornam para essa rota.
- `/paciente` exige o papel `PATIENT` e `appointment.read`, usa somente o `userId` da sessão e exibe metadados mínimos das próprias consultas. A página é somente leitura e não expõe IDs.
- `/admin` exige `settings.manage` e MFA, mostra contagens e conteúdos editoriais reais e não consulta agenda, pacientes ou prontuário. O provisionamento continua interativo, sem credencial padrão.
- O handoff `CLINE_START.md`, `.clineignore`, `compose.dev.yml` e `docs/LOCAL_DEVELOPMENT.md` preparam VS Code/Cline com PostgreSQL 17 e segredos exclusivamente locais, sem acesso do agente ao ambiente de Produção.
- O bootstrap `scripts/setup-windows.ps1` diagnostica e instala Git, Node.js, WSL 2 e Docker Desktop no Windows, prepara o PostgreSQL 17 e aplica as migrations locais sem exibir segredos; autorização de administrador e reinício continuam visíveis ao responsável.
- A migration `20261025050000_remove_demo_content` atualiza apenas os textos semeados que ainda correspondem exatamente ao protótipo, incrementa a versão e registra auditoria por artigo.
- Deployment `dpl_DPSck3iYscPuyeoHvATp1QytTok8` publicou o commit `2b602a9`, aplicou `20261024180000_add_operational_scheduling`, confirmou 20/20 tabelas e criou quatro serviços (`inserted: 4`, `skipped: 0`).
- Redeploy idempotente `dpl_Dq8KeEsy62RvhGmn2RQJZp26a8EX` publicou o commit `08a933a`, não encontrou migrations pendentes e preservou os quatro serviços (`inserted: 0`, `skipped: 4`).
- Deployment `dpl_FvkwrsLWqVu8sJ3xJrNRhGuA5vYc` publicou o commit `15b171e` com os portais por papel, aplicou `20261025050000_remove_demo_content`, confirmou 20/20 tabelas, preservou os seeds sem duplicação e terminou em `READY`.
- `scheduling:check` foi adicionado para validar produção somente por contagens agregadas: fuso, catálogo, intervalos, estados, sobreposição, eventos e auditoria; não imprime nomes, e-mails, IDs ou horários individuais.

## Entregas anteriores preservadas
- Site público React, tratamentos, consulta online, contato e privacidade. O agendamento demonstrativo foi a primeira entrega de UX e foi substituído pelo acesso protegido em 25/10/2026.
- Foto original integrada na home e Sobre.
- Fase 3A: blog público, busca/categorias/artigos e API read-only; rascunhos não aparecem no site/API, mas código-fonte é público.

## Integração Vercel — evidência atual
- Plugin instalado e equipe `moajrs-projects` autorizada; projeto `vaz` acessível.
- Prisma Postgres `prisma-postgres-yellow-helmet` está disponível, com billing ativo e conectado a preview/produção.
- `DATABASE_URL`, `POSTGRES_URL` e `PRISMA_DATABASE_URL` existem como secrets; valores não foram lidos.
- Deploy `dpl_E2kAqStdH6dq81ea91mEZmKgJsrV` concluiu a migration de auditoria, a inspeção das 12 tabelas e a publicação em `drdouglasvaz.vercel.app`.
- Deploy `dpl_BXk3pVf4cfrmjJbUBrAd9f3vUQdA` publicou o CMS, inspecionou 14/14 tabelas e promoveu o commit `0636c218` ao domínio principal.
- Deploy `dpl_DPSck3iYscPuyeoHvATp1QytTok8` publicou a agenda 5A, confirmou o schema de 20 tabelas sem lacunas e promoveu o commit `2b602a9` a `drdouglasvaz.vercel.app`.
- Deploy `dpl_Dq8KeEsy62RvhGmn2RQJZp26a8EX` confirmou a repetição segura: nenhuma migration pendente, 20/20 tabelas íntegras, seeds sem duplicação e commit `08a933a` promovido ao domínio principal.
- Deploy `dpl_93G7PjBHTE2Yw3TDYZeiN2CrEMRJ` promoveu o commit `4d40ba0`, confirmou novamente 20/20 tabelas, nenhuma migration pendente, seeds sem duplicação e integridade agregada da agenda em estado `ready`.
- Deploy `dpl_BxiSYGnVGejz8gG5hqFso1kMDFk8` promoveu o commit `7de56b6` com a troca própria de senha; o build completo terminou em `READY` e o domínio `drdouglasvaz.vercel.app` recebeu o marco 4D.
- Deploy `dpl_FvkwrsLWqVu8sJ3xJrNRhGuA5vYc` promoveu o commit `15b171e`, aplicou a retirada do conteúdo legado e publicou `/painel`, `/paciente` e `/admin` no domínio principal.

## Verificações
- 75 testes automatizados cobrem autorização, configuração/origem, MFA, provisionamento, controle de sessões e senha, auditoria, workflow editorial, migrations, disponibilidade, idempotência, buffers, fuso, entrada estrita, checker agregado, seed, datas, publicação, diagnósticos seguros e isolamento por ambiente. O marco dos portais acrescenta cobertura para mapa de módulos, titularidade do paciente, primeiro acesso da equipe e retirada das superfícies demonstrativas.
- TypeScript e o build Next.js passaram. O schema com 20 modelos e sete enums passou em getDMMF/getConfig WASM.
- As migrations aplicaram em PostgreSQL 17 descartável. FK composta, exclusões do médico/paciente, buffers, liberação após cancelamento e rollback atômico foram exercitados. A migration editorial de retirada da demonstração também foi validada com conteúdo legado: rótulo, aviso, bloco, versão e auditoria foram atualizados como esperado. Produção já confirmou a migration da agenda e o redeploy sem pendências.
- A falha foi diagnosticada como migration inicial duplicada sobre um baseline já existente. A tentativa tinha zero etapas aplicadas; a estrutura foi verificada antes da reconciliação e nenhum dado de aplicação foi alterado.
- A geração oficial usa os binários Prisma e depende do acesso ao servidor de distribuição; no executor esse download permanece restrito. A geração de tipos via WASM não valida o runtime.
- O executor não conseguiu baixar o binário nativo do Prisma porque o host de binários respondeu 403; geração oficial, migration e inspeção foram confirmadas no build Vercel.
- Auditoria de dependências de runtime (`--omit=dev --omit=optional`) encontrou zero vulnerabilidades. A árvore de ferramentas Prisma 6 ainda herda o aviso de `deepmerge-ts`; a correção automática exige Prisma 7 e não foi forçada sem migração compatível.
- Smoke local atual: home, blog, API pública e login responderam 200; sem sessão, `/medico/conteudos` terminou em `/conta`.
- Login, ativação TOTP e segundo login com MFA tiveram E2E concluído. Recuperação, expiração/revogação e rate limit entre instâncias ainda precisam da bateria operacional completa.
- Smoke remoto atual: home, `/login` e `/api/health` responderam 200; `/api/auth/get-session` respondeu 200 com sessão anônima nula e sem cookie; runtime sem erros.
- Smoke do CMS: blog/API retornaram três artigos publicados, artigo público respondeu 200, rascunho respondeu 404, painel anônimo voltou ao login e API administrativa anônima respondeu 401.
- Smoke dos portais: home, `/agendar`, blog, API pública e health responderam 200; `/agendar` exibiu o gateway real sem texto demonstrativo; `/demonstracao.html` retornou 404; `/painel`, `/paciente` e `/admin` anônimos terminaram em `/login`. A janela verificada não apresentou erros de runtime.
- Smoke 4C: `/conta` anônimo terminou em `/login`; `/api/auth/list-sessions` e `/api/auth/change-password` responderam 404; a rota própria rejeitou GET com 405; runtime permaneceu sem erros.
- Smoke local 4D: a nova rota rejeitou GET, origem externa e corpo fora do contrato; com origem canônica e autenticação desabilitada falhou fechado em 503. O build Next.js incluiu `/api/account/password`. O E2E autenticado será feito após a publicação, porque o executor não consegue baixar o motor nativo do Prisma; o build Vercel continua sendo a geração oficial confirmada.

## Próximos passos
Provisionar e testar uma conta de cada papel: paciente limitado às próprias consultas; médico e secretaria na agenda; administrador limitado à administração editorial; todos com MFA aplicável. Executar com a conta do médico um ciclo controlado: regra semanal → paciente de teste → criação → reagendamento → cancelamento, seguido por `npm run scheduling:check` em terminal confiável. Em paralelo, validar troca de senha e encerramento de outros acessos com dois logins, expiração e uso único de código de recuperação. Depois concluir as decisões operacionais de privacidade antes da Fase 5B.
Não usar dados pessoais ou de saúde reais até os controles operacionais e a política de privacidade estarem validados.

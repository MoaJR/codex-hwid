# Progresso — 24/10/2026

## Fase atual: 5A — agenda operacional interna em validação
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
- Controle de sessões 4C implementado em `/conta`: encerra somente outros acessos ativos, preserva a sessão atual, exige MFA da equipe, limita tentativas e grava auditoria sem token, IP ou navegador. Endpoints crus de listagem/revogação e troca de senha do provedor ficam desativados até existirem fluxos próprios.
- Deployment `dpl_93G7PjBHTE2Yw3TDYZeiN2CrEMRJ` publicou o controle de sessões e executou o checker da agenda com todas as invariantes aprovadas; health respondeu 200, rotas cruas desativadas responderam 404 e a janela de runtime ficou sem erros.
- CMS 3B implementado com blocos ordenados, rascunho, revisão, publicação, arquivamento reversível, controle de versão e auditoria por artigo.
- `DOCTOR` publica/retira; `ADMIN` escreve e envia para revisão; paciente e secretaria não recebem permissão editorial.
- Deployment `dpl_BXk3pVf4cfrmjJbUBrAd9f3vUQdA` aplicou `20261024110000_add_editorial_cms`, confirmou 14/14 tabelas e importou quatro artigos (`inserted: 4`, `skipped: 0`).
- Ciclo editorial completo rascunho → revisão → retorno → arquivamento executado pelo responsável; o blog permaneceu com três artigos, o item interno continuou em 404 e a API anônima em 401.
- Fase 5A implementada localmente: agenda interna com serviços, regras semanais, exceções, consultas, histórico, rate limit próprio e bloqueio GiST de sobreposição.
- Médico opera a própria agenda; secretaria mantém escrita de agenda da clínica única; administrador não recebe acesso. MFA da sessão continua obrigatório para equipe.
- `/agendar` permanece demonstrativo e sem dados pessoais. A agenda operacional em `/medico/agenda` aceita somente identidades previamente provisionadas e deve usar dados fictícios nesta validação.
- Deployment `dpl_DPSck3iYscPuyeoHvATp1QytTok8` publicou o commit `2b602a9`, aplicou `20261024180000_add_operational_scheduling`, confirmou 20/20 tabelas e criou quatro serviços (`inserted: 4`, `skipped: 0`).
- Redeploy idempotente `dpl_Dq8KeEsy62RvhGmn2RQJZp26a8EX` publicou o commit `08a933a`, não encontrou migrations pendentes e preservou os quatro serviços (`inserted: 0`, `skipped: 4`).
- `scheduling:check` foi adicionado para validar produção somente por contagens agregadas: fuso, catálogo, intervalos, estados, sobreposição, eventos e auditoria; não imprime nomes, e-mails, IDs ou horários individuais.

## Entregas anteriores preservadas
- Site público React, tratamentos, consulta online, contato, privacidade e agendamento demonstrativo.
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

## Verificações
- 63 testes reais passaram: autorização, configuração/origem, MFA, provisionamento, controle de sessões, auditoria, workflow editorial, migrations, disponibilidade, idempotência, buffers, fuso, entrada estrita, checker agregado, seed, datas, publicação, diagnósticos seguros e isolamento por ambiente.
- TypeScript e o build Next.js passaram. O schema com 20 modelos e sete enums passou em getDMMF/getConfig WASM.
- As quatro migrations aplicaram do zero em PostgreSQL 17 descartável. FK composta, exclusões do médico/paciente, buffers, liberação após cancelamento e rollback atômico foram exercitados; produção confirmou a migration da agenda e o redeploy sem pendências.
- A falha foi diagnosticada como migration inicial duplicada sobre um baseline já existente. A tentativa tinha zero etapas aplicadas; a estrutura foi verificada antes da reconciliação e nenhum dado de aplicação foi alterado.
- A geração oficial usa os binários Prisma e depende do acesso ao servidor de distribuição; no executor esse download permanece restrito. A geração de tipos via WASM não valida o runtime.
- O executor não conseguiu baixar o binário nativo do Prisma porque o host de binários respondeu 403; geração oficial, migration e inspeção foram confirmadas no build Vercel.
- Auditoria de dependências de runtime (`--omit=dev --omit=optional`) encontrou zero vulnerabilidades. A árvore de ferramentas Prisma 6 ainda herda o aviso de `deepmerge-ts`; a correção automática exige Prisma 7 e não foi forçada sem migração compatível.
- Smoke local atual: home, blog, API pública e login responderam 200; sem sessão, `/medico/conteudos` terminou em `/conta`.
- Login, ativação TOTP e segundo login com MFA tiveram E2E concluído. Recuperação, expiração/revogação e rate limit entre instâncias ainda precisam da bateria operacional completa.
- Smoke remoto atual: home, `/login` e `/api/health` responderam 200; `/api/auth/get-session` respondeu 200 com sessão anônima nula e sem cookie; runtime sem erros.
- Smoke do CMS: blog/API retornaram três artigos publicados, artigo público respondeu 200, rascunho respondeu 404, painel anônimo voltou ao login e API administrativa anônima respondeu 401.
- Smoke 5A: `/agendar` respondeu 200 e continua demonstrativo; `/medico/agenda` anônimo terminou em `/login`; health respondeu produção, API pública manteve três artigos e a janela de runtime não apresentou erros.
- Smoke 4C: `/conta` anônimo terminou em `/login`; `/api/auth/list-sessions` e `/api/auth/change-password` responderam 404; a rota própria rejeitou GET com 405; runtime permaneceu sem erros.

## Próximos passos
Executar com a conta do médico um ciclo fictício: regra semanal → paciente de teste → criação → reagendamento → cancelamento, seguido por `npm run scheduling:check` em terminal confiável. Em paralelo, validar o novo encerramento de outros acessos com dois logins, expiração e uso único de código de recuperação. Depois concluir as decisões operacionais de privacidade antes da Fase 5B.
Não usar dados pessoais ou de saúde reais até os controles operacionais e a política de privacidade estarem validados.

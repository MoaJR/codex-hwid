# Progresso — 23/10/2026

## Fase atual: 4B — Primeiro acesso em validação controlada
- Better Auth 1.7.12 com adaptador Prisma, sessão em banco e plugin TOTP.
- /login, /verificar-acesso e /conta; handlers /api/auth/[...all].
- AUTH_ENABLED desabilitado por padrão no código e habilitado somente em Produção após o provisionamento. Sem signup público, account linking ou contas/senhas padrão.
- Papéis obtidos do banco a partir da sessão; guard com MFA da sessão específica para staff.
- Schema atual com 12 modelos validado por getDMMF/getConfig WASM: 11 modelos anteriores e `AuditEvent`.
- Prisma Postgres de produção inspecionado após a migration: 12/12 tabelas, colunas, índices, constraints, enum e limite de humor correspondem ao projeto.
- Histórico reconciliado pelo comando oficial do Prisma; o deploy `dpl_E2kAqStdH6dq81ea91mEZmKgJsrV` aplicou `20261024000000_add_access_audit` e terminou em `READY`.
- Onboarding TOTP implementado com QR Code local, chave manual, confirmação do primeiro código e códigos de recuperação.
- Provisionamento confiável implementado em `auth:provision`: sem signup público, sem senha em argumento e com revogação da sessão de bootstrap.
- Auditoria persistente instalada para provisionamento, TOTP e uso de código de recuperação; sem conteúdo clínico.
- Build aplica migrations e inspeciona o resultado somente em produção; preview e local não alteram o banco compartilhado.
- Primeira conta provisionada em terminal confiável, conforme confirmação do responsável em 24/10/2026; nenhuma credencial foi enviada ou registrada no repositório.
- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` e `AUTH_ENABLED=true` configurados somente em Produção; o valor do secret não foi exibido.
- Falta executar o E2E de login e MFA; portanto ainda não declarar os portais ou fluxos clínicos operacionais.

## Entregas anteriores preservadas
- Site público React, tratamentos, consulta online, contato, privacidade e agendamento demonstrativo.
- Foto original integrada na home e Sobre.
- Fase 3A: blog público, busca/categorias/artigos e API read-only; rascunhos não aparecem no site/API, mas código-fonte é público.

## Integração Vercel — evidência atual
- Plugin instalado e equipe `moajrs-projects` autorizada; projeto `vaz` acessível.
- Prisma Postgres `prisma-postgres-yellow-helmet` está disponível, com billing ativo e conectado a preview/produção.
- `DATABASE_URL`, `POSTGRES_URL` e `PRISMA_DATABASE_URL` existem como secrets; valores não foram lidos.
- Deploy `dpl_E2kAqStdH6dq81ea91mEZmKgJsrV` concluiu a migration de auditoria, a inspeção das 12 tabelas e a publicação em `drdouglasvaz.vercel.app`.

## Verificações
- 31 testes reais passaram: autorização, configuração/origem, MFA, provisionamento, auditoria, datas, publicação, diagnósticos seguros e isolamento de migrations por ambiente.
- TypeScript e o build Next.js local passaram. O schema com 12 modelos passou em getDMMF/getConfig WASM.
- A falha foi diagnosticada como migration inicial duplicada sobre um baseline já existente. A tentativa tinha zero etapas aplicadas; a estrutura foi verificada antes da reconciliação e nenhum dado de aplicação foi alterado.
- A geração oficial usa os binários Prisma e depende do acesso ao servidor de distribuição; no executor esse download permanece restrito. A geração de tipos via WASM não valida o runtime.
- O executor não conseguiu baixar o binário nativo do Prisma porque o host de binários respondeu 403; geração oficial, migration e inspeção foram confirmadas no build Vercel.
- Auditoria de dependências de runtime (`--omit=dev --omit=optional`) encontrou zero vulnerabilidades. A árvore de ferramentas Prisma 6 ainda herda o aviso de `deepmerge-ts`; a correção automática exige Prisma 7 e não foi forçada sem migração compatível.
- Smoke HTTP: 6 páginas abriram, login/conta exibem modo inativo e 4 endpoints auth responderam 503 sem cookie/detalhes de configuração.
- Modos operacionais de login/MFA, rate limit entre instâncias e CRUD de banco continuam sem E2E.
- Smoke remoto após o deploy: home, `/login` e `/api/health` responderam 200; `/api/auth/get-session` respondeu 503 genérico, sem expor configuração, enquanto a autenticação continua deliberadamente inativa.

## Próximos passos
4B: concluir o novo deployment e executar E2E de login, MFA, recuperação, expiração e revogação. Depois, retomar o CMS persistente 3B e o agendamento real da fase 5.
Não usar dados reais de saúde até os controles operacionais estarem validados.

# Progresso — 23/10/2026

## Fase atual: 4B — Banco conectado e migration inicial validada
- Better Auth 1.7.12 com adaptador Prisma, sessão em banco e plugin TOTP.
- /login, /verificar-acesso e /conta; handlers /api/auth/[...all].
- AUTH_ENABLED desabilitado por padrão. Sem signup público, account linking ou contas/senhas padrão.
- Papéis obtidos do banco a partir da sessão; guard com MFA da sessão específica para staff.
- Schema com 11 modelos validado por getDMMF/getConfig WASM e migration inicial aplicada em PostgreSQL 17 descartável.
- Build aplica migrations somente em produção; preview e local não alteram o banco compartilhado.
- Falta confirmar a migration no Prisma Postgres de produção, provisionar acesso e testar login/MFA; portanto não declarar login operacional.

## Entregas anteriores preservadas
- Site público React, tratamentos, consulta online, contato, privacidade e agendamento demonstrativo.
- Foto original integrada na home e Sobre.
- Fase 3A: blog público, busca/categorias/artigos e API read-only; rascunhos não aparecem no site/API, mas código-fonte é público.

## Integração Vercel — evidência atual
- Plugin instalado e equipe `moajrs-projects` autorizada; projeto `vaz` acessível.
- Prisma Postgres `prisma-postgres-yellow-helmet` está disponível, com billing ativo e conectado a preview/produção.
- `DATABASE_URL`, `POSTGRES_URL` e `PRISMA_DATABASE_URL` existem como secrets; valores não foram lidos.
- Migration de produção ainda depende do próximo deployment e será confirmada pelos logs/status do deploy.

## Verificações
- 25 testes reais passaram: autorização, configuração/origem, MFA, datas, publicação, diagnósticos seguros e isolamento de migrations por ambiente.
- TypeScript passou também com declarações geradas do schema atual via DMMF. O build Next.js local passou.
- O primeiro deploy da fase 4A falhou na Vercel; logs bloqueados com 403, causa ainda não confirmada. A etapa oficial de geração Prisma foi acrescentada antes de Next build para garantir consistência do cliente com o schema.
- A geração oficial usa os binários Prisma e depende do acesso ao servidor de distribuição; no executor esse download permanece restrito. A geração de tipos via WASM não valida o runtime.
- Schema parseado e validado em WASM: 11 modelos; sem conexão ao banco.
- Smoke HTTP: 6 páginas abriram, login/conta exibem modo inativo e 4 endpoints auth responderam 503 sem cookie/detalhes de configuração.
- Modos operacionais de login/MFA, rate limit entre instâncias e CRUD de banco continuam sem E2E.
- Sem revisão visual no navegador nesta execução.

## Próximos passos
4B: publicar e confirmar a migration, provisionar o primeiro acesso e completar onboarding MFA, E2E e auditoria. Depois CMS persistente 3B e agendamento real da fase 5.
Não usar dados reais de saúde até os controles operacionais estarem validados.

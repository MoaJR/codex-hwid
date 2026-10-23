# Progresso — 23/10/2026

## Fase atual: 4A — Base de autenticação preparada, ainda inativa
- Better Auth 1.7.12 com adaptador Prisma, sessão em banco e plugin TOTP.
- /login, /verificar-acesso e /conta; handlers /api/auth/[...all].
- AUTH_ENABLED desabilitado por padrão. Sem signup público, account linking ou contas/senhas padrão.
- Papéis obtidos do banco a partir da sessão; guard com MFA da sessão específica para staff.
- Schema com 11 modelos validado por getDMMF/getConfig WASM; sem migration ou geração do cliente novo neste marco.
- Falta ativação e testes reais com banco e usuários, portanto não declarar login operacional.

## Entregas anteriores preservadas
- Site público React, tratamentos, consulta online, contato, privacidade e agendamento demonstrativo.
- Foto original integrada na home e Sobre.
- Fase 3A: blog público, busca/categorias/artigos e API read-only; rascunhos não aparecem no site/API, mas código-fonte é público.

## Integração Vercel — evidência atual
- Plugin instalado e ferramentas disponíveis. list_projects localizou o projeto vaz.
- Detalhes do projeto e listagem de variáveis retornaram 403 para equipe moajrs-projects. A conta precisa autorizar esse escopo; não é necessário reinstalar o plugin.
- O erro sugere authorize_team_access, mas essa ferramenta não está disponível nesta sessão. Não foi aplicado contorno de autenticação.
- Prisma Postgres provisionado confirmado pelo screenshot anterior; a conexão e o schema do banco não foram inspecionados.

## Verificações
- 23 testes reais passaram: autorização, configuração/origem, MFA, datas, publicação e diagnósticos seguros.
- TypeScript e build público/auth inativa passaram.
- Schema parseado e validado em WASM: 11 modelos; sem conexão ao banco.
- Smoke HTTP: 6 páginas abriram, login/conta exibem modo inativo e 4 endpoints auth responderam 503 sem cookie/detalhes de configuração.
- Modos operacionais de login/MFA, rate limit entre instâncias e CRUD de banco continuam sem E2E.
- Sem revisão visual no navegador nesta execução.

## Próximos passos
4B: acesso à equipe Vercel, conexão/migrations revisadas, provisionamento de acesso e onboarding MFA, E2E e auditoria. Depois CMS persistente 3B e agendamento real da fase 5.
Não usar dados reais de saúde até os controles operacionais estarem validados.

# Fase 3 — Blog e CMS

## Marco 3A concluído: blog público
Objetivo: oferecer conteúdo educativo navegável sem abrir escrita administrativa antes da autenticação.
Escopo: artigos versionados em código, categorias, busca sem sensibilidade a acentos, páginas individuais, relacionados e API pública de leitura. Textos demonstrativos identificados e sujeitos a revisão clínica; sem atribuir autoria ou revisão ao médico.
Arquivos: src/content/articles.ts, src/modules/content/publication.mjs, src/modules/content/repository.ts, src/app/blog e src/app/api/articles/route.ts. Header/home dão acesso ao blog. A ilustração e o retrato futuro usam src/config/doctor.ts e DoctorPortrait.
Modelos iniciais: Article e ArticleBlock em TypeScript. O Provider ArticleReader foi preservado e agora escolhe a origem persistente quando o banco está configurado.
Rotas: /blog?q=&categoria=, /blog/[slug], GET /api/articles?q=&categoria=.
Segurança: somente PUBLISHED com data válida até o instante atual aparece em páginas/API. Rascunhos, publicação futura e datas inválidas são excluídos antes da busca. Slug não publicado retorna 404. Blocos são strings renderizadas por React, sem HTML arbitrário.
Aceite: testes de visibilidade e busca, TypeScript/build e smoke HTTP concluídos.

## Marco 3B implementado: CMS autenticado
Article e ArticleBlock persistem metadados e blocos ordenados. O workflow explícito é DRAFT → IN_REVIEW → PUBLISHED, com retorno ao rascunho e arquivamento reversível. Escrita só ocorre em DRAFT; toda mutação compara `version` para impedir sobrescrita silenciosa. Administradores escrevem e enviam para revisão; somente médicos com MFA da sessão publicam ou retiram publicações.

Rotas protegidas: `/medico/conteudos`, `/medico/conteudos/novo`, `/medico/conteudos/[id]` e APIs `/api/admin/articles`. POST/PATCH exigem origem canônica, sessão, RBAC e MFA. Auditoria guarda ator, ação, tipo e UUID do artigo, sem copiar texto editorial para o log. O leitor público consulta somente PUBLISHED com data passada; local sem banco usa os artigos versionados para desenvolvimento.

O build de produção aplica a migration, inspeciona 14 tabelas e importa apenas slugs ausentes. A importação nunca sobrescreve edições feitas no CMS. O deployment `dpl_BXk3pVf4cfrmjJbUBrAd9f3vUQdA` confirmou migration, schema e quatro imports. O responsável concluiu o primeiro ciclo editorial autenticado em 24/10/2026; o rascunho de teste permaneceu fora do blog e da API pública.

## Storage verificado
Prisma Postgres está conectado ao projeto Vercel `vaz`; migrations e inspeção estrutural executam somente em Produção. Variáveis foram gerenciadas sem exibir valores. O executor local não recebe `DATABASE_URL`, portanto compila com inicialização preguiçosa e conteúdo versionado; isso não substitui o teste do banco no deployment.

## Limites
Os textos precisam de revisão clínica para a versão definitiva. Foto original extraída do ZIP fornecido pelo usuário e incluída em public/images/dr-douglas-vaz.png, sem alterações no arquivo. DoctorPortrait usa o asset na home e na página Sobre; biografia e CRM/RQE continuam pendentes de confirmação.

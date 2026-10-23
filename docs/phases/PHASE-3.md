# Fase 3 — Blog e CMS

## Marco atual: 3A, blog público
Objetivo: oferecer conteúdo educativo navegável sem abrir escrita administrativa antes da autenticação.
Escopo: artigos versionados em código, categorias, busca sem sensibilidade a acentos, páginas individuais, relacionados e API pública de leitura. Textos demonstrativos identificados e sujeitos a revisão clínica; sem atribuir autoria ou revisão ao médico.
Arquivos: src/content/articles.ts, src/modules/content/publication.mjs, src/modules/content/repository.ts, src/app/blog e src/app/api/articles/route.ts. Header/home dão acesso ao blog. A ilustração e o retrato futuro usam src/config/doctor.ts e DoctorPortrait.
Modelos: Article e ArticleBlock em TypeScript; não há nova tabela ou migration. Provider ArticleReader read-only permite substituir a origem sem expor código de banco ao cliente.
Rotas: /blog?q=&categoria=, /blog/[slug], GET /api/articles?q=&categoria=.
Segurança: somente PUBLISHED com data válida até o instante atual aparece em páginas/API. Rascunhos, publicação futura e datas inválidas são excluídos antes da busca. Slug não publicado retorna 404. Blocos são strings renderizadas por React, sem HTML arbitrário.
Aceite: testes de visibilidade e busca, TypeScript/build e smoke HTTP. Não declarar CMS entregue sem editor persistente e autorização.

## Marco seguinte: 3B, CMS autenticado
Pendente: autenticação/RBAC da fase 4 como dependência, banco acessível, modelos persistidos, rascunho/revisão/publicação, validação servidor, auditoria e controle de concorrência. Nenhum endpoint de criação/edição é publicado neste marco.

## Storage identificado
Screenshot do usuário identifica Prisma Postgres disponível e conectado ao projeto Vercel vaz. Isso comprova provisionamento visual, não autenticação efetiva, schema instalado ou operação clínica. Sem acesso às variáveis/conta Vercel nesta sessão; DATABASE_URL não está configurada no executor atual. CLI de diagnóstico é local e não expõe segredos.

## Limites
Os textos precisam de revisão clínica para a versão definitiva. Foto original extraída do ZIP fornecido pelo usuário e incluída em public/images/dr-douglas-vaz.png, sem alterações no arquivo. DoctorPortrait usa o asset na home e na página Sobre; biografia e CRM/RQE continuam pendentes de confirmação.

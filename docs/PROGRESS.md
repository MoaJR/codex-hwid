# Progresso — 23/10/2026

## Fase atual: 3A — Blog público, implementado
- Índice /blog com busca por termo e categoria, páginas de artigo e leituras relacionadas.
- Três textos educativos de demonstração, sem autoria ou revisão médica atribuída.
- Provider server-only read-only e API GET /api/articles.
- Rascunhos, datas inválidas e publicações futuras excluídos antes da busca e das leituras por slug; rascunho retorna 404.
- Conteúdo versionado no Git, sem painel CMS ou edição autenticada. Rascunhos no repositório público não são confidenciais; a filtragem protege somente a superfície pública do site/API.

## Foto e site público
- PNG original fornecido pelo usuário incluído em public/images/dr-douglas-vaz.png, sem alterações no arquivo.
- Foto aplicada no hero e apresentação da home e na página Sobre, com Next Image e CSS responsivo.
- Biografia, formação, CRM/RQE, valores e contato oficial continuam pendentes de confirmação.
- Site público, páginas de tratamento e agendamento demonstrativo da etapa anterior preservados.

## Backend e storage — evidência e limite
- Publicação anterior Vercel confirmada por status GitHub; domínio informado pelo usuário: https://drdouglasvaz.vercel.app.
- Screenshot identifica Prisma Postgres Available associado ao projeto vaz. Há banco provisionado.
- Não há credenciais de Vercel ou DATABASE_URL neste executor; nenhuma consulta real no banco da Vercel foi executada. Não concluir que o schema ou o backend clínico estão operacionais.
- services:check detecta somente presença de variáveis; db:check executa SELECT 1 em terminal confiável quando configurado e com cliente gerado, sem imprimir credenciais ou erros brutos.
- db:check neste ambiente respondeu DATABASE_URL_MISSING, esperado na ausência de configuração local. Nenhuma migration aplicada.

## Verificações deste marco
- npm test: 15 testes reais passaram (autorização, datas/agendamento, publicação/busca e saída segura dos diagnósticos).
- npm run typecheck: passou.
- npm run build: passou.
- Smoke HTTP: blog, filtros, três artigos, API com campos permitidos, rascunho e slug inexistente 404, busca vazia e foto PNG original/otimizada passaram.
- Sem revisão visual/E2E em navegador nesta execução. A foto original foi inspecionada; enquadramento responsivo ainda precisa ser conferido visualmente no site.

## Próximos marcos
3B — CMS persistente: depende de banco acessível e identidade/RBAC da fase 4; ainda não implementado.
4 — Autenticação e autorização integradas, sessões e MFA da equipe.
5 — Agendamento real com disponibilidade transacional; a interface atual continua demonstrativa.

Sem dados clínicos reais, prontuário operacional, uploads privados ou pagamentos. Documentação do escopo em docs/phases/PHASE-3.md e docs/INTEGRATIONS.md.

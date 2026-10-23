# Dr. Douglas Vaz — Plataforma de Psiquiatria

Site público em Next.js App Router + React + TypeScript, com direção visual verde/off-white e páginas educativas. A base PostgreSQL/Prisma está conectada e a autenticação permanece protegida por um gate até o provisionamento do primeiro acesso.

## Acompanhar no VS Code
Node.js 22.15 ou superior. No terminal da pasta do projeto:

```sh
git pull --ff-only origin main
npm ci
npm run dev
```

Abra http://localhost:3000. Alterações locais têm atualização automática. Para receber novos commits, execute git pull em outro terminal. Se dependências ou scripts mudarem, pare o servidor com Ctrl+C, execute npm ci e inicie novamente.

Páginas: /sobre, /tratamentos, /consulta-online, /agendar, /contato, /privacidade e /blog. O blog tem busca, categorias e páginas de artigo; o conteúdo permanece versionado no código, sem CMS de escrita. A home agora é a versão React. O protótipo antigo continua em /demonstracao.html; para abri-lo sem Node, extraia o ZIP e abra index.html.

## Verificações

```sh
npm test
npm run typecheck
npm run build
npm start
```

No marco atual: 25 testes passaram, TypeScript e build público passaram. A migração inicial também passou em PostgreSQL 17 descartável, com 11 tabelas, 9 chaves estrangeiras e a restrição de humor entre 1 e 10. O build regenera o cliente Prisma e usa Webpack explicitamente. Somente o build de produção aplica migrations pendentes; local e preview não alteram o banco. Revisão visual e testes E2E do login ainda estão pendentes.

## Banco de dados
O frontend pode rodar sem configurar o banco. Para desenvolvimento local do backend, configure DATABASE_URL em `.env.local` usando `.env.example` como referência e execute:

```sh
npm run db:generate
npm run db:validate
npm run db:check
```

A geração oficial do Prisma depende dos binários distribuídos pelo provedor; a Vercel já executa essa etapa. A primeira migration está versionada e validada em banco descartável. Em produção, `npm run build` executa `prisma migrate deploy` antes do Next.js; preview e desenvolvimento pulam essa etapa. Segredos nunca devem ser commitados.

## Limites
/agendar é uma simulação: não pede dados pessoais, não reserva horários e não realiza pagamentos. O login continua desabilitado e não há API clínica liberada. A demonstração dos portais usa dados fictícios em memória. Não usar dados de saúde reais. A foto original fornecida pelo usuário foi integrada na home e na página Sobre. Biografia, CRM/RQE, valores e contatos oficiais aguardam confirmação.

Progresso e próximos passos em docs/PROGRESS.md. Escopo do marco em docs/phases/PHASE-1-2.md.

## Integrações
Prisma Postgres `prisma-postgres-yellow-helmet` confirmado pela API da Vercel como disponível e conectado ao projeto `vaz`. `DATABASE_URL`, `POSTGRES_URL` e `PRISMA_DATABASE_URL` existem como secrets em preview e produção; nenhum valor foi lido ou exibido. Detalhes em docs/INTEGRATIONS.md.

Fase atual: 4A — base de autenticação preparada, ainda desabilitada. Fase 3A (blog público) preservada; CMS 3B depende de conexão, schema e acesso autenticado operacional.

## Autenticação — marco 4A
/login, /verificar-acesso e /conta estão preparadas com Better Auth. O acesso é desabilitado por padrão e as APIs respondem 503 enquanto não configurado. Não há conta/senha padrão ou cadastro público.

```sh
npm run auth:check
```

AUTH_ENABLED só deve ser habilitado após a migration de produção ser confirmada, uma conta ser provisionada por processo confiável e login/MFA serem testados. Veja docs/phases/PHASE-4.md para critérios. Não publicar segredos em NEXT_PUBLIC_*.

A integração Vercel já tem acesso à equipe `moajrs-projects`. O projeto, o storage e os nomes das variáveis foram verificados sem descriptografar secrets.

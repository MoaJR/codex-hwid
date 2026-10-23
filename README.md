# Dr. Douglas Vaz — Plataforma de Psiquiatria

Site público em Next.js App Router + React + TypeScript, com direção visual verde/off-white e páginas educativas. Base PostgreSQL/Prisma e autorização planejadas para os próximos módulos.

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

No marco atual: 23 testes passaram, TypeScript e build público passaram. Smoke HTTP do site anterior e do novo blog, API e imagem otimizada também passou. O build usa Webpack explicitamente. Revisão visual e testes E2E no navegador ainda pendentes.

## Banco de dados — ainda não operacional
O frontend pode rodar sem configurar o banco. Para o desenvolvimento futuro do backend, configure DATABASE_URL no ambiente usando .env.example como referência e execute:

```sh
npm run db:generate
npm run db:validate
npm run db:check
```

A geração/validação do Prisma permanece pendente neste ambiente por restrição no download dos binários. Nenhuma migration foi aplicada. Não rodar migrations em produção sem revisão. Segredos nunca devem ser commitados.

## Limites
/agendar é uma simulação: não pede dados pessoais, não reserva horários e não realiza pagamentos. Não há login, API clínica ou banco conectado. A demonstração dos portais usa dados fictícios em memória. Não usar dados de saúde reais. A foto original fornecida pelo usuário foi integrada na home e na página Sobre. Biografia, CRM/RQE, valores e contatos oficiais aguardam confirmação.

Progresso e próximos passos em docs/PROGRESS.md. Escopo do marco em docs/phases/PHASE-1-2.md.

## Integrações
Prisma Postgres identificado no painel enviado pelo usuário, conectado ao projeto Vercel. A conexão real e o schema ainda não foram verificados. npm run services:check mostra apenas presença de variáveis no terminal atual. Detalhes em docs/INTEGRATIONS.md.

Fase atual: 4A — base de autenticação preparada, ainda desabilitada. Fase 3A (blog público) preservada; CMS 3B depende de conexão, schema e acesso autenticado operacional.

## Autenticação — marco 4A
/login, /verificar-acesso e /conta estão preparadas com Better Auth. O acesso é desabilitado por padrão e as APIs respondem 503 enquanto não configurado. Não há conta/senha padrão ou cadastro público.

```sh
npm run auth:check
```

AUTH_ENABLED só deve ser habilitado após a conexão e o schema serem validados, cliente gerado, contas provisionadas e login/MFA testados. Não aplicar migrations automaticamente no deploy. Veja docs/phases/PHASE-4.md para critérios. Não publicar segredos em NEXT_PUBLIC_*.

A integração Vercel já foi instalada; o acesso aos detalhes/variáveis está bloqueado com 403 no escopo da equipe moajrs-projects. A conta precisa autorizar essa equipe pela conexão existente.

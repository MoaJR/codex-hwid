# Dr. Douglas Vaz — Plataforma de Psiquiatria

Site público, CMS editorial e agenda operacional interna em Next.js App Router + React + TypeScript, com direção visual verde/off-white. A base PostgreSQL/Prisma está conectada, a primeira conta usa MFA e as áreas de equipe exigem sessão verificada.

## Acompanhar no VS Code
Node.js 22.15 ou superior. No terminal da pasta do projeto:

```sh
git pull --ff-only origin main
npm ci
npm run dev
```

Abra http://localhost:3000. Alterações locais têm atualização automática. Para receber novos commits, execute git pull em outro terminal. Se dependências ou scripts mudarem, pare o servidor com Ctrl+C, execute npm ci e inicie novamente.

Páginas: /sobre, /tratamentos, /consulta-online, /agendar, /contato, /privacidade e /blog. O blog tem busca, categorias e páginas de artigo; CMS e agenda protegidos ficam em /medico/conteudos e /medico/agenda. A home agora é a versão React. O protótipo antigo continua em /demonstracao.html.

## Verificações

```sh
npm test
npm run typecheck
npm run build
npm start
```

No marco atual: 67 testes, o TypeScript e o build Next.js passaram. O schema tem 20 modelos para identidade, domínio inicial, auditoria, conteúdo e agenda. O build regenera o cliente Prisma e usa Webpack explicitamente. Somente o build de produção aplica migrations pendentes, inspeciona o resultado, executa seeds aditivos e roda a checagem agregada da agenda; local e preview não alteram o banco.

## Banco de dados
O frontend pode rodar sem configurar o banco. Para desenvolvimento local do backend, configure DATABASE_URL em `.env.local` usando `.env.example` como referência e execute:

```sh
npm run db:generate
npm run db:validate
npm run db:check
npm run scheduling:check
```

A geração oficial do Prisma depende dos binários distribuídos pelo provedor; a Vercel já executa essa etapa. A migration inicial foi validada em banco descartável e reconciliada com o schema que já existia no Prisma Postgres. Em produção, `npm run build` executa `prisma migrate deploy` e depois inspeciona o schema antes do Next.js; preview e desenvolvimento pulam essas etapas. Segredos nunca devem ser commitados.

## Limites
/agendar é uma simulação: não pede dados pessoais, não reserva horários e não realiza pagamentos. `/medico/agenda` é uma área interna em validação e deve usar somente identidades fictícias. Não há prontuário ou API clínica liberada. Não usar dados pessoais ou de saúde reais. A foto original fornecida pelo usuário foi integrada na home e na página Sobre. Biografia, CRM/RQE, valores e contatos oficiais aguardam confirmação.

Progresso e próximos passos em docs/PROGRESS.md. O escopo atual está em docs/phases/PHASE-5.md; a base visual permanece documentada em docs/phases/PHASE-1-2.md.

## Integrações
Prisma Postgres `prisma-postgres-yellow-helmet` confirmado pela API da Vercel como disponível e conectado ao projeto `vaz`. `DATABASE_URL`, `POSTGRES_URL` e `PRISMA_DATABASE_URL` existem como secrets em preview e produção; nenhum valor foi lido ou exibido. Detalhes em docs/INTEGRATIONS.md.

Fase atual: 5A, com endurecimento 4D da conta — login/MFA, CMS e agenda operacional interna estão publicados; o fluxo próprio de troca de senha está em publicação. Os próximos aceites são a troca de senha com dois acessos e um ciclo completo da agenda com identidade fictícia; dados pessoais ou clínicos reais continuam bloqueados.

## Autenticação — marco 4B
/login, /verificar-acesso e /conta estão preparadas com Better Auth. A conta permite cadastrar um aplicativo autenticador por QR Code, guardar códigos de recuperação e usar cada código uma única vez. Provisionamento, TOTP e uso de recuperação deixam eventos de auditoria sem conteúdo clínico. O acesso permanece desabilitado por padrão e as APIs respondem 503 enquanto não configurado. Não há conta/senha padrão ou cadastro público.

```sh
npm run auth:check
```

Contas são provisionadas somente em terminal confiável; a senha é solicitada interativamente e nunca é aceita como argumento:

```sh
npm run auth:provision -- --email usuario@exemplo.com --name "Nome" --role DOCTOR --confirm PROVISIONAR
```

Na Vercel, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` e `AUTH_ENABLED=true` estão configurados somente para Produção. Para provisionar outra conta em um terminal confiável, atualize o repositório, autentique o Vercel CLI e carregue as variáveis sem mostrá-las na tela:

```sh
npx vercel link
npx vercel env pull .env.local --environment=production --yes
npm run auth:check
npm run auth:provision -- --email SEU_EMAIL --name "Dr. Douglas Vaz" --role DOCTOR --confirm PROVISIONAR
```

O script solicitará a senha duas vezes sem eco. `.env.local` já é ignorado pelo Git; nunca cole a senha ou o conteúdo desse arquivo no chat. O gate está ativo apenas para testar login, cadastro de MFA e recuperação; operações clínicas continuam bloqueadas. Veja docs/phases/PHASE-4.md para critérios. Não publicar segredos em `NEXT_PUBLIC_*`.

A integração Vercel já tem acesso à equipe `moajrs-projects`. O projeto, o storage e os nomes das variáveis foram verificados sem descriptografar secrets. Em `/conta`, o usuário pode encerrar os outros acessos ativos e alterar a própria senha; contas com 2FA precisam verificá-la, a sessão atual é preservada e as ações são auditadas sem expor tokens ou detalhes de dispositivo.

## CMS editorial — marco 3B
Após login e MFA, médicos e administradores autorizados acessam `/medico/conteudos`. O fluxo usa rascunho, revisão, publicação e arquivamento reversível. Administradores podem escrever e enviar para revisão; somente o papel `DOCTOR` publica ou retira um texto publicado. Toda mutação exige origem canônica, usa controle de versão e grava ator, ação e artigo na auditoria. O conteúdo é renderizado como texto/blocos React, sem HTML arbitrário.

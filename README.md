# Dr. Douglas Vaz — Plataforma de Psiquiatria

## Ver a demonstração
Baixe Code → Download ZIP, extraia e abra index.html no navegador. Dados fictícios, sem backend. A mesma demonstração está em public/demonstracao.html.

## Aplicação em desenvolvimento
Base Next.js App Router + React + TypeScript, com modelo PostgreSQL/Prisma e política centralizada de autorização. Node.js 22 ou superior.

```sh
npm ci
npm run dev
```

Abra http://localhost:3000. O endpoint /api/health verifica somente a aplicação. Para configuração futura do banco, use .env.example como referência e configure DATABASE_URL no ambiente; nenhuma migration é aplicada automaticamente.

```sh
npm test
npm run typecheck
npm run db:validate
npm run build
```

## Estado verificado
Dependências instaladas, lockfile gerado e testes de autorização passando. TypeScript isolado sem erros. Geração Prisma bloqueada por 403 no download de binários; build Next.js falhou ao ler --showConfig do TypeScript. Ver docs/PROGRESS.md para os limites da validação. Não há versão de produção aprovada.

## Segurança e escopo
Sem login, API clínica ou banco conectado. A política de autorização deve receber ator de sessão verificada e escopo obtido do servidor antes de futuras operações. Admin e secretaria não recebem acesso clínico implícito. Nunca inserir dados de saúde reais na demonstração. Foto, biografia e CRM/RQE aguardam confirmação.

Documentação: docs/phases/PHASE-0.md, docs/ARCHITECTURE.md, docs/DATABASE.md, docs/PERMISSIONS.md e docs/SECURITY.md.

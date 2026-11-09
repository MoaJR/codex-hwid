# PostgreSQL, Prisma e migrations

## Schema e acesso
- Schema canônico em `prisma/schema.prisma`.
- PostgreSQL é a garantia final de integridade e concorrência.
- Prisma Client somente no servidor; inicialização lazy conforme arquitetura existente.
- Selecione apenas campos necessários (`select`/projeções); evite `include` amplo.
- Respeite UUIDs, foreign keys, índices, checks, enums e constraints existentes.
- `Restrict` e histórico preservado são intencionais; não substitua por cascade sem decisão formal.

## Migrations
- Toda mudança persistente exige migration versionada e revisada.
- Não edite migrations já aplicadas.
- Não execute `migrate reset`, `db push`, drop, truncate ou comandos destrutivos em ambiente compartilhado/produção.
- Não crie migrations para “limpar” modelos legados sem decisão e plano de retenção.
- Antes de propor migration: inspecione schema, migrations, uso no código e constraints; avalie rollout e compatibilidade.
- Migrations devem ser seguras para deploy e, quando necessário, seguir expand → migrate → contract.
- Seeds devem ser idempotentes e nunca sobrescrever conteúdo editado.
- Em desenvolvimento, use PostgreSQL 17 local conforme `docs/LOCAL_DEVELOPMENT.md`.

## Agenda
- Persistir timestamps em UTC/TIMESTAMPTZ; preservar fuso `America/Sao_Paulo` onde aplicável.
- Intervalos são `[início, fim)`; contiguidade é permitida.
- Duração, modalidade e buffers vêm do catálogo no servidor, não do cliente.
- Lock transacional por médico e exclusion constraints GiST são garantias complementares; não remover nenhuma das duas.
- Criação exige `Idempotency-Key` UUID; reagendamento usa versão otimista.
- Cancelamento preserva consulta e eventos, liberando o intervalo sem exclusão física.
- Conflitos não devem revelar detalhes do PostgreSQL.

## Transações e concorrência
- Use transação para gravações que precisam ser atômicas (domínio + evento + auditoria).
- Trate conflitos e retry de forma explícita; não confie em verificação prévia isolada.
- Evite transações longas e chamadas externas dentro de transações.
- Não altere nível de isolamento ou lock sem compreender invariantes e testes de concorrência.

## Comandos
- Siga `docs/LOCAL_DEVELOPMENT.md`.
- `npm run build:next` é o build local seguro; não defina `VERCEL_ENV=production` localmente.
- `npm run privacy:check` é exclusivamente local/read-only e não substitui aprovação das decisões.
- Nunca conecte ferramenta/agente ao banco de Produção.

# Integrações e estado verificado

## Vercel
Publicação da branch main confirmada pelo status de commit Vercel do GitHub. URL: https://drdouglasvaz.vercel.app. A integração autorizada acessa a equipe `moajrs-projects` e o projeto `vaz` (`prj_GMLIAzAVl7IAu3fLVP7c7k6cLZVr`).

## Prisma Postgres
Recurso `prisma-postgres-yellow-helmet` confirmado pela API da Vercel como `available`, billing ativo, região `iad1`, associado a `vaz` em preview e produção. Existem secrets `DATABASE_URL`, `POSTGRES_URL` e `PRISMA_DATABASE_URL`; somente nomes, destinos e estado foram consultados. Nenhum valor foi descriptografado. O deploy `dpl_3ApiNCDmxBCpcDprKeFuJEpgVbgJ` confirmou conexão, schema completo e migration sem pendências; terminou em `READY` e foi promovido ao domínio principal.

### Checagens em terminal confiável
```sh
npm run services:check
npm run db:generate
npm run db:validate
npm run db:check
```
services:check informa apenas a presença de nomes conhecidos, nunca valores, hosts ou URLs. connectionChecked:false significa que ele não acessa o serviço. db:check faz somente SELECT 1, exige cliente Prisma gerado, tem limite de tempo e não imprime a mensagem original do provedor. Sucesso comprova somente a consulta simples, não tabelas, permissões por paciente, schema nem prontidão clínica.
Os scripts carregam .env.local quando existir, além das variáveis do processo. Não executam download de configurações da Vercel. Na máquina local, as variáveis precisam ser configuradas pelo responsável em canal seguro. O CLI Prisma também pode carregar .env conforme seu comportamento nativo. Não criar diagnósticos de credenciais em endpoint público.

## Como distinguir serviços
| Serviço/indício | Fornece | Não comprova |
| --- | --- | --- |
| Prisma Postgres / DATABASE_URL | Banco PostgreSQL | Schema, sessões, RBAC e APIs implementadas |
| Blob / BLOB_READ_WRITE_TOKEN | Armazenamento de arquivos | Banco relacional ou acesso clínico privado |
| Supabase / SUPABASE_URL | Endpoint de plataforma | Banco e autenticação já integrados |
| Redis / KV_REST_API_URL | Cache/chave-valor | Persistência clínica relacional |

Não aplicar fallbacks silenciosos entre aliases POSTGRES_* e DATABASE_URL. Nunca colocar chaves sensíveis em NEXT_PUBLIC_*. A foto institucional pode ser asset público; documentos de pacientes exigem storage privado e URLs temporárias nas fases correspondentes.

## Foto institucional
PNG original extraído do Doutor.zip enviado pelo usuário. Asset em public/images/dr-douglas-vaz.png. Enquadramento por CSS/Next Image, sem alterar o original. Biografia e credenciais ainda aguardam confirmação.

## Atualização — integração Vercel autorizada
A autorização da equipe foi concluída. `get_project`, metadados do storage e listagem segura de variáveis funcionam para `moajrs-projects`; o bloqueio 403 anterior está resolvido. Nenhuma variável do banco foi descriptografada ou exibida.

## Autenticação preparada
Better Auth usa DATABASE_URL, BETTER_AUTH_SECRET e BETTER_AUTH_URL, além do gate AUTH_ENABLED=true. Manter gate false até a migration de auditoria, a primeira conta e os fluxos estarem verificados. auth:check informa somente nomes ausentes/inválidos e flags; não exibe valores e não testa login/banco. auth:provision exige terminal interativo, recusa senha por argumento, revoga a sessão de bootstrap e grava auditoria.

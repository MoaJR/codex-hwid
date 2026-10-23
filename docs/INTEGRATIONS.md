# Integrações e estado verificado

## Vercel
Publicação da branch main confirmada pelo status de commit Vercel do GitHub. URL fornecida na imagem do usuário: https://drdouglasvaz.vercel.app. A conta Vercel e suas variáveis não estão acessíveis pelos conectores atuais. Um deployment não comprova que o banco está conectado.

## Prisma Postgres
Serviço identificado em screenshot do usuário como prisma-postgres-yellow-helmet, status Available, associado a vaz. Compatível com o datasource PostgreSQL planejado. Schema atual espera DATABASE_URL, somente no servidor. Uma conexão real e migrations ainda não foram executadas nesta entrega. Não copie credenciais para o chat nem para o repositório.

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

## Atualização — integração Vercel instalada
A conexão listou o projeto vaz. get_project e filter_project_envs retornaram 403 porque falta acesso à equipe moajrs-projects. A recuperação indicada é autorizar esse escopo pela conexão existente; não solicitar senhas/tokens no chat. A ferramenta authorize_team_access mencionada pelo erro não está disponível no conjunto atual. Nenhuma variável foi descriptografada, alterada ou criada.

## Autenticação preparada
Better Auth usa DATABASE_URL, BETTER_AUTH_SECRET e BETTER_AUTH_URL, além do gate AUTH_ENABLED=true. Manter gate false até schema, contas e fluxos estarem verificados. auth:check informa somente nomes ausentes/inválidos e flags; não exibe valores e não testa login/banco.

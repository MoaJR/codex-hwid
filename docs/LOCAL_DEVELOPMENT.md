# Desenvolvimento local no VS Code

O ambiente recomendado usa PostgreSQL 17 local. Ele permite testar login, MFA e painéis sem expor o banco ou os segredos de Produção ao VS Code ou ao Cline.

## Pré-requisitos

- Node.js 22.15 ou superior
- Git
- Docker Desktop
- VS Code com Cline

## 1. Atualizar e instalar

No PowerShell, dentro da pasta do projeto:

```powershell
git pull --ff-only origin main
npm ci
Copy-Item .env.example .env.local
```

No Bash, use `cp .env.example .env.local` no lugar de `Copy-Item`.

## 2. Preparar `.env.local`

Gere uma chave exclusiva para seu computador:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Copie o resultado para `BETTER_AUTH_SECRET` e altere `AUTH_ENABLED` para `true`. O arquivo deve ficar assim, com a chave gerada no lugar do texto indicado:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/douglas_vaz_dev?schema=public"
AUTH_ENABLED=true
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="COLE_AQUI_A_CHAVE_LOCAL_GERADA"
```

`.env.local` é ignorado pelo Git e pelo Cline. Não envie esse arquivo por chat e não use nele a URL do banco de Produção.

Para trabalhar apenas nas páginas públicas, o banco pode permanecer desligado e `AUTH_ENABLED=false`; login e painéis autenticados ficarão indisponíveis nesse modo.

## 3. Iniciar o PostgreSQL local

```powershell
docker compose -f compose.dev.yml up -d --wait
docker compose -f compose.dev.yml ps
```

O serviço expõe a porta 5432 somente em `127.0.0.1` e persiste os dados em um volume Docker local.

## 4. Criar o schema e o conteúdo inicial

```powershell
npm run db:generate
npm run db:migrate:deploy
npm run db:inspect:schema
npm run db:seed:articles
npm run auth:check
```

## 5. Criar identidades fictícias

Crie exatamente um médico antes do catálogo da agenda:

```powershell
npm run auth:provision -- --email medico@local.test --name "Dr. Douglas Vaz" --role DOCTOR --confirm PROVISIONAR
npm run db:seed:scheduling
npm run scheduling:check
```

Depois crie os outros perfis:

```powershell
npm run auth:provision -- --email admin@local.test --name "Administrador Local" --role ADMIN --confirm PROVISIONAR
npm run auth:provision -- --email paciente@local.test --name "Paciente Teste" --role PATIENT --confirm PROVISIONAR
npm run auth:provision -- --email secretaria@local.test --name "Secretaria Teste" --role SECRETARY --confirm PROVISIONAR
```

Cada comando solicita uma senha duas vezes sem exibi-la. Use senhas apenas de desenvolvimento e diferentes das suas credenciais reais.

## 6. Abrir o projeto

```powershell
npm run dev
```

Abra http://localhost:3000. O Next.js atualiza a página automaticamente depois de alterações salvas.

## 7. Verificar antes de entregar

```powershell
npm test
npm run typecheck
npm run build:next
```

Não defina `VERCEL_ENV=production` no computador local. O script `npm run build` usa essa variável para decidir se deve aplicar migrations e seeds no ambiente de publicação; para a verificação local, prefira `npm run build:next`.

## Vercel e segredos

Para o trabalho diário, não baixe as variáveis de Produção para o Cline. Variáveis modernas do tipo Secret podem não ser retornadas por `vercel env pull`, e o pull substitui todo o arquivo de destino.

Se o projeto tiver valores próprios e isolados no ambiente Development da Vercel, eles podem ser usados assim:

```powershell
npx vercel link
npx vercel env pull .env.local --environment=development --yes
```

O banco Docker continua sendo o caminho padrão. Provisionamento em Produção deve ocorrer somente em uma sessão de terminal confiável já autorizada, fora do contexto do Cline, sem expor credenciais.

## Comandos do banco local

Parar sem apagar os dados:

```powershell
docker compose -f compose.dev.yml stop
```

Iniciar novamente:

```powershell
docker compose -f compose.dev.yml start
```

Apagar e recriar **somente o banco local**:

```powershell
docker compose -f compose.dev.yml down -v
docker compose -f compose.dev.yml up -d --wait
```

Depois da recriação, repita migrations, seeds e provisionamento.

## Problemas comuns

- Se a porta 5432 já estiver em uso, pare o outro PostgreSQL ou altere a porta publicada no `compose.dev.yml` e na `DATABASE_URL` pelo mesmo valor.
- Se o Prisma receber 403 ao baixar seus binários, use uma rede que permita `binaries.prisma.sh` e execute novamente `npm run db:generate`. Não ignore checksum nem baixe binários de origem desconhecida.
- Se login funcionar na Vercel e falhar localmente, confirme `AUTH_ENABLED=true`, a origem exata `http://localhost:3000`, o banco saudável e uma chave local com pelo menos 32 caracteres.

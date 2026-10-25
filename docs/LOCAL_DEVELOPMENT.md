# Desenvolvimento local no VS Code

O ambiente recomendado usa PostgreSQL 17 local. Ele permite testar login e painéis sem expor o banco ou os segredos de Produção ao VS Code ou ao Cline.

## Pré-requisitos

- Node.js 22.15 ou superior
- Git
- Docker Desktop
- VS Code com Cline

## Instalação automatizada no Windows

Se o Cline informar que Node.js, Docker, WSL 2 ou o banco não estão disponíveis, abra o terminal **PowerShell** do VS Code na pasta do projeto e execute:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -InstallMissing
```

O script diagnostica Git, Node.js 22.15+, WSL 2, Docker Desktop e Docker Compose; instala o que estiver ausente pelos canais oficiais do Windows; cria uma configuração local com chave aleatória sem exibi-la; inicia o PostgreSQL 17; instala as dependências; aplica as migrations; e valida schema, seed editorial e autenticação. Ele recusa qualquer `.env.local` que não aponte para o banco local exato.

O Windows pode exibir uma janela de administrador para instalar o WSL 2 e o Docker Desktop. Aceite essa janela. Se o script mostrar `[REINICIO NECESSARIO]`, reinicie o computador, abra novamente o projeto e repita o mesmo comando. Na primeira abertura do Docker Desktop, conclua os termos mostrados pelo próprio aplicativo e repita o comando caso o tempo de espera termine.

Depois que aparecer `Ambiente local preparado com sucesso`, siga a seção **Criar identidades fictícias** abaixo e execute `npm run dev`. O script não cria usuários ou senhas padrão.

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
npm run privacy:check
```

`privacy:check` é somente leitura e somente local. Ele devolve contagens agregadas, a idade do registro mais antigo por categoria e booleanos de consistência para apoiar as decisões D3, D5 e D6 de `docs/PRIVACY.md`; não imprime identidade, contato, token nem horário individual e recusa qualquer banco que não esteja em `localhost`, `127.0.0.1` ou `::1`.

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

Com o PostgreSQL local no ar e as identidades fictícias provisionadas, o ciclo completo da agenda e a segurança da conta também podem ser conferidos sem digitação e sem imprimir dados pessoais:

```bash
npm run e2e:scheduling
npm run e2e:account
npm run scheduling:check
```

O aceite da conta troca a senha da identidade fictícia e restaura o valor original; por causa do limite de 5 tentativas por 15 minutos, ele mantém `.e2e-account.lock` e recusa uma segunda execução antes de 16 minutos.

Não defina `VERCEL_ENV=production` no computador local. O script `npm run build` usa essa variável para decidir se deve aplicar migrations e seeds no ambiente de publicação; para a verificação local, prefira `npm run build:next`.

### Equivalente em Linux/Bash

Os mesmos passos, sem PowerShell, verificados em Ubuntu 22.04 com Node 24. O Docker não
vem instalado por padrão; instale pelo sistema (o `docker.io` e o `docker-compose-v2` estão
disponíveis no repositório `universe` do Ubuntu 22.04):

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker "$USER"   # depois feche e reabra o terminal
docker --version && docker compose version

docker compose -f compose.dev.yml up -d --wait
docker compose -f compose.dev.yml ps
docker exec douglas-vaz-postgres psql -U postgres -d douglas_vaz_dev -c 'select version();'
```

Uma vez com Docker instalado e o `.env.local` apontando para o banco local, o restante é um
único comando (ele recusa executar se algum valor não for local, não exibe segredos e não
cria contas):

```bash
npm run local:bootstrap
```

O script valida a configuração, sobe o PostgreSQL, aplica migrations, inspeciona o schema,
semeia artigos e o catálogo da agenda, e informa o comando de provisionamento que ainda
precisa ser digitado por você em terminal interativo.

Sem `docker`/`docker compose`, o caminho de login e painéis não pode ser exercitado e
o E2E fica bloqueado; apenas páginas públicas, testes automatizados, typecheck e
`build:next` funcionam. O roteiro de aceite dos quatro papéis está em `docs/E2E_5A_ROLES.md`.

Para conferir a configuração local sem expor a senha do banco:

```bash
node --env-file=.env.local -e "const u=new URL(process.env.DATABASE_URL);console.log({host:u.hostname,port:u.port,database:u.pathname.slice(1),authEnabled:process.env.AUTH_ENABLED,baseUrl:process.env.BETTER_AUTH_URL})"
```

O resultado deve indicar `host: '127.0.0.1'`, `port: '5432'`, `database: 'douglas_vaz_dev'`,
`authEnabled: 'true'` e `baseUrl: 'http://localhost:3000'`. Qualquer outro host significa
que o `DATABASE_URL` aponta para fora da máquina e os comandos de banco não devem ser
executados.

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

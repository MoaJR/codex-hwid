#!/usr/bin/env bash
# Prepara o ambiente local (PostgreSQL 17 em Docker) para o E2E da Fase 5A.
#
# Regras de segurança deste script:
# - não cria contas, não inventa senhas e não cria usuário padrão;
# - não lê, imprime nem reescreve valores de .env.local (só emite "ok"/"falhou");
# - aborta se DATABASE_URL não apontar para o PostgreSQL local;
# - exige exatamente um médico antes de semear o catálogo da agenda.
#
# Uso: npm run local:bootstrap   (ou: bash scripts/local-bootstrap.sh)
set -euo pipefail

cd "$(dirname "$0")/.."

step(){ printf '\n== %s ==\n' "$1"; }
fail(){ printf '\n[FALHOU] %s\n' "$1" >&2; exit 1; }

step "1/5 Verificando Docker e Compose"
command -v docker >/dev/null 2>&1 || fail "Docker não está instalado. Rode no seu terminal:
  sudo apt update
  sudo apt install -y docker.io docker-compose-v2
  sudo usermod -aG docker \"\$USER\"
Feche e reabra o terminal e execute este script novamente."
if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  fail "Plugin do Docker Compose não encontrado. Instale o pacote docker-compose-v2."
fi
docker info >/dev/null 2>&1 || fail "O Docker não está acessível para este usuário. Feche e reabra o terminal após o usermod ou execute: newgrp docker."

step "2/5 Verificando a configuração local (nenhum valor é exibido)"
node --env-file-if-exists=.env.local --input-type=module -e '
const raw=process.env.DATABASE_URL??"";
let local=false;
try{
  const url=new URL(raw);
  local=["127.0.0.1","localhost","::1","[::1]"].includes(url.hostname)&&(url.port===""||url.port==="5432");
}catch{}
const enabled=process.env.AUTH_ENABLED==="true";
let base=false;
try{base=new URL(process.env.BETTER_AUTH_URL??"").origin==="http://localhost:3000";}catch{}
const secret=(process.env.BETTER_AUTH_SECRET??"").length>=32;
const checks=[
  ["DATABASE_URL aponta para o PostgreSQL local",local],
  ["AUTH_ENABLED=true",enabled],
  ["BETTER_AUTH_URL=http://localhost:3000",base],
  ["BETTER_AUTH_SECRET com 32+ caracteres",secret],
];
for(const [label,pass] of checks)console.log(`${pass?"ok     ":"falhou "}- ${label}`);
if(!checks.every(([,pass])=>pass))process.exit(1);
' || fail "Ajuste o .env.local conforme docs/LOCAL_DEVELOPMENT.md. Nenhum comando de banco foi executado."

step "3/5 Iniciando o PostgreSQL local"
"${COMPOSE[@]}" -f compose.dev.yml up -d
status=""
for _ in $(seq 1 30); do
  status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' douglas-vaz-postgres 2>/dev/null || echo starting)
  [ "$status" = "healthy" ] && break
  sleep 2
done
[ "$status" = "healthy" ] || fail "O PostgreSQL local não ficou saudável (status: ${status:-desconhecido})."
"${COMPOSE[@]}" -f compose.dev.yml ps
printf 'PostgreSQL local saudável em 127.0.0.1:5432.\n'

step "4/5 Aplicando schema e conteúdo inicial"
npm run db:generate
npm run db:migrate:deploy
npm run db:inspect:schema
npm run db:seed:articles
npm run auth:check

step "5/5 Verificando identidades fictícias"
doctors=$(node --env-file-if-exists=.env.local --input-type=module -e '
import {PrismaClient} from "@prisma/client";
const db=new PrismaClient({log:[],errorFormat:"minimal"});
try{console.log(await db.doctor.count());}finally{await db.$disconnect();}
' | tail -1)
case "$doctors" in
  0)
    printf '\nNenhum médico provisionado. Rode no seu terminal (a senha é digitada sem eco):\n\n'
    printf '  npm run auth:provision -- --email medico@local.test --name "Médico Teste" --role DOCTOR --confirm PROVISIONAR\n'
    printf '  npm run db:seed:scheduling\n'
    printf '  npm run scheduling:check\n\n'
    printf 'Depois crie ADMIN, PATIENT e SECRETARY e siga docs/E2E_5A_ROLES.md.\n'
    ;;
  1)
    npm run db:seed:scheduling
    npm run scheduling:check
    printf '\nAmbiente pronto. Portas: npm run dev e abra http://localhost:3000/login.\n'
    printf 'Roteiro de aceite: docs/E2E_5A_ROLES.md\n'
    ;;
  *)
    fail "Existem $doctors médicos no banco. O catálogo da agenda exige exatamente um; ajuste o banco local antes de continuar."
    ;;
esac

# E2E da Fase 5A — papéis e negações

Atualizado em 25/10/2026, após a remoção do segundo fator. Não existe mais
`/verificar-acesso`, cadastro de autenticador, códigos de recuperação nem exigência de MFA:
o login usa apenas e-mail e senha provisionados em terminal confiável.

## Escopo

1. Testar os papéis `DOCTOR`, `SECRETARY`, `PATIENT` e `ADMIN`.
2. Confirmar que o login abre `/painel` sem etapa intermediária.
3. Conferir os módulos visíveis para cada papel.
4. Confirmar que páginas e APIs não autorizadas são negadas no servidor.

## Ambiente

Atalho (com Docker instalado e `.env.local` apontando para o banco local):

```bash
npm run local:bootstrap
npm run auth:provision -- --email medico@local.test --name "Médico Teste" --role DOCTOR --confirm PROVISIONAR
npm run db:seed:scheduling
npm run scheduling:check
npm run auth:provision -- --email admin@local.test --name "Administrador Local" --role ADMIN --confirm PROVISIONAR
npm run auth:provision -- --email paciente@local.test --name "Paciente Teste" --role PATIENT --confirm PROVISIONAR
npm run auth:provision -- --email secretaria@local.test --name "Secretaria Teste" --role SECRETARY --confirm PROVISIONAR
npm run dev   # ou npm start, após npm run build:next
```

O provisionamento exige terminal interativo e senha de 12 a 128 caracteres, digitada
duas vezes sem eco. Senhas de desenvolvimento ficam fora do Git.

## Destinos esperados

| Situação | Destino |
| --- | --- |
| Visitante em `/painel`, `/paciente`, `/admin`, `/medico/*`, `/conta` | `/login` |
| `/medico/agenda` para `PATIENT` ou `ADMIN` | `/conta` |
| `/medico/conteudos` para `PATIENT` ou `SECRETARY` | `/conta` |
| `/admin` para qualquer papel sem `settings.manage` | `/painel` |
| `/paciente` para `DOCTOR`, `SECRETARY` ou `ADMIN` | `/painel` |

## Roteiro por papel

### PATIENT (`paciente@local.test`)

Login → `/painel` com **Meu acompanhamento** e **Minha conta**.
`/paciente` mostra as seções da própria agenda (vazias se não houver consultas).
Negados: `/medico/agenda` → `/conta`; `/medico/conteudos` → `/conta`; `/admin` → `/painel`.
APIs: `GET /api/medico/agenda` e `GET /api/admin/articles` → `403`.

### DOCTOR (`medico@local.test`)

Login → `/painel` com **Agenda**, **Conteúdos** e **Minha conta**.
`/medico/agenda` e `/medico/conteudos` abrem; `GET /api/medico/agenda` → `200`.
Negados: `/admin` → `/painel`; `/paciente` → `/painel`.

### SECRETARY (`secretaria@local.test`)

Login → `/painel` com **Agenda** e **Minha conta**.
`/medico/agenda` opera a clínica única sem ações de disponibilidade.
Negados: `/medico/conteudos` → `/conta`; `/admin` → `/painel`; `/paciente` → `/painel`.
APIs: `GET /api/admin/articles` → `403`; `POST /api/medico/availability` → `403`.

### ADMIN (`admin@local.test`)

Login → `/painel` com **Administração**, **Conteúdos** e **Minha conta**.
`/admin` e `/medico/conteudos` abrem. Publicar continua exclusivo do médico:
`POST /api/admin/articles/[id]/transition` com `action: "PUBLISH"` → `403`.
Negados: `/medico/agenda` → `/conta`; `/paciente` → `/painel`; `GET /api/medico/agenda` → `403`.

## Verificações de API

```bash
curl -i http://localhost:3000/api/medico/agenda                   # 401 sem sessão
curl -i http://localhost:3000/api/admin/articles                  # 401 sem sessão
curl -i http://localhost:3000/api/account/sessions/revoke-others  # 401/405 sem sessão
```

Com sessão dos papéis fictícios: paciente em rota de equipe → `403`; secretaria em rota
editorial → `403`; admin em agenda → `403`; qualquer sessão sem origem canônica em mutação → `403`.

## Ciclo completo da agenda

O ciclo operacional deixou de ser manual: com o servidor local no ar
(`npm run build:next && npm start`, ou `npm run dev`) e as identidades fictícias
provisionadas, execute:

```bash
npm run e2e:scheduling
```

O script `scripts/e2e-scheduling.mjs` só aceita `localhost`, `127.0.0.1` ou `::1`,
exige `--confirm E2E` e lê as identidades de `.env.local.accounts` sem imprimir
e-mail, senha, nome, identificador ou horário de paciente. A saída é apenas o
resumo booleano do aceite.

| Verificação | O que confirma |
| --- | --- |
| `doctorLogin`, `workspaceLoaded`, `patientAvailable`, `ruleReady`, `slotOptions` | sessão do médico, agenda persistida, paciente fictício e horários livres |
| `appointmentCreated`, `createReplayIdempotent` | criação com `Idempotency-Key` e repetição segura da mesma chave |
| `slotHeldAfterCreate`, `createConflictRejected` | horário ocupado e recusa de sobreposição com `409` |
| `rescheduled`, `staleRescheduleRejected` | reagendamento com nova versão e recusa de versão obsoleta |
| `cancelled`, `cancelIsIdempotent`, `slotReleasedAfterCancel` | cancelamento, repetição idempotente sem novo evento e liberação do horário |
| `patientAgendaDenied`, `patientAvailabilityDenied` | paciente recebe `403` na agenda e na disponibilidade |
| `secretaryWorkspaceAllowed`, `secretaryAvailabilityDenied` | secretaria lê a clínica única e não altera disponibilidade |
| `ruleCleaned` | a regra criada pelo próprio aceite foi desativada ao final |

Depois da bateria, confirme as invariantes agregadas:

```bash
npm run scheduling:check
```

## Registro de execução

| Papel | Data | Login | Módulos conferidos | Negados conferidos | Observações |
| --- | --- | --- | --- | --- | --- |
| PATIENT | 25/10/2026 | ok | ok | ok | via automação HTTP e build local |
| DOCTOR | 25/10/2026 | ok | ok | ok | via automação HTTP e build local |
| SECRETARY | 25/10/2026 | ok | ok | ok | via automação HTTP e build local |
| ADMIN | 25/10/2026 | ok | ok | ok | conta entregue ao responsável |

### Ciclo da agenda

| Data | `npm run e2e:scheduling` | `npm run scheduling:check` | Observações |
| --- | --- | --- | --- |
| 25/10/2026 | 19/19 em duas rodadas consecutivas | `ready` | consulta criada, reagendada e cancelada; regra do aceite desativada; nenhum dado pessoal impresso |

## Próximos passos

Validar a troca de senha e a revogação das outras sessões com dois logins simultâneos na
mesma máquina local. Dados clínicos reais continuam bloqueados até as decisões de
privacidade e os controles operacionais estarem aprovados.


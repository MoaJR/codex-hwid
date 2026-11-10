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

## Segurança da conta (marco 4D)

Com o mesmo servidor local no ar:

```bash
npm run e2e:account
```

O script `scripts/e2e-account.mjs` usa somente a identidade `PATIENT` do arquivo de
identidades fictícias, abre dois acessos simultâneos e confirma:

| Verificação | O que confirma |
| --- | --- |
| `twoLogins`, `revokeOthersSucceeded`, `revokedSessionDenied`, `currentSessionPreserved` | dois acessos reais, revogação dos outros e preservação da sessão atual |
| `unauthenticatedRevokeRejected`, `originRequired` | `401` sem sessão e `403` sem origem canônica |
| `rawSessionEndpointDisabled`, `rawPasswordEndpointDisabled` | endpoints crus de sessão e senha do provedor continuam em `404` |
| `wrongCurrentPasswordRejected` | senha atual incorreta devolve `400 INVALID_CURRENT_PASSWORD` |
| `passwordChanged`, `oldPasswordRejected`, `newPasswordAccepted` | troca efetiva, senha antiga recusada e nova senha aceita |
| `passwordRestored`, `originalPasswordAccepted` | a senha original do arquivo de identidades volta a funcionar |

A troca de senha tem limite de 5 tentativas por 15 minutos. Por isso o script mantém o
marcador local `.e2e-account.lock` (ignorado pelo Git) e recusa uma segunda execução antes
de 16 minutos com `E2E_ACCOUNT_COOLDOWN`; apague o marcador somente se souber que a janela
já passou. Nenhuma senha é impressa; se a restauração falhar, o resumo traz
`manualAction: "ROTATE_LOCAL_PATIENT_PASSWORD"`.

## Registro de execução

| Papel | Data | Login | Módulos conferidos | Negados conferidos | Observações |
| --- | --- | --- | --- | --- | --- |
| PATIENT | 25/10/2026 | ok | ok | ok | via automação HTTP e build local |
| DOCTOR | 25/10/2026 | ok | ok | ok | via automação HTTP e build local |
| SECRETARY | 25/10/2026 | ok | ok | ok | via automação HTTP e build local |
| ADMIN | 25/10/2026 | ok | ok | ok | conta entregue ao responsável |
| PATIENT | 10/11/2026 | ok | ok | ok | Playwright autenticado no build de produção local; `/medico/agenda` termina em `/painel` |
| DOCTOR | 10/11/2026 | ok | ok | ok | Playwright autenticado; painel com Agenda e Conteúdos |
| ADMIN | 10/11/2026 | ok | ok | ok | Playwright autenticado; Administração visível, agenda negada sem papel `DOCTOR` |
| DOCTOR+ADMIN | 10/11/2026 | ok | ok | ok | titular com papéis acumulados na mesma conta: 4 módulos sem duplicata |

### Ciclo da agenda

| Data | `npm run e2e:scheduling` | `npm run scheduling:check` | Observações |
| --- | --- | --- | --- |
| 25/10/2026 | 19/19 em duas rodadas consecutivas | `ready` | consulta criada, reagendada e cancelada; regra do aceite desativada; nenhum dado pessoal impresso |
| 10/11/2026 | 19/19 | `ready` | servidor de produção local em `http://localhost:3000`, igual a `BETTER_AUTH_URL`; 8 consultas e 24 eventos/auditorias no check |

### Ciclo da solicitação do paciente (5B)

| Data | `npm run e2e:patient-booking` | Observações |
| --- | --- | --- |
| 10/11/2026 | **23/23 `ready`** | build de produção local em `http://localhost:3000`; regra semanal temporária criada e removida no mesmo ciclo; nenhum identificador, horário individual ou credencial impresso |

Roteiro do paciente na 5B:

1. `/paciente` abre com “Escolha um horário disponível”, seletor de atendimento e os dias com vaga real do catálogo.
2. “Enviar solicitação” cria `AppointmentRequest` em `PENDING`; a mensagem de sucesso só aparece depois da resposta do servidor.
3. “Solicitações enviadas” permite retirar a pendência com confirmação inline (estado `WITHDRAWN`).
4. Em `/medico/agenda`, a fila “Aguardando confirmação” mostra a pendência para DOCTOR/SECRETARY com “Aprovar” e “Recusar”; aprovar cria a consulta confirmada e recusar preserva o registro.
5. A consulta confirmada aparece em “Sua agenda” com “Cancelar consulta” (estado `CANCELLED`, histórico preservado).
6. Negados: paciente em `/medico/agenda` → `/painel`; `GET /api/medico/appointment-requests` → `403`; aprovar ou recusar pelo paciente → `403`.

O aceite cobre 401 sem sessão, 403 de origem, 400 com `patientId` no corpo, 404 de serviço desconhecido, 400 de horário passado, 201 idempotente, 409 de pendência duplicada, aprovação idempotente, cancelamento idempotente, 404 de recurso alheio e 429 de limite por usuário. Nenhum identificador, horário individual ou credencial é impresso.

Como existe no máximo uma pendência ativa por paciente, uma solicitação deixada por execução interrompida precisa ser retirada em `/paciente` ou recusada na fila da agenda antes de repetir o aceite; nesse caso o script reporta `failedStep: REQUEST_PENDING_ALREADY_EXISTS_MUST_WITHDRAW_OR_REJECT`. O spec de navegador retira pendências anteriores antes de começar, por isso a suíte é repetível.

### Registro da execução da 5B

| Data | Comando | Resultado |
| --- | --- | --- |
| 10/11/2026 | `npm run db:migrate:deploy` (PostgreSQL local `127.0.0.1:5432/douglas_vaz_dev`) | 6 migrations aplicadas; `20261110120000_add_appointment_request` registrada com checksum |
| 10/11/2026 | `npm run e2e:scheduling` | **19/19 `ready`** — regressão da 5A após o refactor do `store.ts` |
| 10/11/2026 | `npm run e2e:patient-booking` | **23/23 `ready`** |
| 10/11/2026 | `npm run e2e:frontend` | **66 passaram, 2 não aplicáveis, 0 falhas** (2,5 min, Chromium desktop e mobile) |
| 10/11/2026 | `npm run scheduling:check` | `ready` — 12 invariantes, 5 solicitações, 0 pendentes |
| 10/11/2026 | `npm run privacy:check` | `ready` — 5 solicitações, 2 aprovadas, 0 pendentes, nenhuma identidade impressa |

As duas não aplicáveis são regras exclusivas de viewport, como na 5A. O servidor de aceite rodou no build de produção local (`npm run start -- --port 3000`), na mesma origem de `BETTER_AUTH_URL`. `npm run e2e:account` não foi executado nesta rodada porque nenhuma rota de conta foi alterada e o marcador local de cota continua válido.

### Segurança da conta

| Data | `npm run e2e:account` | Observações |
| --- | --- | --- |
| 25/10/2026 | 14/14 | dois logins, revogação dos outros, senha atual errada recusada, troca e restauração da senha original; endpoints crus em `404` |
| 10/11/2026 | 14/14 | mesma bateria; a execução anterior havia falhado com `429` por limite de login compartilhado, não por credencial |

### Frontend no navegador (Playwright, Chromium)

| Data | Comando | Resultado | Observações |
| --- | --- | --- | --- |
| 10/11/2026 | `E2E_CONFIRM=E2E E2E_BASE_URL=http://localhost:3000 E2E_REUSE_SERVER=1 npm run e2e:frontend` | **62 passaram, 2 não aplicáveis, 0 falhas** (1,7 min) | 8 specs autenticadas ativas nos dois viewports; os 2 não aplicáveis são regras exclusivas de viewport |
| 10/11/2026 | `npm run privacy:check` | `ready` | agregados apenas; nenhum identificador, horário individual ou conteúdo |

### Correções que o aceite provocou

| Achado | Correção |
| --- | --- |
| `/medico/agenda` e `/medico/conteudos` devolviam à conta (`/conta`) quando faltava permissão, contrariando `docs/SECURITY.md` | guardas de agenda e editorial passam a devolver ao painel; teste fixa a regra |
| `e2e:scheduling` e `e2e:account` na mesma janela de 60s estouravam o limite de login e o aceite acusava falha falsa | aceite da conta observa o status, espera `Retry-After` e reporta `failedStep` com o status |
| 8 specs autenticadas faziam 8 logins em segundos | fixture enfileira os logins (5/min) e repete em `429` |

## Próximos passos

Aplicar a migration `20261110120000_add_appointment_request` no PostgreSQL local (com confirmação explícita) e executar `npm run e2e:patient-booking` e `npm run e2e:frontend` para registrar o aceite da 5B em `docs/PROGRESS.md`. Dados clínicos reais continuam bloqueados até a publicação do canal oficial do titular em `/privacidade`, e a retenção da nova tabela (D7) segue como proposta sem aprovação.


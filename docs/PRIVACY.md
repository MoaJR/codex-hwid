# Privacidade e operação de dados

**Situação: D1–D6 aprovadas em 10/11/2026; Fase 5B autorizada para implementação.** As decisões da seção 5 foram aprovadas pelo responsável (registro na seção 8 e em `docs/DECISIONS.md`) e as consequências técnicas já foram executadas: rotina de retenção (`npm run retention:apply`) e teste de restauração (`docs/BACKUP_RESTORE.md`). O uso com dado real de paciente continua condicionado à publicação do canal oficial do titular em `/privacidade`. Este documento não substitui parecer jurídico.

Atualizado em 25/10/2026. Fatos conferidos em `prisma/schema.prisma`, no código de `src/`, nos scripts de aceite e na configuração registrada em `docs/INTEGRATIONS.md`.

## 1. Escopo atual

- Público: home, páginas institucionais, blog e API pública somente leitura.
- Autenticado: `/painel`, `/paciente`, `/medico/agenda`, `/medico/conteudos`, `/admin` e `/conta`.
- Fase 5A: agenda operacional interna para médico e secretaria, com pacientes provisionados em terminal confiável.
- Fase 5B: o paciente autenticado solicita horário real do catálogo, retira a própria pendência e cancela o próprio atendimento; a confirmação depende da aprovação da equipe.
- Fora de escopo neste marco: cadastro público, reagendamento pelo paciente, prontuário, prescrições, mensagens clínicas, documentos, uploads, pagamentos e lembretes.

Não existe formulário público que receba dado pessoal. A única entrada de dado pessoal é o login de uma conta previamente provisionada.

## 2. Dados tratados hoje

| Categoria | Onde | Dados | Finalidade atual |
| --- | --- | --- | --- |
| Identidade | `User` | `id`, `email`, `name`, `emailVerified`, `image`, datas de criação/atualização, `twoFactorEnabled` (legado) | autenticar e identificar a conta |
| Credencial | `Account` | `providerId`, `accountId`, hash de senha do Better Auth, campos de token previstos pelo provedor (não usados no fluxo somente-senha) | login por e-mail e senha |
| Sessão | `Session` | `token`, `expiresAt`, `userId`, `ipAddress` e `userAgent` opcionais gravados pelo provedor, `mfaVerifiedAt` (legado) | manter o acesso autenticado |
| Limite de tentativas | `RateLimit` (provedor) e `ApiRateLimit` (aplicação) | chave `escopo:userId:janela`, contador e expiração | conter abuso e força bruta |
| Papéis e vínculos | `UserRole`, `Patient`, `Doctor`, `CareAssignment` | papel, `userId` do titular, fuso do médico, vínculo paciente–médico | autorização e escopo |
| Catálogo e disponibilidade | `AppointmentService`, `AvailabilityRule`, `AvailabilityException` | código, nome do serviço, modalidade, duração, intervalos, buffers, janelas semanais e exceções | calcular horários |
| Agenda | `Appointment`, `AppointmentEvent` | rótulo do serviço, modalidade, estado, horários em UTC, duração, buffers, fuso, versão, chave de idempotência, autoria de criação/edição/cancelamento e histórico de eventos | operar e auditar a consulta |
| Solicitação de agenda | `AppointmentRequest` | serviço e horário desejados, expiração, estado da decisão, versão, chave de idempotência, autoria do pedido e da decisão, vínculo com a consulta aprovada | receber o pedido do paciente e registrar a decisão da equipe |
| Auditoria de segurança | `AuditEvent` | ação, resultado, origem, ator, titular, tipo e UUID do recurso, data | rastrear operações sensíveis |
| Editorial | `Article`, `ArticleBlock` | conteúdo publicado, autoria, revisão e publicação | blog e CMS |

Observações verificadas:

- A agenda não guarda motivo da consulta, diagnóstico, observação clínica, anexo ou texto livre.
- `AuditEvent` não recebe nome, e-mail, IP, user-agent, corpo HTTP ou identificador de paciente em texto.
- `MoodEntry` existe no schema e não é usado por nenhuma rota ou tela.
- `TwoFactor` e `Session.mfaVerifiedAt` permanecem no schema sem uso desde a remoção do segundo fator em 25/10/2026; nenhuma migration destrutiva foi executada.
- `Verification` e `CareAssignment` não são usados pelo fluxo atual (não há signup, recuperação de senha ou atribuição de cuidado).
- Não são tratados: dados de saúde, documentos, arquivos, imagens de paciente, pagamentos, geolocalização, biometria ou dados de criança e adolescente.

## 3. Onde os dados ficam

- Aplicação: funções da Vercel no projeto `vaz` (equipe `moajrs-projects`), publicada em `drdouglasvaz.vercel.app`.
- Banco: Prisma Postgres `prisma-postgres-yellow-helmet`, região `iad1`, associado ao mesmo projeto em preview e produção.
- Consequência: dados de titulares no Brasil são processados em infraestrutura nos Estados Unidos. A avaliação e a documentação dessa transferência internacional fazem parte de D4.
- Nenhuma integração externa no código: não há e-mail transacional, analytics, tag manager, chat, mídia de terceiros, pagamento, storage de arquivos ou chamada a API externa. As chamadas de `fetch` do navegador apontam somente para rotas do próprio domínio, e as imagens são assets em `public/images`.
- Cookies: apenas a credencial de sessão do Better Auth, marcada como HTTPOnly, Secure e SameSite pelo provedor. Não existe cookie de rastreamento ou publicidade.
- Segredos: somente em variáveis de ambiente; `.env*` é ignorado pelo Git e pelo Cline e nunca é lido por scripts de diagnóstico.

## 4. Controles já implementados

- Autorização negada por padrão, resolvida no servidor a partir da sessão e do banco (`docs/SECURITY.md`, `docs/PERMISSIONS.md`).
- Titularidade: `/paciente` parte do `userId` autenticado e projeta somente rótulo do serviço, modalidade, estado, início, fim e fuso, sem identificador de paciente.
- Escopo da equipe: médico opera a própria agenda; secretaria opera a clínica única; administrador não recebe agenda, paciente ou prontuário por herança.
- Mutações exigem origem canônica exata, JSON estrito com limite de tamanho, campos conhecidos e limite de requisições por usuário.
- Auditoria transacional sem conteúdo clínico.
- Cabeçalhos de segurança em todas as rotas (CSP, bloqueio de frame e objeto, `nosniff`, política de referência, Permissions Policy).
- Credenciais nunca trafegam por argumento de linha de comando, chat ou repositório; o provisionamento exige terminal interativo.
- Não existe rotina de retenção, anonimização ou expurgo automatizado. Nada é apagado fisicamente hoje; cancelamentos preservam o registro e os eventos.
- `npm run privacy:check` (somente local) produz contagens agregadas, idade em dias inteiros do registro mais antigo por categoria e booleanos de consistência, para dimensionar D3, D5 e D6. Ela não imprime identidade, contato, token, identificador de recurso ou horário individual, recusa qualquer banco que não seja `localhost`, `127.0.0.1` ou `::1` e não faz parte do build de produção.

## 5. Decisões registradas

As seis decisões abaixo foram aprovadas pelo responsável em 10/11/2026 com os defaults descritos e registradas em `docs/DECISIONS.md`. O único item ainda aberto é o **canal oficial do titular** (D1), que não pode ser inventado e precisa ser publicado em `/privacidade` antes de qualquer dado real de paciente.

| ID | Decisão | Status |
| --- | --- | --- |
| D1 | Controlador, encarregado e canal do titular | aprovada em 10/11/2026 — canal do titular pendente |
| D2 | Bases legais por finalidade | aprovada em 10/11/2026 |
| D3 | Retenção e expurgo por categoria | aprovada em 10/11/2026 |
| D4 | Subprocessadores e transferência internacional | aprovada em 10/11/2026 |
| D5 | Backup, restauração e continuidade | aprovada em 10/11/2026 |
| D6 | Resposta a incidentes e comunicação | aprovada em 10/11/2026 |

### D1 — Controlador, encarregado e canal do titular

**Pergunta.** Quem é o controlador dos dados (pessoa física/profissional liberal ou pessoa jurídica da clínica, com CNPJ), quem exerce a função de encarregado e qual canal oficial atende pedidos de titular.
**Opções.** (a) controlador é o profissional, com encarregado indicado e canal próprio; (b) controlador é a clínica, com encarregado interno; (c) controladoria conjunta documentada.
**Impacto técnico.** O canal escolhido precisa ser publicado em `/privacidade` e `/contato`. Hoje ambas as páginas informam que os canais oficiais aguardam confirmação, o que impede atender pedidos de titular.

### D2 — Bases legais por finalidade

**Pergunta.** Qual base legal ampara cada finalidade: autenticação e conta, operação da agenda, auditoria de segurança, conteúdo editorial e cookies estritamente necessários.
**Opções.** Execução de contrato ou procedimentos preliminares; cumprimento de obrigação legal ou regulatória (relevante para registros de saúde futuros); legítimo interesse para segurança, mediante avaliação documentada; consentimento apenas onde não houver outra base adequada.
**Impacto técnico.** A base escolhida determina o texto de `/privacidade`, o que pode ser retido (D3) e se há necessidade de registro de consentimento. Hoje não existe mecanismo de consentimento no produto.

### D3 — Retenção e expurgo por categoria

**Pergunta.** Por quanto tempo cada categoria é mantida e com qual mecanismo de expurgo.
**Opções por categoria.** Sessões e limites de tentativas: expiração curta e limpeza oportunista já existente. Consultas e eventos de agenda: prazo definido pelo responsável, considerando a guarda de registros de assistência à saúde. Auditoria: prazo próprio de segurança. Editorial: histórico permanente ou versionado com poda. `MoodEntry`: excluir do escopo enquanto não houver módulo.
**Impacto técnico.** Nenhuma rotina de expurgo existe hoje. É necessário definir prazos, implementar rotina (script agendado ou tarefa operacional documentada), registrar evidência de execução e revisar as constraints `Restrict`, que impedem apagar registros referenciados. O comando local `npm run privacy:check` já entrega contagens por categoria e a idade do registro mais antigo, o que permite dimensionar prazos sem extrair dado pessoal.

### D4 — Subprocessadores e transferência internacional

**Pergunta.** Quais operadores são aceitos, com quais contratos, e como é documentada a transferência internacional para `iad1`.
**Opções.** Manter Vercel e Prisma Postgres como operadores, com lista publicada e DPA/cláusulas contratuais; migrar o banco para região no Brasil, se disponível e aprovada; restringir categorias enviadas ao exterior.
**Impacto técnico.** A região do banco é configuração de infraestrutura, não de código. A lista de subprocessadores precisa constar em `/privacidade` e ser revisada a cada nova integração.

### D5 — Backup, restauração e continuidade

**Pergunta.** Qual frequência de backup, retenção das cópias, criptografia, região, RPO, RTO e procedimento de restauração.
**Opções.** Backup gerenciado pelo provedor do banco com teste trimestral registrado; exportação lógica adicional com armazenamento privado; retenção curta para preview e produção separadas.
**Impacto técnico.** Não há rotina documentada nem teste de restauração registrado. A restauração precisa ser exercitada em ambiente descartável, nunca sobre o banco de produção.

### D6 — Resposta a incidentes e comunicação

**Pergunta.** Como classificar severidade, em quanto tempo avaliar, quem comunica titulares e a ANPD, e onde registrar o incidente.
**Opções.** Procedimento interno com prazos definidos; comunicação imediata ao responsável e, quando aplicável, aos titulares e à autoridade; registro em documento restrito com data, escopo e medidas.
**Impacto técnico.** A auditoria atual não detecta intrusão sozinha. É necessário definir alertas mínimos, responsáveis por plantão e um canal de contato que funcione fora do horário comercial.

### D7 — Retenção da solicitação de agenda (proposta, pendente de aprovação)

**Pergunta.** Por quanto tempo manter solicitações recusadas, retiradas e expiradas, e como preservar a que originou uma consulta?
**Proposta.** Manter por 5 anos após a decisão as solicitações recusadas, retiradas e expiradas, alinhadas à trilha de auditoria; a solicitação aprovada permanece vinculada à consulta, que segue a retenção de 20 anos. Pendências vencidas são apenas transicionadas para `EXPIRED`; nenhuma linha é apagada por `npm run retention:apply` nesta fase.
**Impacto técnico.** `scripts/apply-retention.mjs` contabiliza pendências expiradas e publica a política; a exclusão física exigiria aprovação explícita e procedimento próprio por causa das FKs `Restrict`.
**Status.** Proposta registrada em 10/11/2026 com a implementação da 5B; **sem aprovação** até decisão do responsável.

## 6. Critérios para liberar a Fase 5B

A Fase 5B (agendamento pelo paciente autenticado) está **autorizada para implementação** desde 10/11/2026. O uso com dado real de paciente exige todos os itens abaixo:

1. D1 a D6 aprovadas pelo responsável e registradas em `docs/DECISIONS.md`. **Cumprido em 10/11/2026.**
2. `/privacidade` publicando controlador, encarregado, canal do titular, finalidades, bases legais, retenção, operadores e direitos. **Pendente do canal oficial do titular** — os demais itens já estão aprovados. A descrição publicada da operação de solicitação de horário (pedido do catálogo, análise da equipe, retirada antes da decisão e cancelamento do próprio atendimento, sem reserva automática) foi atualizada em 10/11/2026, sem antecipar prazo ou retenção ainda não aprovados.
3. Retenção definida com pelo menos uma execução registrada, mesmo que manual. **Cumprido em 10/11/2026** (`npm run retention:apply`).
4. Teste de restauração documentado em ambiente descartável. **Cumprido em 10/11/2026** (`docs/BACKUP_RESTORE.md`).
5. Revisão confirmando que a 5B não coleta categoria nova além de identidade autenticada, serviço, modalidade e horário. **Cumprido em 10/11/2026:** a solicitação grava somente serviço, modalidade, horários, estado, versão, autoria e chave de idempotência — sem motivo, texto livre, anexo ou dado clínico. A nova tabela representa uma **operação de tratamento adicional** (pedido do paciente), registrada na seção 2 e sujeita à proposta D7 de retenção.
6. `npm test`, `npm run typecheck`, `npm run build:next` e os aceites `e2e:scheduling`/`e2e:account` aprovados no PostgreSQL local, com identidades fictícias. **Cumprido em 10/11/2026** (ver `docs/E2E_5A_ROLES.md`).

## 7. Proibições vigentes

- Não cadastrar pacientes, médicos, secretarias ou administradores com dados reais.
- Não usar dados de saúde reais, ainda que fornecidos espontaneamente, em nenhuma tela ou banco.
- Não abrir prontuário, prescrição, documento, upload, mensagem clínica ou pagamento antes dos controles correspondentes.
- Não conectar o Cline ao banco de produção nem ler `.env*`.
- Não anunciar endereço, CRM, RQE, preço ou contato que não tenham sido confirmados pelo responsável. A política aprovada em 10/11/2026 pode ser publicada; o canal do titular entra apenas quando o endereço oficial for informado.

## 8. Registro de aprovação

Preencher apenas com aprovação real. As linhas abaixo foram preenchidas em 10/11/2026 com a aprovação explícita do responsável; qualquer novo item aberto volta a exigir aprovação antes de operar com dado real.

| ID | Decisão | Aprovador | Data | Evidência |
| --- | --- | --- | --- | --- |
| D1 | Controlador, encarregado e canal do titular | Responsável | 10/11/2026 | pacote de defaults aprovado; canal do titular ainda não informado |
| D2 | Bases legais por finalidade | Responsável | 10/11/2026 | `docs/DECISIONS.md`, entrada de 2026-11-10 |
| D3 | Retenção e expurgo por categoria | Responsável | 10/11/2026 | `docs/DECISIONS.md`; primeira execução em `npm run retention:apply` |
| D4 | Subprocessadores e transferência internacional | Responsável | 10/11/2026 | `docs/DECISIONS.md`; lista a publicar em `/privacidade` |
| D5 | Backup, restauração e continuidade | Responsável | 10/11/2026 | `docs/BACKUP_RESTORE.md`, execução de 10/11/2026 |
| D6 | Resposta a incidentes e comunicação | Responsável | 10/11/2026 | `docs/DECISIONS.md`, entrada de 2026-11-10 |

Nenhuma linha desta tabela cobre D7: a proposta de retenção da solicitação de agenda (seção 5) foi registrada com a implementação da 5B e permanece **sem aprovação**. Não trate D7 como decidida até o responsável se manifestar por escrito.


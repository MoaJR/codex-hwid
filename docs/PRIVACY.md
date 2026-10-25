# Privacidade e operação de dados

**Situação: pendente de aprovação.** Este é um registro técnico do que a plataforma já trata e das decisões que ainda faltam. Ele não substitui parecer jurídico e não autoriza uso de dados pessoais ou de saúde reais. Enquanto as decisões da seção 5 não forem aprovadas pelo responsável, a Fase 5B permanece bloqueada e o ambiente deve operar somente com identidades fictícias.

Atualizado em 25/10/2026. Fatos conferidos em `prisma/schema.prisma`, no código de `src/`, nos scripts de aceite e na configuração registrada em `docs/INTEGRATIONS.md`.

## 1. Escopo atual

- Público: home, páginas institucionais, blog e API pública somente leitura.
- Autenticado: `/painel`, `/paciente`, `/medico/agenda`, `/medico/conteudos`, `/admin` e `/conta`.
- Fase 5A: agenda operacional interna para médico e secretaria, com pacientes provisionados em terminal confiável.
- Fora de escopo neste marco: cadastro público, agendamento pelo paciente, prontuário, prescrições, mensagens clínicas, documentos, uploads, pagamentos e lembretes.

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

## 5. Decisões pendentes

Nenhuma decisão abaixo foi tomada pelo agente. Cada linha precisa de aprovação explícita do responsável e registro em `docs/DECISIONS.md` antes de qualquer dado real.

| ID | Decisão | Status |
| --- | --- | --- |
| D1 | Controlador, encarregado e canal do titular | pendente |
| D2 | Bases legais por finalidade | pendente |
| D3 | Retenção e expurgo por categoria | pendente |
| D4 | Subprocessadores e transferência internacional | pendente |
| D5 | Backup, restauração e continuidade | pendente |
| D6 | Resposta a incidentes e comunicação | pendente |

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
**Impacto técnico.** Nenhuma rotina de expurgo existe hoje. É necessário definir prazos, implementar rotina (script agendado ou tarefa operacional documentada), registrar evidência de execução e revisar as constraints `Restrict`, que impedem apagar registros referenciados.

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

## 6. Critérios para liberar a Fase 5B

A Fase 5B (agendamento pelo paciente autenticado) só começa quando todos os itens abaixo forem verdadeiros:

1. D1 a D6 aprovadas pelo responsável e registradas em `docs/DECISIONS.md`.
2. `/privacidade` publicando controlador, encarregado, canal do titular, finalidades, bases legais, retenção, operadores e direitos.
3. Retenção definida com pelo menos uma execução registrada, mesmo que manual.
4. Teste de restauração documentado em ambiente descartável.
5. Revisão confirmando que a 5B não coleta categoria nova além de identidade autenticada, serviço, modalidade e horário.
6. `npm test`, `npm run typecheck`, `npm run build:next` e os aceites `e2e:scheduling`/`e2e:account` aprovados no PostgreSQL local, com identidades fictícias.

## 7. Proibições vigentes

- Não cadastrar pacientes, médicos, secretarias ou administradores com dados reais.
- Não usar dados de saúde reais, ainda que fornecidos espontaneamente, em nenhuma tela ou banco.
- Não abrir prontuário, prescrição, documento, upload, mensagem clínica ou pagamento antes dos controles correspondentes.
- Não conectar o Cline ao banco de produção nem ler `.env*`.
- Não anunciar política de privacidade aprovada, prazos, endereço, CRM, RQE ou contato que não tenham sido confirmados pelo responsável.

## 8. Registro de aprovação

Preencher apenas com aprovação real. Enquanto a linha estiver pendente, a decisão não existe para fins de operação.

| ID | Decisão | Aprovador | Data | Evidência |
| --- | --- | --- | --- | --- |
| D1 | Controlador, encarregado e canal do titular | pendente | pendente | pendente |
| D2 | Bases legais por finalidade | pendente | pendente | pendente |
| D3 | Retenção e expurgo por categoria | pendente | pendente | pendente |
| D4 | Subprocessadores e transferência internacional | pendente | pendente | pendente |
| D5 | Backup, restauração e continuidade | pendente | pendente | pendente |
| D6 | Resposta a incidentes e comunicação | pendente | pendente | pendente |


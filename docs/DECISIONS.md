# Decisões
## 2026-10-23 — Separar protótipo e aplicação operacional
Preservar index.html e servir cópia em public/demonstracao.html. Iniciar Next.js sem apresentar interfaces fictícias como login ou prontuário real.
## 2026-10-23 — Autorização negada por padrão
Política centralizada, contexto confiável e vínculo explícito para médico. Admin e secretaria não recebem acesso clínico por herança.
## 2026-10-23 — Banco somente planejado
Prisma/PostgreSQL conforme especificação, sem executar migration ou criar persistência local de dados sensíveis. Integrações e autenticação exigem implementação e verificação próprias.

## 2026-10-23 — Build público independente de geração de banco
npm run build compila Next.js; npm run typecheck verifica TypeScript; npm run db:generate gera Prisma explicitamente. A experiência pública não precisa de conexão ao banco ou do download do motor Prisma para renderizar. Antes de integrar endpoints de banco, geração, schema e migrations precisam ser validados separadamente. Não há bypass de checksums ou erros de tipo.

## 2026-10-23 — Primeiro fluxo de agendamento é demonstrativo
A interface não recebe identificação nem apresenta disponibilidade real. O objetivo é validar UX enquanto autenticação e agenda transacional são construídas. Estado somente em memória; nenhuma submissão externa.

## 2026-10-23 — Blog público antes do editor CMS
Fase 3 dividida em 3A e 3B. Leitura pública versionada no Git implementada primeiro. Escrita administrativa depende de identidade, autorização e banco; nenhum editor público ou endpoint de escrita será simulado como operacional.

## 2026-10-23 — Prisma Postgres confirmado por evidência visual
Screenshot identifica serviço provisionado, mas credenciais e conexão ainda não verificadas. Diagnósticos somente no terminal, sem valores de variáveis nem erros brutos do provedor. Não executar migrations em banco conectado automaticamente.

## 2026-10-23 — Better Auth e ativação explícita
Escolhida biblioteca pronta para login/sessões/TOTP, sem criptografia ou hashing próprios. Auth permanece desabilitada até conexão, schema e provisionamento confiável. Não há conta padrão nem signup público.

## 2026-10-23 — MFA vinculado à sessão
User.twoFactorEnabled não garante que uma sessão antiga tenha passado por MFA. Session.mfaVerifiedAt só é gravado após verificação TOTP bem-sucedida no servidor e é exigido pelo guard de staff. Sem confiar em campo enviado pelo cliente.

## 2026-10-23 — Regenerar Prisma no build a partir da fase 4
A autenticação usa tipos dos novos modelos. O build agora gera o cliente Prisma antes de compilar Next.js para evitar cliente cacheado de schema antigo. Isso substitui a decisão anterior de build público independente de codegen. A geração não conecta ao banco nem aplica migrations.

## 2026-10-23 — Migrações somente no build de produção
A migration inicial foi validada em PostgreSQL 17 descartável antes da publicação. `npm run build` executa `prisma migrate deploy` apenas quando `VERCEL_ENV=production`; builds locais e de preview geram o cliente e compilam sem alterar o banco compartilhado. A ativação de autenticação continua separada da criação do schema.

## 2026-10-23 — Reconciliar o baseline existente sem recriar tabelas
O Prisma Postgres já continha o schema completo e a migration concluída `20261023120000_init`. Uma migration inicial equivalente, publicada depois, parou antes da primeira etapa porque o enum já existia. Antes da recuperação, uma inspeção somente leitura confirmou as 11 tabelas, colunas, índices, constraints, enum e checksum esperados, além de `applied_steps_count = 0` na tentativa interrompida. A migration equivalente foi então marcada como aplicada com `prisma migrate resolve --applied`; o `prisma migrate deploy` seguinte confirmou ausência de pendências. A rotina de recuperação foi removida após o deploy e o fluxo normal executa `migrate deploy` e depois inspeciona o resultado somente em produção.

## 2026-10-23 — Provisionamento e MFA exigem auditoria persistente
O primeiro usuário é criado por comando interativo confiável usando o hash do Better Auth; signup público continua desativado. A sessão criada pelo bootstrap é revogada. Provisionamento, verificação TOTP e consumo de código de recuperação gravam eventos controlados em AuditEvent. As referências a usuários usam `SET NULL` para preservar a trilha após eventual exclusão da identidade.

## 2026-10-24 — Ativar identidade antes dos módulos clínicos
Após a confirmação do provisionamento da primeira conta em terminal confiável, AUTH_ENABLED foi habilitado somente em Produção para validar login, MFA, recuperação, expiração e revogação. Essa ativação não libera APIs clínicas, CMS ou portais; esses módulos continuam condicionados ao E2E de segurança.

## 2026-10-24 — Workflow editorial com revisão clínica explícita
Conteúdo persistente usa blocos de texto estruturados, sem HTML arbitrário, e controle otimista por versão. ADMIN pode preparar e enviar textos para revisão; somente DOCTOR com MFA publica ou retira conteúdo público. Arquivamento é reversível. A importação inicial cria apenas slugs ausentes para nunca sobrescrever edições do CMS.

## 2026-10-24 — Agenda interna antes do autoagendamento público
A Fase 5A opera somente para médico/secretaria com MFA e pacientes previamente provisionados. `/agendar` continua demonstrativo até identidade do paciente, aviso de privacidade, retenção, subprocessadores e confirmação de contato estarem definidos. Agenda própria do médico é um escopo administrativo separado do vínculo clínico e não libera prontuário.

## 2026-10-24 — PostgreSQL como garantia final de concorrência
Verificação de disponibilidade na aplicação melhora a resposta, mas não evita corrida entre instâncias. Consultas usam intervalos UTC, buffers calculados pelo servidor, lock transacional por médico e exclusion constraints GiST. Criação também exige chave de idempotência; cancelamento preserva histórico e libera o intervalo sem exclusão física.

## 2026-10-24 — Revogação de sessões por rota própria
O painel de conta encerra apenas outros acessos ativos e preserva a sessão que iniciou a operação. A equipe precisa de MFA nessa sessão. A resposta informa somente quantidade; tokens, IP e user-agent não são projetados. Exclusão e auditoria são atômicas, com rate limit compartilhado. Endpoints crus de sessão ficam desativados; recursos de conta são expostos somente por wrappers com autorização e auditoria próprias.

## 2026-10-25 — Troca de senha atômica pela aplicação
A aplicação recebe somente senha atual, nova senha e confirmação; usuário e sessão vêm do contexto autenticado. O hash e a verificação continuam a cargo do Better Auth. Lock por usuário, troca da credencial, revogação das outras sessões e auditoria formam uma única transação. A sessão atual permanece válida porque a operação exige a senha atual e MFA quando a conta usa 2FA. O endpoint cru do provedor continua desativado.

## 2026-10-25 — Retirar o protótipo e ativar portais por papel
As decisões de 23 e 24 de outubro preservaram uma demonstração enquanto identidade e agenda eram construídas. Com esses controles implementados, `index.html`, `/demonstracao.html` e o estado fictício de agendamento deixam de fazer parte do produto. `/agendar` passa a encaminhar ao painel protegido ou ao primeiro contato, sem coletar dados publicamente.

`/painel` é a entrada autenticada e apresenta a união dos módulos autorizados pelos papéis da sessão. O paciente recebe uma visão somente leitura das próprias consultas, filtrada pelo `userId` autenticado. O administrador recebe resumo editorial e configurações autorizadas, sem agenda, pacientes ou prontuário. Não haverá credencial administrativa padrão: `ADMIN` continua sendo provisionado interativamente em terminal confiável e exige MFA.

## 2026-10-25 — Remover o segundo fator do produto
Por decisão explícita do responsável, o 2FA foi removido do código: plugin `twoFactor` do Better Auth, `/verificar-acesso`, cadastro de autenticador em `/conta`, códigos de recuperação, `mfaVerifiedAt`, guardas de MFA e auditoria `MFA_*`. O login passa a usar apenas senha provisionada, sessão em banco e autorização por papel, que continuam obrigatórias e validadas no servidor. O schema não foi alterado: `TwoFactor` e `Session.mfaVerifiedAt` permanecem sem uso para evitar migration destrutiva em Produção; uma limpeza de schema pode ser planejada depois. Riscos aceitos: perda do segundo fator para contas administrativas, dependência exclusiva da senha e revisão da política de segurança antes de dados reais.

## 2026-10-25 — Segundo fator acontece antes da sessão
No segundo login de equipe o provider não cria sessão: devolve `twoFactorRedirect` e apenas o cookie temporário do segundo fator. Por isso `/verificar-acesso` precisa renderizar o formulário para visitante sem sessão e as páginas protegidas precisam reconhecer esse cookie para enviar a pessoa à verificação, nunca ao login — e nunca conceder acesso. O MFA da equipe continua obrigatório; nenhuma rota foi liberada sem o fator confirmado.

A bateria E2E dos quatro papéis depende de PostgreSQL local e sessão real. Para que a aceitação não fique apenas manual, os critérios viraram teste: módulos, rótulos, MFA obrigatório, permissões permitidas/negadas e titularidade ficam fixados em `tests/role-matrix.test.mjs`; o guarda e a permissão de cada página e API, a validação de origem das mutações e a correspondência entre card de `/painel` e página real ficam fixados em `tests/protected-route-guards.test.mjs`. Isso não substitui o E2E: ele continua obrigatório para senha, TOTP, cookie, redirecionamentos e auditoria em banco. A entrega também aceita que o ambiente de desenvolvimento pode não ter Docker; nesse caso o bloqueio deve ser documentado em vez de apontar o Cline para Produção.

## 2026-10-25 — Aceite da agenda automatizado, local e sem dados pessoais
O ciclo operacional da Fase 5A deixou de depender de digitação manual. `scripts/e2e-scheduling.mjs` (`npm run e2e:scheduling`) executa por HTTP, contra um servidor local, regra semanal, criação com `Idempotency-Key`, repetição idempotente, conflito de sobreposição, reagendamento, versão obsoleta, cancelamento, repetição do cancelamento, liberação do horário e as negações de paciente e secretaria.

Guardas permanentes: o script exige `--confirm E2E`, recusa qualquer host que não seja `localhost`, `127.0.0.1` ou `::1` (inclusive Produção) e recusa URL com caminho ou credenciais embutidas. As identidades fictícias vêm de `.env.local.accounts`, fora do Git, e a saída contém apenas booleanos — nunca e-mail, senha, nome, identificador de paciente ou horário individual. A regra criada pelo aceite é desativada no final e uma consulta que fique confirmada por falha é cancelada, para não deixar o banco local sujo.

O script respeita os limites do próprio servidor: espera a janela de mutações por minuto e, em `429` do login, aguarda `Retry-After` antes de tentar novamente. A automação nunca afrouxa o limite para passar.

O cancelamento é idempotente por decisão do store (repetir devolve `200` sem novo evento e sem nova versão). O aceite fixa esse comportamento como invariante; o produto não foi alterado para satisfazer o teste. O ciclo é complementar ao E2E de papéis: ele cobre a operação da agenda, não substitui o aceite de login e permissões descrito em `docs/E2E_5A_ROLES.md`.

## 2026-10-25 — Identidade visual navy e homepage modular
A cor principal deixa de ser verde e passa a ser azul navy (`#0a1f44`/`#07162b`), com azul de apoio (`#1d4ed8`/`#2f6fed`), fundo off-white azulado (`#f6f8fc`) e superfícies brancas. A troca ocorre nos tokens globais e nas cores fixas do design system; cores semânticas de sucesso, alerta, erro e status não foram alteradas para preservar leitura operacional.

A homepage deixa de ser uma sequência editorial clara e passa a ser modular: hero escuro com retrato e cards flutuantes, faixa de diferenciais, pilares de cuidado, áreas de acompanhamento, bloco do médico, timeline de atendimento, leituras do blog, FAQ e CTA final. A vitrine do blog usa somente artigos estáticos publicados, sem consulta ao banco na home. Nenhum dado profissional, valor, disponibilidade ou depoimento foi inventado; a apresentação do médico segue informando que formação e registros serão publicados após confirmação.

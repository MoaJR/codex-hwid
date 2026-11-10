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

## 2026-10-25 — Aceite da conta com senha rotacionada e reversível
`npm run e2e:account` executa o aceite do marco 4D em dois acessos simultâneos da identidade fictícia `PATIENT`: revogação dos outros acessos com preservação da sessão atual, `401` sem sessão, `403` sem origem canônica, `404` nos endpoints crus do provedor, senha atual errada recusada, troca efetiva, senha antiga rejeitada, nova senha aceita e restauração da senha original do arquivo de identidades.

A troca é deliberadamente reversível: a senha nova é gerada em memória, nunca é impressa e é restaurada ao final, para que `.env.local.accounts` continue válido. Como o servidor limita a troca a 5 tentativas por 15 minutos, o script mantém `.e2e-account.lock` (ignorado pelo Git) e recusa execuções dentro de 16 minutos com `E2E_ACCOUNT_COOLDOWN`. A alternativa — executar duas vezes na mesma janela — poderia consumir a cota no meio da troca e deixar a senha local alterada; por isso a espera é obrigatória, não uma conveniência.

Os dois aceites passaram a compartilhar `scripts/lib/local-e2e.mjs`, que concentra alvo local obrigatório, confirmação explícita, leitura das identidades fictícias, cliente HTTP com cookie jar, espera pela janela do provedor em `429` e resumo apenas booleano. Nenhum dos scripts escreve `.env*`, imprime credenciais ou aceita host externo.

## 2026-10-25 — Identidade visual navy e homepage modular
A cor principal deixa de ser verde e passa a ser azul navy (`#0a1f44`/`#07162b`), com azul de apoio (`#1d4ed8`/`#2f6fed`), fundo off-white azulado (`#f6f8fc`) e superfícies brancas. A troca ocorre nos tokens globais e nas cores fixas do design system; cores semânticas de sucesso, alerta, erro e status não foram alteradas para preservar leitura operacional.

A homepage deixa de ser uma sequência editorial clara e passa a ser modular: hero escuro com retrato e cards flutuantes, faixa de diferenciais, pilares de cuidado, áreas de acompanhamento, bloco do médico, timeline de atendimento, leituras do blog, FAQ e CTA final. A vitrine do blog usa somente artigos estáticos publicados, sem consulta ao banco na home. Nenhum dado profissional, valor, disponibilidade ou depoimento foi inventado; a apresentação do médico segue informando que formação e registros serão publicados após confirmação.
## 2026-10-25 — Privacidade registrada como pendência explícita, não como política
O projeto exigia definir controlador, bases legais, retenção, subprocessadores, backup/restore e resposta a incidentes antes da Fase 5B, mas nenhum documento separava o fato verificado no código da decisão que ainda pertence ao responsável. `docs/PRIVACY.md` passa a fazer essa separação: inventário de dados conferido em `prisma/schema.prisma` e em `src/`, localização da infraestrutura, controles já implementados e seis decisões (D1–D6) marcadas como pendentes, cada uma com pergunta, opções e impacto técnico.

O agente não escolheu controlador, base legal, prazo de retenção, operador, rotina de backup nem fluxo de incidentes. A tabela de aprovação só pode ser preenchida com decisão real; sem isso, a 5B continua bloqueada e o ambiente segue restrito a identidades fictícias.

Fatos que sustentam o registro: não há integração externa no código (sem e-mail transacional, analytics, chat, pagamento, storage ou mídia de terceiros); o site usa apenas o cookie de sessão do Better Auth; os dados ficam na Vercel e no Prisma Postgres em `iad1`, o que exige decisão sobre transferência internacional; `AuditEvent` não guarda conteúdo clínico, nome, e-mail, IP ou corpo HTTP; e não existe rotina de retenção, anonimização, expurgo ou teste de restauração — cancelamentos preservam o registro.

A página pública `/privacidade` afirmava “verificação em duas etapas” mesmo depois da remoção do segundo fator em 25/10/2026. O texto passou a descrever credencial protegida por hash, sessões de servidor, cookie único de sessão, ausência de rastreadores de publicidade e a pendência de aprovação da política. A correção é de exatidão informacional, não de produto.

`tests/privacy-record.test.mjs` é a guarda permanente: impede remover o registro, marcar decisão como aprovada sem linha de aprovação preenchida, gravar e-mail, senha, token ou URL de banco no documento, deixar de referenciá-lo em `CLINE_START.md` e `README.md`, ou reintroduzir na página pública um controle que não existe mais.

## 2026-10-25 — Inventário de privacidade somente agregado, local e fora do build
As decisões D3 (retenção), D5 (escopo de backup) e D6 (escopo de incidente) precisam de números, mas não de dado pessoal. `npm run privacy:check` (`scripts/check-privacy.mjs`) lê o banco em transação `RepeatableRead` com `SET TRANSACTION READ ONLY` e publica apenas contagens por categoria, idade em dias inteiros do registro mais antigo e booleanos de consistência.

A recusa acontece antes de criar o cliente Prisma: sem `DATABASE_URL` o comando responde `DATABASE_URL_MISSING`; com host diferente de `localhost`, `127.0.0.1` ou `::1` responde `DATABASE_URL_NOT_LOCAL`. Erros do provedor nunca são impressos, porque podem carregar host ou credencial. A saída não inclui identidade, contato, token, identificador de recurso nem horário individual — o mesmo critério já usado pelos checkers e aceites anteriores.

O comando fica fora do build de produção, ao contrário de `scheduling:check`. Os registros legados de `TwoFactor` e `Verification`, ainda presentes por causa da retirada do segundo fator sem migration destrutiva, são um fato a considerar na retenção e não uma falha de build. Transformá-los em check obrigatório bloquearia deploy por dado histórico esperado; mantê-los como contagem preserva a informação sem alterar o pipeline.

O inventário não decide retenção, backup ou resposta a incidentes. Ele apenas reduz a incerteza das seis decisões registradas em `docs/PRIVACY.md` e continua exigindo aprovação do responsável antes da Fase 5B.

## 2026-11-09 — Identidade visual do manual aplicada ao produto

O material `docs/identidade visual/Apresentação Identidade Visual Douglas Vaz.pdf` passa a ser a fonte da marca, substituindo a paleta navy escolhida em 25/10/2026. Valores exatos lidos nas pranchas do próprio material: azul profundo `#023859`, azul principal `#0367A6`, azul médio `#0379A6`, ciano `#049DBF` e cinza claro `#F2F2F2`. Os neutros de texto e borda do produto (`#0B1A31`, `#55657D`, `#DCE4F0`) foram mantidos para não abrir uma segunda paleta neutra, e as cores de status existentes foram preservadas em tokens (`success`, `warning-text`, `danger`, `info`, `neutral`) com pares conferidos em AA.

A implementação vive em `src/styles/tokens.css`, importada antes de `globals.css`; o `:root` legado passou a referenciar os tokens, de modo que as 260 classes existentes herdaram a marca sem renomeação. A serifa `Georgia` saiu de títulos e do wordmark porque não pertence à identidade; até a fonte oficial ser entregue, `--font-display` usa a pilha de sistema.

O símbolo vetorial e o nome da fonte **não foram recuperados**: a apresentação é um export de Figma com o texto convertido em contorno (Type3), sem `ToUnicode` utilizável. O lockup do header/rodapé passa a ser o wordmark tipográfico com o descritor `PSIQUIATRIA`, sem recriar o cérebro/balão de fala — recriar a geometria da marca seria inventar ativo. As pendências (fonte, SVG, HEX do rosa, área de proteção, uso da assinatura, direitos das fotos) estão registradas em `docs/DESIGN_SYSTEM.md`.

`tests/design-tokens.test.mjs` é a guarda permanente: valida a paleta exata, impede cor nova fora dos tokens, impede o retorno da paleta navy, exige piso de 12px, recusa token inexistente e alfa colado em `var()`, e recalcula os contrastes AA. Os 89 hex legados que ainda restam em `globals.css` (168 ocorrências) estão em `legacyAllowlist`, que só pode encolher.

O hero da home permanece escuro (azul profundo da marca) porque converter a home para superfície clara exige redesenho de contraste dos elementos flutuantes; a decisão fica registrada como pendência de direção visual, não como identidade aplicada.

O repositório `nextlevelbuilder/ui-ux-pro-max-skill` foi avaliado e **não foi adicionado** como dependência nem instalado como skill: é um conjunto de bases de recomendação genéricas (com `--design-system` próprio, que proporia paleta e fontes alheias à marca) e assume pilhas como Tailwind/shadcn, ausentes neste projeto. Usei apenas suas verificações como checklist manual — a origem dos itens de contraste, piso de 12px e alvo de 44px aplicados aqui. Nenhuma instalação `npm`/Python foi feita e nenhum arquivo da skill entrou no repositório.

## 2026-11-09 — Produto de instância única com papéis acumulados no titular

O produto não é SaaS nem multi-tenant: atende exclusivamente o Dr. Douglas Vaz, em uma clínica única, com um profissional. Isso deixou de ser contexto informal e passou a regra em `.clinerules/00-project-context.md` e `.clinerules/06-auth-rbac-and-audit.md`.

O titular é médico **e** administrador. A conta dele acumula `DOCTOR` e `ADMIN`, e `/painel` já renderiza a união sem duplicata porque `modulesForRoles` filtra definições por interseção de papéis. A acumulação é explícita — dois registros em `UserRole` — e **não cria herança**: ADMIN continua sem agenda, paciente ou prontuário; quando ele opera a agenda, é o papel DOCTOR que autoriza. Nenhuma regra do tipo “se for o dono, libere” foi criada.

Para viabilizar a mesma conta sem SQL manual, `scripts/provision-access.mjs` ganhou `--add-role <PAPEL>`: exige conta existente, é incompatível com `--role`/`--name`, não cria usuário nem pede senha, é idempotente quando o papel já existe, cria o perfil `Doctor`/`Patient` que faltar e grava `AuditEvent(action:'ROLE_GRANTED', source:'TRUSTED_CLI')` na mesma transação. Não houve migration: `AuditEvent.action` é `String`. Sessões não são revogadas porque os papéis são lidos por requisição em `src/server/auth/session.ts`. A saída continua apenas com agregados — nunca e-mail, nome ou identificador.

## 2026-11-09 — Playwright como padrão de teste de frontend

Todo fluxo de interface passa a ser aceito em navegador. `@playwright/test` foi adicionado como **devDependency** (não entra no bundle) com Chromium, e `playwright.config.ts` recusa qualquer `E2E_BASE_URL` que não seja loopback, espelhando a política dos aceites já existentes em `scripts/lib/local-e2e.mjs` — que também é reutilizado para ler as identidades fictícias e autenticar.

Os specs cobrem páginas públicas (status, `h1` único, ausência de erro de console, overflow em 360/768/1440), guardas de rota anônimas, união de papéis no `/painel` e os invariantes da identidade visual no navegador (cor primária computada, piso de 12px, alvo de 44px, foco visível). `test-results/`, `playwright-report/` e `blob-report/` ficam fora do Git. A instalação foi autorizada explicitamente pelo responsável em 09/11/2026.

## 2026-11-10 — Decisões de privacidade D1–D6 aprovadas

O responsável aprovou explicitamente, em 10/11/2026, os seis defaults propostos em `docs/PRIVACY.md`: D1 controlador é o profissional titular, encarregado é o próprio titular e o canal atende pedidos de titular; D2 conta/agenda por execução de contrato, auditoria por legítimo interesse documentado, cookies estritamente necessários e sem consentimento para saúde enquanto não houver módulo clínico; D3 expiração própria para artefatos efêmeros, 5 anos para auditoria, 20 anos para consultas e histórico editorial permanente; D4 manter Vercel e Prisma Postgres em `iad1` com DPA e lista publicada; D5 backup diário com retenção de 30 dias, RPO/RTO de 24h e teste trimestral; D6 avaliação em 24h, comunicação ao titular e à ANPD e registro restrito.

As consequências técnicas foram executadas junto da aprovação. `scripts/apply-retention.mjs` (`npm run retention:apply`) implementa D3 com dry-run por padrão, recusa de banco não local, confirmação explícita e saída apenas agregada; a primeira execução registrada removeu 15 sessões expiradas, 4 registros de verificação e 2 limites de API, sem tocar consulta ou auditoria — categorias com guarda histórica são apenas reportadas, porque as FKs `Restrict` exigem procedimento próprio. D5 está em `docs/BACKUP_RESTORE.md`, com dump, restauração em banco descartável e contagens idênticas entre origem e destino.

A regra da Fase 5B muda: a implementação fica autorizada, inclusive com dado fictício em desenvolvimento e testes. O uso com dado real de paciente continua condicionado à publicação do canal oficial do titular em `/privacidade` (critério 2 de `docs/PRIVACY.md` §6). O canal é o único item aberto em D1 e não foi inventado: será preenchido quando o responsável informar o endereço oficial. O gate deixa de ser "5B bloqueada" e passa a ser "5B autorizada, dado real condicionado ao canal publicado".


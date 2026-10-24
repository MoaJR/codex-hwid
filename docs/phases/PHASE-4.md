# Fase 4 — Autenticação e autorização

## Marco 4B concluído: primeiro acesso com MFA
Objetivo: preparar login, sessão e MFA sem expor acesso operacional antes da configuração confiável.
Stack: Better Auth 1.7.12, adaptador Prisma/PostgreSQL, plugin TOTP. Não implementar hash de senha, cookies ou OTP próprios. Cadastro público e vinculação automática de contas desativados; sem senha ou conta padrão.

## Arquivos e rotas
src/server/auth concentra configuração, provider lazy, sessão e guard. src/components/auth e /login, /verificar-acesso, /conta fornecem interface. /api/auth/[...all] atende somente GET/POST. Scripts auth:check e db:check são diagnósticos de terminal.

## Schema e migrations
User adiciona emailVerified, image, twoFactorEnabled e relações. Session, Account, Verification, RateLimit e TwoFactor sustentam o provedor. Session.mfaVerifiedAt identifica a sessão que concluiu MFA. AuditEvent registra ações de acesso controladas sem conteúdo clínico. UserRole e domínios anteriores foram preservados.
No fechamento da fase 4, o schema de 12 modelos passou por getDMMF/getConfig de @prisma/internals 6.19.3 via WASM. A migration inicial de 11 tabelas foi validada em PostgreSQL 17 descartável; a estrutura equivalente em produção foi confirmada e o histórico reconciliado. Uma migration incremental cria AuditEvent com índices por data/ator/alvo e referências `SET NULL`, preservando o evento se uma identidade vier a ser removida. Produção aplica migrations e inspeciona o resultado antes do build Next.js; preview e local não executam essas etapas.

## Controles
- AUTH_ENABLED precisa ser true e DATABASE_URL/BETTER_AUTH_SECRET/BETTER_AUTH_URL precisam passar pela validação antes de inicializar o provider.
- Secret mínimo de 32 caracteres, sem valor padrão; HTTPS em domínio real e origem explícita. HTTP só é aceito para loopback de desenvolvimento.
- Sessões em banco, sem cache de cookie; HTTPOnly, SameSite Lax e Secure no HTTPS.
- Rate limit persistido em banco e regras mais restritas para login e MFA. Rever/validar IP do proxy e concorrência em ambiente Vercel antes de ativação.
- Roles carregadas do banco a partir de sessão verificada; nunca de formulário/body.
- MFA staff exige marca da sessão específica gravada somente após sucesso de TOTP ou código de recuperação. Flag no usuário sozinha não autoriza.
- Ativação TOTP usa QR Code renderizado localmente; secret e códigos de recuperação não são enviados a serviços de imagem.
- Provisionamento usa Better Auth para hash de senha, exige confirmação explícita, lê a senha sem eco no terminal, revoga a sessão de bootstrap e grava auditoria na mesma transação dos papéis/perfil.
- Rejeitar trustDevice:true e evitar dispositivo confiável persistente nesta configuração.
- Erros externos genéricos, sem detalhes do banco ou segredos.
- Nenhuma API ou página clínica foi liberada nesta fase.

## Aceite deste marco
A base ampliada soma 40 testes; typecheck e build Next.js passam. O build Vercel gerou o cliente Prisma, aplicou a migration de auditoria e confirmou as 12 tabelas existentes no fechamento da fase. O responsável concluiu provisionamento, ativação TOTP e um segundo login com MFA; sessão anônima permanece sem cookie e runtime ficou sem erros. APIs clínicas continuam ausentes.

## Dependências para 4B/ativação
1. Concluído: integração Vercel autorizada para `moajrs-projects`.
2. Concluído: Prisma Postgres e nomes das variáveis confirmados sem expor valores.
3. Concluído: schema e migration confirmados em produção; builds de preview não alteram o banco.
4. Concluído: secret/base URL configurados somente em Produção e primeiro acesso provisionado pelo responsável em terminal confiável. Signup público continua bloqueado.
5. Concluído: onboarding TOTP, marca de sessão e segundo login com MFA. Recuperação por backup code permanece implementada e aguarda exercício operacional controlado.
6. Concluído para login/origem/MFA; permanecem pendentes rate limit entre instâncias, expiração/revogação e recuperação em rotina operacional.
7. AUTH_ENABLED habilitado somente em Produção. CMS 3B iniciado depois do E2E; módulos clínicos continuam bloqueados.

## Empacotamento
A partir deste marco, build gera o cliente Prisma antes de Next.js. Evita reutilizar cliente gerado de schema antigo no cache da plataforma. A geração não conecta ao banco; em produção, `migrate deploy` roda antes da inspeção pós-migration. A autenticação está ativa somente em Produção para o E2E controlado de login/MFA; APIs clínicas permanecem ausentes.

## Marco 4C — controle de sessões
`/conta` oferece encerramento de todos os outros acessos ativos sem listar dispositivos, tokens, IP ou user-agent. A sessão atual é preservada; equipe precisa concluir MFA na própria sessão. A rota da aplicação valida origem canônica, JSON vazio de até 1 KiB, aplica limite compartilhado de cinco tentativas por minuto e grava `OTHER_SESSIONS_REVOKED` na mesma transação da exclusão.

Os endpoints nativos de listagem e revogação de sessões do Better Auth foram desativados para não contornar a projeção e a auditoria. `/change-password` também permanece desativado até existir um fluxo próprio protegido. O aceite operacional deste marco exige dois logins: executar a ação em um, confirmar que ele continua válido e que o segundo perde acesso. Expiração e uso único do código de recuperação continuam no roteiro controlado.

O deployment `dpl_93G7PjBHTE2Yw3TDYZeiN2CrEMRJ` publicou o marco. Em smoke anônimo, conta protegida terminou no login, endpoints crus responderam 404, a rota própria recusou GET e não houve erro de runtime. O teste autenticado com dois logins continua como aceite manual.

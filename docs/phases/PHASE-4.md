# Fase 4 — Autenticação e autorização

## Marco 4A implementado: base protegida, ainda inativa
Objetivo: preparar login, sessão e MFA sem expor acesso operacional antes da configuração confiável.
Stack: Better Auth 1.7.12, adaptador Prisma/PostgreSQL, plugin TOTP. Não implementar hash de senha, cookies ou OTP próprios. Cadastro público e vinculação automática de contas desativados; sem senha ou conta padrão.

## Arquivos e rotas
src/server/auth concentra configuração, provider lazy, sessão e guard. src/components/auth e /login, /verificar-acesso, /conta fornecem interface. /api/auth/[...all] atende somente GET/POST. Scripts auth:check e db:check são diagnósticos de terminal.

## Schema e migrations
User adiciona emailVerified, image, twoFactorEnabled e relações. Session, Account, Verification, RateLimit e TwoFactor sustentam o provedor. Session.mfaVerifiedAt identifica a sessão que concluiu MFA. AuditEvent registra ações de acesso controladas sem conteúdo clínico. UserRole e domínios anteriores foram preservados.
O schema atual com 12 modelos passou por getDMMF/getConfig de @prisma/internals 6.19.3 via WASM. A migration inicial de 11 tabelas foi validada em PostgreSQL 17 descartável; a estrutura equivalente em produção foi confirmada e o histórico reconciliado. Uma migration incremental cria AuditEvent com índices por data/ator/alvo e referências `SET NULL`, preservando o evento se uma identidade vier a ser removida. Produção aplica migrations e inspeciona o resultado antes do build Next.js; preview e local não executam essas etapas.

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
31 testes passaram; typecheck e build Next.js passaram. Schema de 12 modelos parseado e validado em WASM. Smoke do modo inativo passou: 503 sem cookie em 4 endpoints, campos desabilitados no login e ausência de conteúdo privado. Geração nativa, migration incremental e inspeção pós-migration dependem do próximo build da Vercel.
Não considerar autenticação operacional apenas porque a UI compila.

## Dependências para 4B/ativação
1. Concluído: integração Vercel autorizada para `moajrs-projects`.
2. Concluído: Prisma Postgres e nomes das variáveis confirmados sem expor valores.
3. Concluído: schema e migration confirmados em produção; builds de preview não alteram o banco.
4. Em andamento: processo confiável de provisionamento implementado; falta configurar secret/base URL e executar o primeiro acesso. Signup público continua bloqueado.
5. Implementado: onboarding TOTP e recuperação por backup codes com marca de sessão e auditoria; falta E2E no ambiente implantado.
6. Testar login/sair, CSRF/origem, rate limit entre instâncias, expiração/revogação, isolamento e MFA com contas fictícias. Implementar auditoria antes de operações sensíveis.
7. Só depois habilitar AUTH_ENABLED e implementar CMS 3B/portais.

## Empacotamento
A partir deste marco, build gera o cliente Prisma antes de Next.js. Evita reutilizar cliente gerado de schema antigo no cache da plataforma. A geração não conecta ao banco; em produção, `migrate deploy` roda antes da inspeção pós-migration. A autenticação permanece inativa até provisionamento e E2E de login/MFA.

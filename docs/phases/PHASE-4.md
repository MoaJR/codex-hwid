# Fase 4 — Autenticação e autorização

## Marco 4A implementado: base protegida, ainda inativa
Objetivo: preparar login, sessão e MFA sem expor acesso operacional antes da configuração confiável.
Stack: Better Auth 1.7.12, adaptador Prisma/PostgreSQL, plugin TOTP. Não implementar hash de senha, cookies ou OTP próprios. Cadastro público e vinculação automática de contas desativados; sem senha ou conta padrão.

## Arquivos e rotas
src/server/auth concentra configuração, provider lazy, sessão e guard. src/components/auth e /login, /verificar-acesso, /conta fornecem interface. /api/auth/[...all] atende somente GET/POST. Scripts auth:check e db:check são diagnósticos de terminal.

## Schema proposto, sem migrations aplicadas
User adiciona emailVerified, image, twoFactorEnabled e relações. Novos Session, Account, Verification, RateLimit, TwoFactor. UUID consistente; RateLimit.lastRequest BigInt; Session.mfaVerifiedAt opcional. UserRole e domínios anteriores preservados.
Schema validado por getDMMF/getConfig de @prisma/internals 6.19.3 via WASM: 11 modelos válidos. Isso não substitui geração do cliente, migration e teste no banco real.

## Controles
- AUTH_ENABLED precisa ser true e DATABASE_URL/BETTER_AUTH_SECRET/BETTER_AUTH_URL precisam passar pela validação antes de inicializar o provider.
- Secret mínimo de 32 caracteres, sem valor padrão; HTTPS em domínio real e origem explícita. HTTP só é aceito para loopback de desenvolvimento.
- Sessões em banco, sem cache de cookie; HTTPOnly, SameSite Lax e Secure no HTTPS.
- Rate limit persistido em banco e regras mais restritas para login e MFA. Rever/validar IP do proxy e concorrência em ambiente Vercel antes de ativação.
- Roles carregadas do banco a partir de sessão verificada; nunca de formulário/body.
- MFA staff exige marca da sessão específica gravada somente após sucesso do endpoint TOTP. Flag no usuário sozinha não autoriza.
- Rejeitar trustDevice:true e evitar dispositivo confiável persistente nesta configuração.
- Erros externos genéricos, sem detalhes do banco ou segredos.
- Nenhuma API ou página clínica foi liberada nesta fase.

## Aceite deste marco
23 testes de unidade passaram; typecheck e build passaram. Schema parseado e validado em WASM. Smoke do modo inativo passou: 503 sem cookie em 4 endpoints, campos desabilitados no login e ausência de conteúdo privado.
Não considerar autenticação operacional apenas porque a UI compila.

## Dependências para 4B/ativação
1. Liberar a integração Vercel para a equipe moajrs-projects (403 identificado; a conexão da conta foi confirmada).
2. Confirmar variáveis e conexão Prisma Postgres, sem expor valores; gerar cliente Prisma.
3. Revisar e aplicar migration no ambiente correto após inspecionar estado e backup adequado; nenhuma migration automática no deploy.
4. Configurar secret/base URL e processo confiável para provisionar o primeiro acesso. Não ativar signup público para bootstrap.
5. Completar onboarding TOTP e recuperação por backup codes de forma auditada. Rotacionar/revogar sessões quando necessário.
6. Testar login/sair, CSRF/origem, rate limit entre instâncias, expiração/revogação, isolamento e MFA com contas fictícias. Implementar auditoria antes de operações sensíveis.
7. Só depois habilitar AUTH_ENABLED e implementar CMS 3B/portais.

## Empacotamento
A partir deste marco, build gera o cliente Prisma antes de Next.js. Evita reutilizar cliente gerado de schema antigo no cache da plataforma. Geração não conecta ao banco ou aplica migrations. Tipos do schema novo foram gerados via DMMF no ambiente local e typecheck passou; runtime e conexão continuam pendentes. Primeiro deploy4A falhou, sem logs acessíveis pelo escopo atual; não atribuir causa antes de observá-los.

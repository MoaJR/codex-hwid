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

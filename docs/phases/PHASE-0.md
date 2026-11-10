# Fase 0 — Base técnica

Objetivo: iniciar a aplicação operacional sem expor dados clínicos.
Escopo: Next.js App Router/React/TypeScript, tokens visuais, healthcheck, acesso Prisma no servidor, modelo inicial e política de autorização testável. Demonstração preservada em index.html e public/demonstracao.html.
Rotas novas: / e /api/health. Sem login ou endpoints clínicos nesta fase.
Modelos: User, UserRole, Patient, Doctor, CareAssignment, MoodEntry. Schema é proposta, sem migration aplicada. Exigir validação 1–10 e constraint SQL de score antes de criar API. UUID, integridade referencial Restrict e índice paciente/data. E-mails devem ser normalizados pelo serviço de identidade futuro.
Componentes: layout, página inicial e tokens CSS.
APIs: healthcheck sem informações de banco, segredos ou pacientes.
Riscos: autorização isolada não substitui autenticação; ator e propriedade devem vir da sessão verificada e queries servidor. Vínculos encerrados não entram no escopo autorizado. Secretaria recebe apenas dados cadastrais mínimos. ADMIN não recebe prontuário implicitamente.
Aceite: testes de autorização passando, documentação de limites, arquivos no GitHub. Instalação, typecheck, validação Prisma e build obrigatórios antes de considerar fase validada.

> **Nota de vigência (10/11/2026):** este documento é histórico. Para o produto atual, prevalecem `docs/PRODUCT_BASELINE.md`, `docs/DECISIONS.md`, `docs/UX_NAVIGATION.md` e `docs/VISUAL_IDENTITY.md`. Médico e administrador são a mesma pessoa e usam uma única Área profissional; o produto não é SaaS nem multi-tenant. Não use descrições antigas de perfis/painéis como instrução atual.

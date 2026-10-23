# Decisões
## 2026-10-23 — Separar protótipo e aplicação operacional
Preservar index.html e servir cópia em public/demonstracao.html. Iniciar Next.js sem apresentar interfaces fictícias como login ou prontuário real.
## 2026-10-23 — Autorização negada por padrão
Política centralizada, contexto confiável e vínculo explícito para médico. Admin e secretaria não recebem acesso clínico por herança.
## 2026-10-23 — Banco somente planejado
Prisma/PostgreSQL conforme especificação, sem executar migration ou criar persistência local de dados sensíveis. Integrações e autenticação exigem implementação e verificação próprias.

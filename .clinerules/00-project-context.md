# Projeto — contexto obrigatório

Você está trabalhando no projeto do Dr. Douglas Vaz, uma aplicação web de saúde com site público, autenticação, portais por papel, CMS editorial e agenda operacional interna.

## Modelo de produto: instância única, não SaaS
- Este produto é a plataforma de **uma única pessoa**: Dr. Douglas Vaz. **Não é SaaS, não é multi-tenant** e não atende outras clínicas, consultórios ou profissionais.
- O Dr. Douglas Vaz é o **médico titular e o administrador** da plataforma. A **mesma conta acumula `DOCTOR` e `ADMIN`**; o `/painel` mostra a união dos módulos (Agenda, Conteúdos, Administração, Minha conta) **sem duplicar cartões**.
- Acumular papéis **não cria herança**: cada papel concede apenas o que está em `docs/PERMISSIONS.md`. O acesso à agenda vem do papel `DOCTOR` gravado em `UserRole`, nunca da condição de ADMIN.
- **Não implementar**: onboarding de clínicas, múltiplos profissionais por conta, white-label, planos, assinatura, billing, painel de tenant, convites públicos, compartilhamento entre clínicas ou auto-serviço de permissões.
- Escopo novo (outro médico, secretaria de outra clínica, múltiplas unidades, outra instância) exige decisão formal em `docs/DECISIONS.md`, atualização de `docs/PERMISSIONS.md` e migration própria — nunca é consequência de uma tarefa de UI.

## Fonte da verdade
Antes de alterar qualquer comportamento, leia os documentos relevantes:
- `docs/ARCHITECTURE.md`: limites entre camadas e fluxo de dados.
- `docs/DATABASE.md`: schema, integridade e migrations.
- `docs/DECISIONS.md`: decisões históricas e vigentes; prevalece sobre documentação de fases antiga.
- `docs/ROUTES.md`: rotas existentes e limites.
- `docs/PERMISSIONS.md`: matriz RBAC.
- `docs/SECURITY.md` e `docs/PRIVACY.md`: segurança, privacidade e bloqueios operacionais.
- `docs/INTEGRATIONS.md`: integrações verificadas.
- `docs/LOCAL_DEVELOPMENT.md`: ambiente e comandos seguros.
- `docs/PROGRESS.md`: estado real mais recente.
- `docs/phases/*`: histórico de escopo, não autorização para reativar funcionalidades removidas.

Se houver conflito, siga nesta ordem: decisão mais recente em `DECISIONS.md` → documentação de segurança/privacidade → arquitetura/schema/permissões → progresso → documentos históricos de fase → código legado. Não “corrija” divergências silenciosamente: explique e proponha atualização documental.

## Estado e escopo atual
- Next.js App Router, React e TypeScript; monólito modular.
- Prisma + PostgreSQL; Better Auth; deploy na Vercel.
- Áreas autenticadas vivem sob `/painel/*` em um dashboard de menu lateral único (`src/app/painel/layout.tsx`); `/admin`, `/conta`, `/paciente` e `/medico/*` respondem 308 para o equivalente em `/painel/*` (`next.config.mjs`).
- Produto atual: site público, identidade e sessão, `/painel`, portal do paciente (leitura da própria agenda, solicitação de horário do catálogo com aprovação da equipe e cancelamento do próprio atendimento), portal médico/secretaria para agenda, CMS editorial e área administrativa editorial.
- Agenda operacional 5A é interna e controlada. `/agendar` não é agendamento público real.
- Não implementar prontuário, prescrições, mensagens clínicas, documentos, uploads, pagamentos, lembretes ou autoagendamento 5B sem autorização formal e controles prévios.
- Somente identidades e dados inteiramente fictícios em desenvolvimento, testes, screenshots e demonstrações.
- D1–D6 foram aprovadas em 10/11/2026 (`docs/PRIVACY.md` §8 e `docs/DECISIONS.md`). A Fase 5B está autorizada para implementação, inclusive com dado fictício. Dado real de paciente continua condicionado à publicação do canal oficial do titular em `/privacidade`. Nunca relaxe retenção, auditoria ou autorização para viabilizar a 5B.

## Princípios de execução
1. Investigue o código existente antes de editar; preserve padrões e APIs já estabelecidos.
2. Faça mudanças pequenas, coerentes, testáveis e reversíveis.
3. Não reescreva módulos inteiros por preferência estética.
4. Não invente dados profissionais, credenciais, depoimentos, disponibilidade, preços, endereço, contatos ou fatos clínicos.
5. Não faça deploy, push, migration em produção, provisionamento ou alteração de configuração remota sem pedido e confirmação explícitos.
6. Não declare uma tarefa concluída sem executar os checks aplicáveis e informar os que não puderam ser executados.
7. Ao final, resuma arquivos, decisões, riscos e validações.

# CLINE_START.md — instruções de entrada para o agente

Leia este arquivo antes de qualquer tarefa. As regras completas estão em `.clinerules/`.

## Ordem de leitura
1. `.clinerules/00-project-context.md`
2. `.clinerules/13-automation-agent-safety.md`
3. Regras específicas para a tarefa (arquitetura, UI, mobile, acessibilidade, segurança, RBAC, banco, APIs, testes).
4. Documentos `docs/` indicados no contexto do projeto.

## Regras críticas resumidas
- Não ler `.env*`, não acessar banco de Produção e não usar dados reais.
- Não implementar prontuário, prescrições, mensagens clínicas, documentos, uploads, pagamentos, lembretes ou autoagendamento 5B sem aprovação e controles.
- D1–D6 de privacidade estão pendentes; não alterar status nem liberar Fase 5B.
- O TOTP/2FA foi removido em 25/10/2026; documentos históricos da Fase 4 não autorizam reintroduzi-lo.
- Autorização negada por padrão; papéis e titularidade vêm do servidor.
- UI mobile-first, WCAG 2.2 AA como alvo, tokens globais e suporte aos temas existentes.
- Não fazer deploy, push, commit, migrations ou mudanças remotas sem confirmação.
- Rodar `npm test`, `npm run typecheck` e `npm run build:next` quando aplicável.
- Ao terminar, relatar alterações, testes reais, limitações e decisões pendentes.

## Documentos essenciais
`docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/DECISIONS.md`, `docs/PERMISSIONS.md`, `docs/ROUTES.md`, `docs/SECURITY.md`, `docs/PRIVACY.md`, `docs/INTEGRATIONS.md`, `docs/LOCAL_DEVELOPMENT.md`, `docs/PROGRESS.md`.

Estas regras foram elaboradas a partir do pacote de documentação fornecido em 09/11/2026. Reavalie o estado do código antes de assumir que qualquer descrição histórica continua atual.

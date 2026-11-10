# Documentação, continuidade e controle de mudanças

- **Leia `docs/CLINE_NEXT.md` no início de toda sessão.**
- Atualize o código e a documentação afetada na mesma tarefa: `ROUTES.md`, `PERMISSIONS.md`, `DATABASE.md`, `SECURITY.md`, `PRIVACY.md`, `ARCHITECTURE.md`, `INTEGRATIONS.md`, `DECISIONS.md`, `UX_NAVIGATION.md`, `VISUAL_IDENTITY.md` e/ou `PROGRESS.md`.
- Ao alterar interface global, confira consistência com identidade visual e documente tokens/componentes.
- Ao introduzir rota, atualize `ROUTES.md` e autorização.
- Ao alterar permissões, atualize `PERMISSIONS.md` e testes positivos/negativos.
- Ao mudar schema, atualize `DATABASE.md`, migration e testes.
- `DECISIONS.md` registra decisões reais com data, contexto, escolha e consequências; não transforme hipótese em decisão aprovada.
- Documentos de fase são históricos e não devem sobrepor decisões atuais. Preserve histórico com notas de supersessão.
- Não registre segredos, credenciais ou dados pessoais/clínicos reais.
- Ao final de cada tarefa, atualize obrigatoriamente `docs/CLINE_NEXT.md`: registro da sessão, estado real e próximo passo específico para o próximo chat. Atualize também `docs/PROGRESS.md`.

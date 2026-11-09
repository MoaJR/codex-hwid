# Documentação e controle de mudanças

- Atualize documentação afetada junto com o código: `ROUTES.md`, `PERMISSIONS.md`, `DATABASE.md`, `SECURITY.md`, `PRIVACY.md`, `ARCHITECTURE.md`, `INTEGRATIONS.md`, `DECISIONS.md` e/ou `PROGRESS.md`.
- `DECISIONS.md` registra decisões reais, com data, contexto, escolha e consequências. Não registre hipótese como decisão aprovada.
- Nunca altere a tabela de aprovação D1–D6 nem marque decisão como aprovada sem confirmação explícita do responsável.
- Documentos de fase são históricos; corrija referências obsoletas quando forem perigosas, mas preserve histórico com nota datada.
- Não registre segredos, dados pessoais, URLs de banco, e-mails reais ou credenciais em docs, testes, fixtures ou screenshots.
- Ao introduzir uma rota, atualizar `ROUTES.md` e revisar exposição pública/autorização.
- Ao mudar papel/permissão, atualizar `PERMISSIONS.md` e testes positivos e negativos por papel.
- Ao mudar schema, atualizar `DATABASE.md`, migration e testes correspondentes.
- Ao adicionar integração, atualizar `INTEGRATIONS.md`, `PRIVACY.md` e threat model aplicável.
- Ao alterar tokens/componentes globais, documentar tokens e verificar telas existentes para regressões.

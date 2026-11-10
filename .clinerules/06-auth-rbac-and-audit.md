# Autenticação, autorização e auditoria

- Better Auth é a autoridade para autenticação, sessão e hashing. Não implemente criptografia ou tokens próprios.
- Resolva sessão e permissões no servidor em cada operação protegida. Nunca aceite `userId`, papel, titular ou ator enviado pelo browser como autoridade.
- Negação por padrão; validar autorização também nas APIs e mutations, não apenas ocultar links.
- O produto é de instância única. Dr. Douglas Vaz é o médico e administrador do sistema na mesma conta. A interface deve apresentar uma única Área profissional e unir as permissões efetivamente concedidas sem duplicar módulos ou oferecer alternância Médico/Admin.
- Se o modelo técnico atual mantiver papéis `DOCTOR` e `ADMIN`, trate-os como permissões acumuladas do mesmo titular, não como pessoas ou workspaces separados. Não conceda permissões por nome, e-mail ou condição de “dono”; use os grants persistidos e a sessão confiável.
- Não criar múltiplas clínicas, médicos, tenants, workspaces ou onboarding SaaS.
- Secretaria/equipe, se existente, mantém somente permissões explícitas e limitadas descritas em `docs/PERMISSIONS.md`.
- Paciente só acessa dados próprios. Derive titularidade da sessão e vínculo confiável no servidor; nunca aceite `patientId` do cliente para escolher o titular.
- Não exponha tokens, hashes, sessões cruas, IP, user-agent ou payloads sensíveis.
- Registre operações sensíveis com auditoria mínima e sem duplicar dados pessoais/clínicos.
- Mudanças de autenticação, papéis, escopo ou auditoria devem atualizar matriz, testes positivos e negativos e documentação.

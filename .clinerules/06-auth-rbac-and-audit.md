# Autenticação, autorização RBAC e auditoria

## Better Auth
- Better Auth é a autoridade para autenticação, sessão e hashing de credenciais.
- Não implemente hash, verificação de senha, cookies ou tokens próprios.
- Não habilite signup público, account linking ou contas/senhas padrão.
- AUTH_ENABLED permanece sujeito ao gate e ao provisionamento documentados.
- O estado vigente retirou TOTP/2FA do produto em 25/10/2026. Não reintroduza MFA/TOTP com base em documentos históricos da Fase 4. `TwoFactor` e `Session.mfaVerifiedAt` são legado no schema.
- Não exponha endpoints crus do provider que foram deliberadamente desativados; use wrappers da aplicação com autorização, validação e auditoria.

## Identidade e sessão
- Nunca aceite `userId`, `role`, `sessionId`, ator ou titular enviados pelo browser como fonte de autoridade.
- Resolva a sessão verificada no servidor em cada operação protegida.
- Revogação de sessões permite encerrar apenas outras sessões do próprio usuário e preserva a sessão atual.
- Troca de senha exige senha atual e usa APIs oficiais do Better Auth; respeite contrato, lock, limite e transação existentes.
- Não exponha tokens, lista crua de sessões, IP ou user-agent.

## Matriz de papéis
A matriz completa está em `docs/PERMISSIONS.md`; mantenha-a como contrato:
- PATIENT: somente a própria agenda e segurança da própria conta; sem mutações de agenda.
- DOCTOR: própria agenda, CMS e segurança da própria conta.
- SECRETARY: agenda da clínica única e operações mínimas permitidas; sem conteúdo clínico.
- ADMIN: administração editorial/configurações explicitamente permitidas; não herda agenda, paciente ou prontuário.
- Ausência de permissão significa negação.
- Usuários com múltiplos papéis recebem união somente das permissões explicitamente concedidas, sem duplicar módulos.
- Um card/link no painel nunca substitui o guard server-side da rota.

## Titular com dois papéis (produto de instância única)
- Neste produto o Dr. Douglas Vaz acumula `DOCTOR` e `ADMIN` **na mesma conta**. A união de permissões é explícita porque os dois papéis existem em `UserRole`.
- Proibido criar regra especial do tipo “se for o dono, libere”: a autorização continua vindo dos papéis gravados no banco, por requisição (`src/server/auth/session.ts`).
- `ADMIN` continua **sem agenda por herança**. Quando o titular abre a agenda, quem autoriza é o papel `DOCTOR`.
- Acumular papéis **não** transforma o produto em multi-tenant: o escopo segue sendo clínica única e um profissional.
- Papéis são concedidos por comando confiável (`npm run auth:provision -- --add-role`), nunca por painel de auto-serviço, seed com senha padrão ou SQL manual.

## Escopo por titular
- Portal `/paciente` deriva o titular do usuário autenticado e filtra no servidor pelo vínculo `Patient.userId`.
- Não aceitar `patientId` ou identificador equivalente da URL/body para escolher o titular.
- Médico opera somente sua própria agenda.
- Secretaria opera somente no escopo da clínica única e a resolução deve falhar se a cardinalidade esperada não for exatamente uma.
- ADMIN não recebe acesso a agenda por conveniência ou herança.

## Auditoria
- Operações sensíveis devem registrar ação, resultado, origem e referências técnicas mínimas permitidas.
- Auditoria deve ser atômica com a mutação quando o domínio exigir.
- Não duplicar conteúdo editorial, dados pessoais, payload, credenciais ou conteúdo clínico.
- Não remover ou relaxar auditoria para facilitar testes.

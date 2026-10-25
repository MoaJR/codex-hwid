# Continuação do projeto com Cline

Este repositório **não começa do zero**. Preserve o que já está publicado e continue a partir do estado atual.

## Leitura obrigatória antes de editar

1. `README.md`
2. `docs/PROGRESS.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATABASE.md`
5. `docs/SECURITY.md`
6. `docs/PERMISSIONS.md`
7. `docs/ROUTES.md`
8. `docs/DECISIONS.md`
9. `docs/LOCAL_DEVELOPMENT.md`

Antes de propor código, execute `git status`, leia a implementação relacionada e informe: fase atual, objetivo pequeno da entrega, arquivos previstos e critérios de aceite.

## Estado atual

- Produção: https://drdouglasvaz.vercel.app
- Stack: Next.js 16, React 19, TypeScript, Prisma/PostgreSQL e Better Auth com TOTP.
- Fases 0 a 4 concluídas; Fase 5A publicada e aguardando a bateria operacional autenticada completa.
- O schema possui 20 modelos e sete enums.
- A suíte possui 99 testes; typecheck e build estão aprovados.
- O ciclo completo da agenda é aceito por automação local: `npm run e2e:scheduling` (19 verificações, sem imprimir dados pessoais) e `npm run scheduling:check`.
- `main` publica automaticamente na Vercel.
- O protótipo estático e o agendamento fictício foram removidos.
- A bateria E2E autenticada dos quatro papéis está roteirizada em `docs/E2E_5A_ROLES.md` e
  permanece bloqueada onde não houver PostgreSQL local.

### Áreas existentes

- `/painel`: entrada autenticada e módulos por papel.
- `/paciente`: consultas do próprio paciente, somente leitura.
- `/medico/agenda`: agenda persistente para médico e secretaria.
- `/medico/conteudos`: CMS para médico e administrador.
- `/admin`: administração editorial inicial, sem acesso clínico.
- `/conta`: troca de senha e controle de sessões.

## Regras obrigatórias

- Nunca leia, imprima, edite ou peça o conteúdo de `.env.local`.
- Use somente PostgreSQL local e identidades fictícias durante o desenvolvimento.
- Não conecte o Cline ao banco de Produção.
- Se faltarem dependências no Windows, execute `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1 -InstallMissing`; respeite pedidos visíveis de administrador/reinício e não improvise outro banco.
- Nunca invente CRM, RQE, biografia, preços, endereço ou contatos do médico.
- Preserve autorização negada por padrão e validação no servidor.
- Identidade, papel e titularidade vêm da sessão e do banco, nunca do cliente.
- Paciente acessa somente recursos ligados ao próprio `userId`.
- Administrador não recebe agenda, paciente ou prontuário por herança.
- Médico e secretaria mantêm o escopo atual da agenda; o segundo fator foi removido em 25/10/2026 (ver `docs/DECISIONS.md`) e o acesso da equipe depende de senha, sessão e autorização por papel.
- Não crie usuário ou senha padrão.
- Não abra prontuário, upload ou dados clínicos reais antes dos controles de privacidade correspondentes.
- Preserve o histórico de migrations e decisões; nunca reescreva uma migration aplicada.
- Não faça commit, push, deploy ou alteração destrutiva sem explicar o resultado ao responsável.

## Rotina de cada entrega

1. Trabalhe em uma mudança pequena e verificável.
2. Implemente estados de carregamento, vazio, erro e permissão quando aplicáveis.
3. Rode `npm test`.
4. Rode `npm run typecheck`.
5. Rode `npm run build:next`.
6. Para mudanças de banco, valide a migration em PostgreSQL 17 local e rode os checks relacionados.
7. Atualize `docs/PROGRESS.md` e registre decisões relevantes em `docs/DECISIONS.md`.
8. Informe o que mudou, como foi validado, limitações e próximo passo.

## Próximos passos, nesta ordem

1. Validar a troca de senha e a revogação das outras sessões com dois logins simultâneos na mesma máquina local; o roteiro está em `docs/E2E_5A_ROLES.md`.
2. Documentar e aprovar controlador, bases legais, retenção, subprocessadores, backup/restore e resposta a incidentes.
3. Planejar a Fase 5B de agendamento para paciente autenticado, sem cadastro anônimo ou pagamento neste primeiro recorte.
4. Depois da 5B, planejar a Fase 6 do portal do paciente. O painel atual é a fundação; não criar cards falsos para módulos ainda ausentes.
5. A administração completa de usuários/permissões permanece uma evolução auditada; o `/admin` atual é deliberadamente limitado ao domínio editorial.

Já cobertos e não precisam ser repetidos manualmente: a bateria por papel (`docs/E2E_5A_ROLES.md`) e o ciclo completo da agenda (`npm run e2e:scheduling` + `npm run scheduling:check`), ambos executados em 25/10/2026 no PostgreSQL local.


## Primeiro pedido para o Cline

```text
Leia CLINE_START.md e todos os documentos obrigatórios antes de editar. Resuma o estado atual, confirme que usará somente o PostgreSQL local e identidades fictícias, e proponha a menor entrega pendente da Fase 5A com arquivos e critérios de aceite. Preserve autorização, titularidade, escopo da agenda e auditoria. Ao terminar, rode npm test, npm run typecheck e npm run build:next, e para mudanças de agenda rode npm run e2e:scheduling e npm run scheduling:check; atualize docs/PROGRESS.md.
```

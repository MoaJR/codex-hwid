# Permissões e escopo de acesso

**Baseline de produto:** instância única do consultório do Dr. Douglas Vaz. Médico e administrador são a mesma pessoa e usam uma única área profissional. Não existe SaaS/multi-tenant.

## Princípios
- Autorização no servidor, negada por padrão.
- Sessão validada e grants persistidos são a fonte de autoridade.
- A interface reflete as permissões, mas não as concede.
- O titular paciente é sempre derivado da sessão e do vínculo confiável no servidor.
- A conta do Dr. Douglas Vaz reúne as permissões profissionais e administrativas necessárias; não criar usuário médico e usuário admin separados para representar a mesma pessoa.
- Se o código atual ainda representar `DOCTOR` e `ADMIN` como dois papéis, manter temporariamente a união explícita dos grants na mesma conta até que uma consolidação segura do modelo seja planejada. Não alterar schema ou provisionamento apenas por estética.
- Não criar organizações, tenants, clínicas múltiplas, médicos adicionais ou self-service de papéis.

## Matriz conceitual
| Área | Titular médico/admin | Secretaria/equipe (se habilitada) | Paciente |
|---|---|---|---|
| Visão geral profissional | Sim | Limitada ao escopo de equipe | Não |
| Agenda clínica | Sim | Conforme grants operacionais existentes | Somente visão própria permitida |
| Pacientes | Conforme funcionalidades existentes | Somente operações explicitamente permitidas | Não |
| CMS/conteúdos | Conforme grants existentes | Não, salvo autorização explícita já existente | Não |
| Configurações profissionais | Sim, conforme grants | Não | Não |
| Segurança da própria conta | Sim | Sim | Sim |
| Dados de outros pacientes | Conforme necessidade funcional e autorização | Conforme necessidade funcional e autorização | Nunca |
| Portal do paciente | Não como paciente | Não como paciente | Somente o próprio |

Esta matriz conceitual não cria novas permissões: nomes exatos de capabilities e comportamento de APIs devem refletir os guards atuais e testes existentes.

## Invariantes
- O paciente não escolhe o próprio `patientId` por query/body.
- Nenhum acesso a dado de paciente pode depender somente de link ou estado da UI.
- Secretaria não recebe conteúdo clínico por conveniência.
- O médico/admin titular opera a única clínica e a própria agenda.
- Ausência de grant significa negação.
- Toda alteração de grants exige revisão de segurança, testes e documentação.

## Verificação
Atualizar os testes para confirmar que a conta titular vê uma única navegação profissional sem itens duplicados, acessa as funções explicitamente concedidas e que o portal do paciente permanece isolado. Manter testes negativos para acesso cruzado entre pacientes e para funções não concedidas à equipe.

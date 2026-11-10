# Matriz inicial
| Papel | Permitido | Restrição |
| --- | --- | --- |
| PATIENT | leitura da própria agenda, solicitação de horário do catálogo, cancelamento do próprio atendimento e segurança da própria conta | recurso próprio; sem reagendamento, disponibilidade ou agenda da clínica |
| DOCTOR | agenda própria, conteúdo editorial e segurança da própria conta | agenda pelo médico titular; módulos clínicos ainda indisponíveis |
| SECRETARY | agenda leitura/escrita, cadastro mínimo leitura | âmbito da clínica única; sem conteúdo clínico |
| ADMIN | painel administrativo, configurações e conteúdo editorial | sem agenda, paciente ou prontuário; sem edição de permissões neste marco |
Tudo ausente na lista é negado. Permissões de prontuário, diário, documentos e mensagens permanecem reservadas para fases futuras, mesmo quando aparecem na política de domínio. Permissão `document.shared.read` não autoriza acesso a documento privado: a query futura deve filtrar publicação e titularidade. Identidades e relacionamentos vêm do servidor. Mudanças de permissões serão auditadas. Granularidade via tabelas Role/Permission é evolução prevista; não existe painel de edição no marco atual.

## Entrada dos painéis

| Papel | Módulos exibidos em `/painel` |
| --- | --- |
| PATIENT | Meu acompanhamento, minha conta |
| DOCTOR | Agenda, conteúdos, minha conta |
| SECRETARY | Agenda, minha conta |
| ADMIN | Administração, conteúdos, minha conta |

Contas com mais de um papel recebem a união dos módulos autorizados, sem duplicatas. A presença de um cartão não substitui o guard server-side da rota de destino.

## Titular com dois papéis

O produto é de instância única: o Dr. Douglas Vaz é o médico titular **e** o administrador da plataforma. A conta dele acumula `DOCTOR` e `ADMIN`, e `/painel` apresenta Agenda, Conteúdos, Administração e Minha conta, sem duplicata.

A acumulação é explícita — os dois papéis existem em `UserRole` — e **não cria herança**: ADMIN não lê agenda, paciente ou prontuário. Quando o titular opera a agenda, o acesso vem do papel `DOCTOR`. Papéis são concedidos por comando confiável (`npm run auth:provision -- --add-role <PAPEL>`), com auditoria; não existe painel de auto-serviço de permissões neste marco.

Todo usuário autenticado pode encerrar somente as próprias outras sessões; nunca escolhe um `userId` ou `sessionId`. A sessão atual é preservada e a operação não concede acesso a outro recurso.

Todo usuário autenticado com credencial local pode alterar somente a própria senha após informar a senha atual. A aplicação decide a revogação das outras sessões e não aceita identidade, papel ou sessão do corpo da requisição.

## Agenda operacional 5A

| Papel | Ler agenda | Criar/reagendar/cancelar | Configurar disponibilidade |
| --- | --- | --- | --- |
| DOCTOR | Própria | Própria | Própria |
| SECRETARY | Clínica única | Clínica única | Não |
| ADMIN | Não | Não | Não |
| PATIENT | Própria | Solicita e retira a própria pendência; cancela o próprio atendimento | Não |

A agenda do médico é escopo administrativo e não cria vínculo assistencial nem concede prontuário. Secretaria recebe somente metadados necessários à operação. O paciente vê no máximo dez atendimentos futuros confirmados e vinte itens dos últimos 90 dias, sempre vinculados a `Patient.userId` da sessão. O acesso da equipe depende de sessão autenticada e autorização por papel. O rollout permanece controlado e sem dados clínicos reais.

## Solicitação de horário pelo paciente (5B)

| Papel | `appointment.request` | `appointment.request.cancel` | `appointment.cancel` | Decidir (`appointment.write`) |
| --- | --- | --- | --- | --- |
| PATIENT | Própria pendência | Própria pendência | Próprio atendimento | Não |
| DOCTOR | Não | Não | Não | Própria agenda |
| SECRETARY | Não | Não | Não | Clínica única |
| ADMIN | Não | Não | Não | Não |

As três permissões do paciente exigem `patientUserId` igual ao `userId` da sessão e nunca são concedidas por herança a DOCTOR, SECRETARY ou ADMIN. Reagendamento, disponibilidade e agenda da clínica continuam fora do escopo do paciente: `appointment.write` permanece exclusiva da equipe.

A solicitação não reserva o intervalo. O horário, a duração, a modalidade e os buffers vêm do catálogo do servidor; a aprovação revalida a disponibilidade e cria a consulta pelo mesmo caminho transacional da agenda, com lock por médico, exclusion constraint GiST, evento e auditoria na mesma transação. Existe no máximo uma pendência ativa por paciente e uma por par (médico, horário), garantidas por índices parciais únicos no banco.

## Conteúdo editorial
| Papel | Leitura do painel | Escrita de rascunho | Enviar para revisão | Publicar/retirar |
| --- | --- | --- | --- | --- |
| DOCTOR | Sim | Sim | Sim | Sim |
| ADMIN | Sim | Sim | Sim | Não |
| SECRETARY | Não | Não | Não | Não |
| PATIENT | Não | Não | Não | Não |

As permissões editoriais continuam validadas no servidor para cada mutação. Conteúdo publicado é público; o painel e rascunhos não são.

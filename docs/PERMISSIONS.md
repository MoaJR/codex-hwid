# Matriz inicial
| Papel | Permitido | Restrição |
| --- | --- | --- |
| PATIENT | agenda leitura, diário leitura/escrita, documentos compartilhados, mensagens | recurso próprio |
| DOCTOR | agenda própria; paciente, prontuário, diário leitura, documentos, mensagens | agenda pelo médico titular; conteúdo clínico exige vínculo assistencial ativo |
| SECRETARY | agenda leitura/escrita, cadastro mínimo leitura | âmbito da clínica única; sem conteúdo clínico |
| ADMIN | usuários, permissões, auditoria, configurações | sem prontuário implícito |
Tudo ausente na lista é negado. Permissão document.shared.read não autoriza acesso a documento privado: query futura deve filtrar publicação e titularidade. Identidades e relacionamentos vêm do servidor. Mudanças de permissões serão auditadas. Granularidade via tabelas Role/Permission é evolução prevista; não existe painel de edição no marco atual.

Todo usuário autenticado pode encerrar somente as próprias outras sessões; nunca escolhe um `userId` ou `sessionId`. Papéis de equipe precisam concluir MFA na sessão atual. A sessão atual é preservada e a operação não concede acesso a outro recurso.

## Agenda operacional 5A

| Papel | Ler agenda | Criar/reagendar/cancelar | Configurar disponibilidade |
| --- | --- | --- | --- |
| DOCTOR | Própria | Própria | Própria |
| SECRETARY | Clínica única | Clínica única | Não |
| ADMIN | Não | Não | Não |
| PATIENT | Própria, em fase futura | Não neste marco | Não |

A agenda do médico é escopo administrativo e não cria vínculo assistencial nem concede prontuário. Secretaria recebe somente metadados necessários à operação. Todos os acessos da equipe exigem MFA da sessão. O rollout permanece com dados fictícios.

## Conteúdo editorial
| Papel | Leitura do painel | Escrita de rascunho | Enviar para revisão | Publicar/retirar |
| --- | --- | --- | --- | --- |
| DOCTOR | Sim | Sim | Sim | Sim |
| ADMIN | Sim | Sim | Sim | Não |
| SECRETARY | Não | Não | Não | Não |
| PATIENT | Não | Não | Não | Não |

Todas as permissões editoriais de equipe também exigem MFA concluído na sessão atual. Conteúdo publicado é público; o painel e rascunhos não são.

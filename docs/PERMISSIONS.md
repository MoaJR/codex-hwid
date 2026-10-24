# Matriz inicial
| Papel | Permitido | Restrição |
| --- | --- | --- |
| PATIENT | agenda leitura, diário leitura/escrita, documentos compartilhados, mensagens | recurso próprio |
| DOCTOR | agenda, paciente, prontuário, diário leitura, documentos, mensagens | vínculo assistencial ativo |
| SECRETARY | agenda leitura/escrita, cadastro mínimo leitura | âmbito da clínica única; sem conteúdo clínico |
| ADMIN | usuários, permissões, auditoria, configurações | sem prontuário implícito |
Tudo ausente na lista é negado. Permissão document.shared.read não autoriza acesso a documento privado: query futura deve filtrar publicação e titularidade. Identidades e relacionamentos vêm do servidor. Mudanças de permissões serão auditadas. Granularidade via tabelas Role/Permission é evolução prevista; não existe painel de edição no marco atual.

## Conteúdo editorial
| Papel | Leitura do painel | Escrita de rascunho | Enviar para revisão | Publicar/retirar |
| --- | --- | --- | --- | --- |
| DOCTOR | Sim | Sim | Sim | Sim |
| ADMIN | Sim | Sim | Sim | Não |
| SECRETARY | Não | Não | Não | Não |
| PATIENT | Não | Não | Não | Não |

Todas as permissões editoriais de equipe também exigem MFA concluído na sessão atual. Conteúdo publicado é público; o painel e rascunhos não são.

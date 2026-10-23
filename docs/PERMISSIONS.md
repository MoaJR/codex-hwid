# Matriz inicial
| Papel | Permitido | Restrição |
| --- | --- | --- |
| PATIENT | agenda leitura, diário leitura/escrita, documentos compartilhados, mensagens | recurso próprio |
| DOCTOR | agenda, paciente, prontuário, diário leitura, documentos, mensagens | vínculo assistencial ativo |
| SECRETARY | agenda leitura/escrita, cadastro mínimo leitura | âmbito da clínica única; sem conteúdo clínico |
| ADMIN | usuários, permissões, auditoria, configurações | sem prontuário implícito |
Tudo ausente na lista é negado. Permissão document.shared.read não autoriza acesso a documento privado: query futura deve filtrar publicação e titularidade. Identidades e relacionamentos vêm do servidor. Mudanças de permissões serão auditadas. Granularidade via tabelas Role/Permission é evolução prevista; não existe painel de edição no marco atual.

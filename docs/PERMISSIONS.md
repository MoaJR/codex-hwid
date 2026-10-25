# Matriz inicial
| Papel | Permitido | Restrição |
| --- | --- | --- |
| PATIENT | leitura da própria agenda e segurança da própria conta | recurso próprio; sem mutações de agenda |
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

Todo usuário autenticado pode encerrar somente as próprias outras sessões; nunca escolhe um `userId` ou `sessionId`. Papéis de equipe precisam concluir MFA na sessão atual. A sessão atual é preservada e a operação não concede acesso a outro recurso.

Todo usuário autenticado com credencial local pode alterar somente a própria senha após informar a senha atual. Se a conta usa 2FA, ou possui qualquer papel de equipe, a sessão também precisa ter concluído MFA. A aplicação decide a revogação das outras sessões e não aceita identidade, papel ou sessão do corpo da requisição.

## Agenda operacional 5A

| Papel | Ler agenda | Criar/reagendar/cancelar | Configurar disponibilidade |
| --- | --- | --- | --- |
| DOCTOR | Própria | Própria | Própria |
| SECRETARY | Clínica única | Clínica única | Não |
| ADMIN | Não | Não | Não |
| PATIENT | Própria, somente leitura | Não neste marco | Não |

A agenda do médico é escopo administrativo e não cria vínculo assistencial nem concede prontuário. Secretaria recebe somente metadados necessários à operação. O paciente vê no máximo dez atendimentos futuros confirmados e vinte itens dos últimos 90 dias, sempre vinculados a `Patient.userId` da sessão. Todos os acessos da equipe exigem MFA da sessão. O rollout permanece controlado e sem dados clínicos reais.

## Conteúdo editorial
| Papel | Leitura do painel | Escrita de rascunho | Enviar para revisão | Publicar/retirar |
| --- | --- | --- | --- | --- |
| DOCTOR | Sim | Sim | Sim | Sim |
| ADMIN | Sim | Sim | Sim | Não |
| SECRETARY | Não | Não | Não | Não |
| PATIENT | Não | Não | Não | Não |

Todas as permissões editoriais de equipe também exigem MFA concluído na sessão atual. Conteúdo publicado é público; o painel e rascunhos não são.

# Rotas implementadas

| Rota | Estado |
| --- | --- |
| / | Home React |
| /sobre | Apresentação; dados profissionais aguardam confirmação |
| /tratamentos | Hub educativo |
| /tratamentos/ansiedade | Conteúdo educativo |
| /tratamentos/depressao | Conteúdo educativo |
| /tratamentos/tdah-adultos | Conteúdo educativo |
| /tratamentos/transtorno-bipolar | Conteúdo educativo |
| /consulta-online | Preparação e limites da modalidade |
| /agendar | Entrada pública para o painel protegido ou primeiro contato; sem formulário ou reserva pública |
| /contato | Informações; canais oficiais a confirmar |
| /privacidade | Transparência sobre dados, acesso e limites atuais |
| /blog | Índice com busca e categorias |
| /blog/[slug] | Artigo publicado; rascunhos retornam 404 |
| /api/articles | Lista pública de metadados; sem escrita |
| /login | Entrada ativa em Produção para validação controlada |
| /painel | Entrada autenticada; apresenta somente os módulos permitidos pelos papéis da sessão |
| /paciente | Próximos atendimentos, histórico recente, solicitação de horário do catálogo e cancelamento do próprio atendimento |
| /admin | Resumo editorial administrativo; exige `settings.manage`, sem dados clínicos |
| /conta | Perfil, troca de senha e encerramento de outros acessos; sem acesso clínico |
| /api/auth/[...all] | Better Auth GET/POST; habilitado por `AUTH_ENABLED` após provisionamento e responde 503 quando não configurado |
| /api/account/sessions/revoke-others | POST próprio, protegido e auditado; preserva a sessão atual |
| /api/account/password | POST próprio para troca de senha, protegido por senha atual, limite e auditoria |
| /medico/conteudos | Lista editorial; sessão DOCTOR/ADMIN |
| /medico/conteudos/novo | Criação de rascunho protegido |
| /medico/conteudos/[id] | Editor, versão e workflow protegido |
| /medico/agenda | Agenda interna protegida para médico/secretaria, com fila de solicitações do paciente |
| /api/admin/articles | GET/POST editorial protegido |
| /api/admin/articles/[id] | GET/PATCH editorial protegido |
| /api/admin/articles/[id]/transition | Transições auditadas do workflow |
| /api/medico/agenda | GET protegido da janela operacional |
| /api/medico/appointments | POST protegido, transacional e idempotente |
| /api/medico/appointments/[id] | PATCH protegido de reagendamento com versão |
| /api/medico/appointments/[id]/cancel | POST protegido de cancelamento |
| /api/medico/availability | POST protegido de regra ou exceção |
| /api/medico/availability/[id] | DELETE protegido e auditado |
| /api/paciente/appointment-requests | POST protegido de solicitação pendente, com `Idempotency-Key` |
| /api/paciente/appointment-requests/[id]/withdraw | POST protegido de retirada da própria pendência, com versão |
| /api/paciente/appointments/[id]/cancel | POST protegido de cancelamento do próprio atendimento confirmado |
| /api/medico/appointment-requests | GET protegido da fila de solicitações pendentes |
| /api/medico/appointment-requests/[id]/approve | POST protegido; aprova e cria a consulta na mesma transação |
| /api/medico/appointment-requests/[id]/reject | POST protegido; recusa a solicitação preservando o registro |
| /api/health | Saúde da aplicação, não verifica banco |

O protótipo `/demonstracao.html` foi removido e deve retornar 404. Prontuário, prescrições, mensagens clínicas e demais módulos clínicos continuam ausentes. A área do paciente projeta somente rótulo do serviço, modalidade, estado e horário das próprias consultas. Slugs de tratamento desconhecidos retornam 404.

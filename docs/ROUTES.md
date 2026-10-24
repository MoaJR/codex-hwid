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
| /agendar | Fluxo demonstrativo, sem reserva |
| /contato | Informações; canais oficiais a confirmar |
| /privacidade | Transparência da versão de desenvolvimento |
| /blog | Índice com busca e categorias |
| /blog/[slug] | Artigo publicado; rascunhos retornam 404 |
| /api/articles | Lista pública de metadados; sem escrita |
| /login | Entrada ativa em Produção para validação controlada |
| /verificar-acesso | Verificação TOTP ou código de recuperação preparada |
| /conta | Perfil e ativação do autenticador; sem acesso clínico |
| /api/auth/[...all] | Better Auth GET/POST; ativo somente em Produção após provisionamento |
| /medico/conteudos | Lista editorial; sessão DOCTOR/ADMIN com MFA |
| /medico/conteudos/novo | Criação de rascunho protegido |
| /medico/conteudos/[id] | Editor, versão e workflow protegido |
| /api/admin/articles | GET/POST editorial protegido |
| /api/admin/articles/[id] | GET/PATCH editorial protegido |
| /api/admin/articles/[id]/transition | Transições auditadas do workflow |
| /api/health | Saúde da aplicação, não verifica banco |
| /demonstracao.html | Protótipo antigo com hash routes ilustrativas |

/paciente e módulos clínicos de /medico ou /admin ainda não existem como rotas operacionais. A única área interna atual é o CMS editorial protegido. Slugs de tratamento desconhecidos retornam 404.

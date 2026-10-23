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
| /api/health | Saúde da aplicação, não verifica banco |
| /demonstracao.html | Protótipo antigo com hash routes ilustrativas |

/paciente, /medico, /admin e autenticação não existem como rotas operacionais. Antes de criá-las, implementar sessão e guard server-side. Slugs de tratamento desconhecidos retornam 404.

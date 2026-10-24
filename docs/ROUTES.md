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
| /login | Entrada preparada; desabilitada até configuração |
| /verificar-acesso | Verificação TOTP ou código de recuperação preparada |
| /conta | Perfil e ativação do autenticador; sem acesso clínico |
| /api/auth/[...all] | Better Auth GET/POST; 503 enquanto inativo |
| /api/health | Saúde da aplicação, não verifica banco |
| /demonstracao.html | Protótipo antigo com hash routes ilustrativas |

/paciente, /medico, /admin e autenticação não existem como rotas operacionais. Antes de criá-las, implementar sessão e guard server-side. Slugs de tratamento desconhecidos retornam 404.

# Formulários, conteúdo e linguagem

## Formulários
- Labels persistentes, instruções claras e validação no cliente e servidor.
- Erros próximos ao campo, específicos e acessíveis; preserve valores válidos após erro.
- Não limpe formulário inteiro sem motivo.
- Confirmação antes de ação destrutiva; feedback após resposta real do servidor.
- Desabilite submissão duplicada e use idempotência onde a operação exigir.
- Não use campos ou formulários para coletar dados pessoais/clínicos fora do escopo autorizado.

## Conteúdo de saúde
- Conteúdo educativo deve ser claro, responsável e não substituir avaliação profissional.
- Não invente diagnóstico, recomendação clínica individual, estatística, credencial, CRM/RQE, formação, preço ou promessa de resultado.
- Não apresente conteúdo demonstrativo como revisão/autoria clínica real.
- Não altere sentido clínico durante revisão de UX/copy; sinalize necessidade de validação profissional.
- Conteúdo público do blog deve respeitar workflow e filtro de publicação no servidor.
- Slugs não publicados devem continuar retornando 404.
- CMS usa blocos estruturados renderizados por React; nunca habilitar HTML arbitrário.
- Manter versão otimista e eventos de workflow; não sobrescrever edição existente via seed.

## Linguagem e feedback
- Português brasileiro consistente, acentuação correta e tom claro, acolhedor e profissional.
- Evite jargões técnicos na interface do paciente.
- Mensagens não devem culpabilizar o usuário nem prometer resultados.
- Datas/horários devem respeitar `America/Sao_Paulo` na apresentação e UTC no armazenamento.
- Não afirmar que uma consulta foi reservada, cancelada ou alterada antes da confirmação da API.

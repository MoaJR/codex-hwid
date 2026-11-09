# Segurança, privacidade e LGPD — regras não negociáveis

## Bloqueios atuais
- Usar somente identidades e dados fictícios.
- Não inserir, importar, consultar ou testar dados reais de pacientes, médicos, secretárias ou administradores.
- Não usar dados de saúde reais, mesmo que apareçam espontaneamente em material de teste.
- Não implementar prontuário, prescrições, mensagens clínicas, documentos, uploads, pagamentos, lembretes ou funcionalidades clínicas futuras sem autorização e controles específicos.
- Não iniciar Fase 5B enquanto D1–D6 estiverem pendentes e todos os critérios de `docs/PRIVACY.md` não estiverem cumpridos.
- Não ler `.env*`, imprimir variáveis, copiar segredos, baixar variáveis de Produção ou conectar Cline/Codex/agentes ao banco de Produção.
- Não executar comandos de provisionamento em produção nem migrations em banco remoto.

## Segredos
- Nunca solicite, exiba, registre, comite ou passe credenciais em argumentos, prompts, logs, screenshots ou mensagens.
- Nunca use `NEXT_PUBLIC_` para segredos.
- Nunca exponha `DATABASE_URL`, `BETTER_AUTH_SECRET`, tokens, cookies, hashes, recovery codes ou URLs com credenciais.
- Não faça `cat`, `type`, `Get-Content`, `printenv` ou leitura equivalente de `.env*`.
- Use `.env.example` apenas para nomes e placeholders seguros.
- Diagnósticos devem imprimir estados booleanos/agregados e erros sanitizados, nunca mensagens brutas do provedor.

## Dados e minimização
- Coletar/processar somente o mínimo estritamente necessário e já autorizado.
- Não adicionar texto livre, motivo clínico, diagnóstico, observação, anexo ou campo sensível por conveniência.
- Não registrar corpos HTTP, senhas, tokens, IP bruto, user-agent, dados clínicos ou conteúdo editorial completo em auditoria.
- Respostas e props devem usar allowlist; nunca serializar modelos inteiros do Prisma.
- Não incluir dados pessoais em URLs, query strings, analytics, logs ou mensagens de erro.
- Não criar analytics, pixels, cookies ou serviços externos sem revisão de privacidade e aprovação.

## Segurança de aplicação
- Autorização negada por padrão. Não confie em esconder botões ou rotas no frontend.
- Identidade, papéis, sessão, titularidade e escopo vêm do servidor.
- Validar origem canônica nas mutações conforme padrões existentes.
- Validar tamanho, schema estrito, campos permitidos e tipos.
- Proteger contra CSRF, XSS, injection, IDOR/BOLA, SSRF, open redirect, mass assignment e abuso de recursos.
- Renderizar conteúdo editorial como texto/blocos React; não introduzir HTML arbitrário ou `dangerouslySetInnerHTML`.
- Usar consultas parametrizadas/Prisma; nunca concatenar SQL com entrada do usuário.
- Rate limit compartilhado e consistente com o padrão atual.
- Mensagens externas genéricas; detalhes somente em logs seguros e sanitizados.
- Não enfraquecer CSP, headers ou políticas de origem para “fazer funcionar”.
- Uploads privados e URLs temporárias exigem fase aprovada e desenho de autorização próprio.

## Incidentes
Ao encontrar possível exposição de segredo ou dado pessoal: pare, não copie nem reproduza o conteúdo, informe o responsável e proponha contenção. Não tente investigar Produção sem autorização.

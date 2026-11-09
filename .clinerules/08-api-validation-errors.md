# APIs, validação e contratos

- Cada endpoint deve ter contrato explícito de método, autenticação, permissão, origem, tamanho, schema, rate limit, status HTTP e projeção de resposta.
- Use validação runtime com a biblioteca já adotada no repositório. Não confie em tipos TypeScript para validar dados recebidos.
- Rejeite propriedades desconhecidas em mutações sensíveis; evite mass assignment.
- Limite tamanho do body antes de parsear quando possível.
- Normalize entradas de forma consistente; não altere silenciosamente valores com significado.
- Use status HTTP coerentes: 400/422 para contrato inválido conforme padrão existente, 401 para ausência de sessão, 403 para permissão/origem, 404 para recurso não visível, 409 para conflito/versão/idempotência e 429 para limite.
- Não diferencie “não existe” de “existe mas não pode acessar” quando isso revelar recurso protegido.
- Erros de domínio devem ser tipados e mapeados para respostas estáveis.
- Nunca devolver stack trace, SQL, nome de tabela, host, env, provider raw error ou dados internos.
- Paginação deve ter limites máximos e ordenação estável.
- APIs públicas de conteúdo retornam somente artigos `PUBLISHED` com data válida não futura.
- Não adicionar endpoint público de escrita ou coleta pessoal sem autorização e revisão de privacidade.
- Documente mudanças em `docs/ROUTES.md` e atualize testes de contrato/segurança.

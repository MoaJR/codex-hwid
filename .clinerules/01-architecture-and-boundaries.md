# Arquitetura e fronteiras

## Estrutura lógica
Respeite a arquitetura modular documentada:
- `src/app`: composição de páginas, layouts, route handlers e fronteiras HTTP.
- `src/modules`: casos de uso, regras de domínio e orquestração.
- `src/server`: sessão, autorização, acesso ao banco e serviços exclusivamente server-side.
- `src/providers`: integrações e adaptadores externos.
- `src/components`: componentes reutilizáveis e componentes de domínio/UI.
- `src/content` e `src/config`: conteúdo e configuração não secreta.

Confirme os diretórios reais antes de criar arquivos. Não force esta estrutura se o repositório atual tiver uma convenção mais específica.

## Regras de dependência
- UI não importa Prisma, `@prisma/client`, módulos `src/server` ou segredos.
- Código de navegador não importa módulos `node:*`, filesystem, variáveis privadas ou SDKs server-only.
- `src/app` valida protocolo HTTP e compõe; não deve concentrar regras de negócio.
- Casos de uso recebem dados tipados e contexto confiável explicitamente.
- Providers encapsulam dependências externas; não espalhe chamadas externas pelo domínio.
- Política pura deve continuar independente de autenticação e banco, para ser testável.
- Marque módulos exclusivamente servidor com `server-only` quando apropriado.
- Evite dependências circulares e barrels que misturem exports server/client.

## Fluxo obrigatório para mutações
1. Validar método, content-type, tamanho e formato do request.
2. Validar origem canônica quando aplicável.
3. Resolver sessão e ator no servidor.
4. Resolver escopo e relações no banco usando identidade confiável.
5. Autorizar a ação explicitamente.
6. Validar regras de domínio e concorrência.
7. Executar transação quando houver múltiplas gravações relacionadas.
8. Registrar auditoria mínima e segura na mesma transação.
9. Projetar resposta com allowlist de campos.
10. Traduzir erros para respostas estáveis, sem detalhes internos.

Nenhum valor de identidade, papel, escopo, estado, duração, buffer, preço ou autorização enviado pelo cliente é autoridade.

## SSR, client components e hidratação
- Prefira Server Components para leitura e composição sem interação.
- Use `"use client"` somente quando houver estado, eventos, APIs do navegador ou bibliotecas client-side.
- Mantenha fronteiras client pequenas; não converta uma página inteira em Client Component para resolver um detalhe.
- Não passe objetos Prisma, classes, `Date` não serializada ou dados sensíveis para o cliente.
- Evite hydration mismatch: datas, locale, timezone, IDs aleatórios e valores dependentes do navegador devem ser tratados deterministicamente.
- Não use `useEffect` para reproduzir no cliente dados que poderiam vir do servidor.
- Carregamento, erro, vazio e sucesso devem ser estados explícitos.

## Performance
- Use `next/image` para imagens quando adequado; dimensões e `sizes` devem refletir o layout real.
- Evite `use client` global, bibliotecas pesadas no bundle inicial e fetch duplicado.
- Prefira paginação/limites no servidor a carregar coleções inteiras.
- Não use polling agressivo nem listeners sem cleanup.
- Não faça consultas N+1; selecione apenas os campos necessários.
- Não adicione cache a dados autenticados ou pessoais sem análise de isolamento, invalidação e risco de vazamento entre usuários.

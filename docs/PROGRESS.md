# Progresso — 23/10/2026

## Entregue neste marco
- Home pública em React com hero, benefícios, tratamentos, apresentação, etapas, CTA e FAQ.
- Header/Footer reutilizáveis, navegação móvel, tokens CSS e componentes visuais iniciais.
- Páginas /sobre, /tratamentos, quatro tratamentos individuais, /consulta-online, /agendar, /contato e /privacidade.
- Agendamento demonstrativo com três etapas, validação e datas no fuso de Brasília; sem reserva ou coleta de dados pessoais.
- Demonstração antiga preservada para referência dos portais.

## Validação
- npm test: 9 testes reais passaram (7 autorização, 2 datas/seleção). Execução sem isolamento torna os casos visíveis mesmo em ambientes com subprocessos limitados.
- npm run typecheck: passou.
- npm run build: passou; build público separado da geração Prisma, que tem comando próprio db:generate.
- O erro antigo de --showConfig foi reproduzido como restrição de execução de subprocessos. O build passou no contexto de execução permitido, sem ignorar erros TypeScript.
- Smoke HTTP de produção: 12 páginas retornaram 200, healthcheck OK e tratamento inexistente retornou 404.
- Sem browser QA/E2E visual neste ambiente. Responsividade e menu devem ser revisados no navegador do desenvolvedor.

## Situação das fases
Fase 0: aplicação frontend validada; geração Prisma/schema e banco ainda pendentes.
Fase 1: design system inicial, não catálogo completo.
Fase 2: site público parcial entregue; blog, políticas definitivas, fotografia e credenciais dependem de implementação/confirmação.
Demais fases operacionais: ainda não implementadas.

## Próximos passos
1. Validar a experiência visual em localhost e ampliar componentes conforme necessidade.
2. Resolver geração Prisma/schema e estabelecer banco de desenvolvimento.
3. Implementar identidade, sessões, MFA e autorização integrada às APIs.
4. Só então ligar a interface de agendamento à disponibilidade transacional e iniciar os portais.

Sem autenticação, banco conectado, prontuário, mensagens, pagamento ou reserva real. Não usar dados de saúde reais.

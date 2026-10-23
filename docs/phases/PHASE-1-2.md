# Marco — Design system inicial e site público em React

## Objetivo e escopo
Substituir a página provisória por uma experiência pública navegável em Next.js mantendo a referência visual do Dr. Douglas Vaz. Tokens, botões, painéis, navegação, rodapé, foco visível, menu móvel e conteúdo educativo. Site público parcial; blog/CMS, formulários identificados e portais reais ficam fora deste marco.

## Arquivos e rotas
src/components/site/site-shell.tsx, src/content/treatments.ts, src/app/globals.css, home e páginas /sobre, /tratamentos, /tratamentos/[slug], /consulta-online, /agendar, /contato, /privacidade. O fluxo demonstrativo está em src/components/booking. O protótipo antigo permanece em index.html e public/demonstracao.html.

## Modelo e APIs
Sem alteração no schema e sem APIs clínicas novas. O agendamento usa estado React em memória: tipo → data/hora → revisão → conclusão demonstrativa. Datas ilustrativas após o dia atual em America/Sao_Paulo. Nenhuma disponibilidade real, identificação, reserva ou pagamento. Não é a implementação da fase 5 operacional.

## Riscos e critérios de aceite
- Não inventar foto, formação, CRM/RQE, valores ou canais de contato.
- Toda simulação deve informar que não reserva consulta e não solicita dados pessoais.
- Links reais de tratamento e 404 para slug desconhecido.
- Layout responsivo por CSS, navegação sem dependências externas e foco acessível.
- npm test, npm run typecheck e npm run build passando. Smoke HTTP das rotas.
- Revisão visual e interação em navegador continuam necessárias; não confundir checagem HTTP com E2E.

## Continuação
Expandir o design system conforme os domínios e criar blog/CMS. Retomar Prisma e definir identidade/MFA antes de implementar operações autenticadas. O calendário real precisará de bloqueios transacionais contra sobreposição no PostgreSQL.

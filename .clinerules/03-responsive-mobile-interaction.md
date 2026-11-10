# Responsividade e interação — desktop, tablet e mobile

Mobile é plataforma de primeira classe, não desktop comprimido. Planeje cada tela e fluxo para mouse, teclado e toque.

## Navegação profissional e paciente
- Área profissional: sidebar persistente/colapsável no desktop; tablet com sidebar compacta ou drawer; mobile com drawer acessível e, quando melhorar tarefas frequentes, bottom navigation curta. Menu deve incluir todas as páginas permitidas, sem duplicar Médico/Admin.
- Portal do paciente: navegação própria e mais simples; sidebar desktop, drawer mobile e bottom navigation opcional para destinos frequentes.
- Não ocultar funcionalidades essenciais somente em hover ou gesto. Drawer deve permitir Escape, clique no overlay, foco gerenciado e restauração do foco.
- Em mobile estreito, priorize conteúdo e ações; evite tabelas desktop espremidas. Converter tabelas em cards/listas responsivas ou permitir scroll horizontal localizado com indicação clara quando necessário.

## Layout e controles
- Alvos de toque preferencialmente ≥44×44 CSS px; espaçamento adequado entre ações.
- Evite campos lado a lado em larguras estreitas. Labels persistentes; placeholder não substitui label.
- Use `autocomplete`, `inputMode` e teclado apropriados.
- Respeite safe areas, teclado virtual, zoom e `prefers-reduced-motion`.
- Não use `user-scalable=no`; não capture scroll vertical global para gestos locais.
- Drag-and-drop precisa de alternativa acessível por teclado e toque.
- Preserve voltar/avançar e deep links.

## Validação
Verifique larguras de 320, 360, 390, 768, 1024 e desktop amplo (adaptar aos breakpoints reais). Teste overflow, textos longos, menu, modal, dropdown, teclado virtual, foco, touch, teclado, mouse e zoom de 200%.

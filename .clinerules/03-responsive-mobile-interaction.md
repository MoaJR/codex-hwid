# Mobile, responsividade e interação

## Mobile é plataforma de primeira classe
Projete e valide a experiência mobile, não trate-a como desktop comprimido.
- Alvos de toque preferencialmente com pelo menos 44×44 CSS px.
- Espaçamento suficiente entre ações destrutivas e ações comuns.
- Ações primárias devem permanecer fáceis de alcançar; ações secundárias podem ir para menus.
- Evite hover-only, tooltips indispensáveis e menus que dependam de mouse.
- Formulários devem usar `autocomplete`, `inputMode`, `type` e teclado adequados ao campo.
- Use labels persistentes; placeholder não substitui label.
- Evite campos lado a lado em larguras estreitas.
- Não bloqueie zoom; não use `user-scalable=no`.
- Respeite `prefers-reduced-motion`, safe areas e teclado virtual.

## Navegação
- Menu mobile deve ter botão acessível com `aria-expanded`, `aria-controls` e nome claro.
- Ao abrir modal/menu, gerencie foco e Escape; ao fechar, devolva foco ao acionador.
- Não deixe conteúdo de fundo interativo quando um modal estiver aberto.
- Preserve navegação por voltar/avançar do navegador e links profundos.
- Estados ativos precisam ser identificáveis além da cor.

## Gestos e controles
- Gestos podem complementar, nunca substituir, controles visíveis.
- Drag-and-drop deve ter alternativa por teclado e botões/movimento por toque.
- Não capture scroll vertical global para gestos locais.
- Evite ações irreversíveis por swipe sem confirmação ou possibilidade de desfazer.
- Em listas longas, mantenha feedback de seleção e contagem.

## Validação
Para cada mudança relevante, inspecione visualmente desktop e mobile. Teste:
- sem overflow horizontal;
- texto longo, nomes extensos e traduções;
- teclado virtual e foco em inputs;
- menu, modal, dropdown e toast;
- loading e erro;
- touch, teclado e mouse;
- zoom de 200%.

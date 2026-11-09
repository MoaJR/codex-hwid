# UI, design system, temas e consistência visual

## Princípios visuais
A interface deve parecer um produto profissional, confiável, contemporâneo e editorial — não um template genérico ou uma composição “AI slop”.
- Hierarquia tipográfica clara; alinhamento e espaçamento consistentes.
- Use espaço em branco intencional, superfícies discretas e contraste suficiente.
- Evite excesso de cards, gradientes decorativos, sombras pesadas, glassmorphism indiscriminado, bordas em todos os elementos e ícones sem função.
- Não introduza cores aleatórias por página. Use tokens semânticos.
- A identidade vigente está em `docs/DESIGN_SYSTEM.md` e nos tokens de `src/styles/tokens.css`: azul principal `#0367A6`, azul profundo `#023859`, azul médio `#0379A6`, ciano `#049DBF` (apenas gráfico e texto grande) e fundo `#F2F2F2`. Preserve os status semânticos existentes e não introduza hex fora de `tokens.css`.

## Tokens
Antes de criar estilos, procure os tokens atuais em `src/app/globals.css` e componentes de tema. Centralize:
- cores: `background`, `foreground`, `surface`, `surface-muted`, `border`, `primary`, `primary-foreground`, `secondary`, `muted`, `accent`, `success`, `warning`, `danger`, `info`;
- tipografia: famílias, escala, pesos, line-height e tracking;
- layout: largura de conteúdo, gutters, espaçamentos, raios e elevações;
- interação: foco, hover, pressed, disabled e motion;
- camadas: header, popover, modal, toast e overlay.

Não espalhe valores hex, sombras ou raios hardcoded. Use CSS custom properties ou o mecanismo já adotado pelo projeto. Cores semânticas de status devem continuar distintas da cor de marca.

## Theme / dark mode
- Primeiro descubra se existe infraestrutura de tema e como é persistida; não introduza um segundo sistema.
- Se light/dark/system já existir, todos os componentes novos devem respeitar os três modos e tokens semânticos.
- Se dark mode ainda não estiver implementado, não simule suporte parcial nem adicione um toggle inerte. Estruture novos componentes com tokens para permitir evolução.
- Respeite `prefers-color-scheme` quando o produto já adotar modo system.
- Evite flash de tema incorreto na hidratação; use a estratégia já instalada.
- Não use `filter: invert()` para criar dark mode.
- Verifique gráficos, imagens, bordas, overlays, inputs, calendários e estados de foco nos dois temas.

## Componentes
- Reutilize Button, Input, Select, Dialog, Dropdown, Table, Badge, Tooltip, Toast e padrões existentes.
- Componentes devem ter responsabilidade única e API previsível.
- Variantes devem ser explícitas (`size`, `variant`, `tone`) em vez de combinações arbitrárias de classes.
- Estados `loading`, `disabled`, `invalid`, `selected`, `active` e `pending` devem ser visíveis e semanticamente corretos.
- Não use `div` clicável quando `button` ou `a` for apropriado.
- Não use emoji como substituto de ícones de interface.
- Ícones precisam de tamanho, alinhamento e peso consistentes; ícones decorativos devem ser ocultados de leitores de tela.

## Layout responsivo
Adote mobile-first e os breakpoints já existentes no projeto. Não crie breakpoints paralelos.
- Teste no mínimo 320/360, 390/430, 768, 1024 e 1440 px.
- Evite larguras/alturas fixas que causem overflow; prefira `minmax`, `clamp`, flex/grid e limites fluidos.
- Inclua `min-width: 0` em filhos flex/grid que contenham texto ou mídia quando necessário.
- Trate safe areas em dispositivos móveis (`env(safe-area-inset-*)`) em overlays fixos.
- Não dependa de hover para ações essenciais.
- Em telas pequenas, reorganize a hierarquia; não apenas reduza tudo.
- Tabelas largas devem ter estratégia explícita: colunas prioritárias, scroll horizontal acessível ou apresentação alternativa em lista/cartões.
- Modais em mobile devem caber na viewport, permitir scroll interno e manter ações acessíveis; considere bottom sheet somente quando adequado.
- Inputs não devem ficar cobertos pelo teclado virtual; teste foco e scroll.
- Respeite orientação landscape e zoom do navegador.

## Estados de interface
Toda tela de dados deve contemplar:
- carregamento com skeleton ou indicador contextual sem layout shift excessivo;
- vazio com explicação e próximo passo realista;
- erro com mensagem útil e ação de recuperação;
- sucesso com confirmação clara;
- permissões negadas sem revelar a existência de dados protegidos;
- estado offline/retry quando a funcionalidade depender de rede.

Nunca exiba botões que não funcionam, dados falsos apresentados como reais ou estados de sucesso antes da confirmação do servidor.

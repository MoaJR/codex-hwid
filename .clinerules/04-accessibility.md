# Acessibilidade (WCAG)

Busque conformidade WCAG 2.2 AA nas interfaces novas e nas áreas tocadas. Acessibilidade não é etapa cosmética.

## Semântica e teclado
- Use landmarks (`header`, `nav`, `main`, `footer`), headings hierárquicos e HTML semântico.
- Toda ação deve funcionar por teclado; ordem de tab deve seguir a ordem visual/lógica.
- Não remova `outline` sem substituto de foco claramente visível.
- Foco deve ser visível, não encoberto por header sticky, modal ou drawer.
- Links navegam; botões executam ações. Não misture semânticas.
- Inclua link “Pular para o conteúdo” quando a navegação repetitiva justificar.
- Não use `tabIndex` positivo.
- Para componentes compostos, implemente padrões WAI-ARIA corretos em vez de adicionar ARIA aleatória.

## Nome e estado acessíveis
- Todo input tem label programático.
- Erros devem ser associados ao campo (`aria-describedby`) e indicados em texto, não só cor.
- Botões de ícone têm nome acessível.
- Estados de expansão, seleção, carregamento e invalidez são anunciados corretamente.
- Atualizações assíncronas relevantes podem usar `aria-live` com parcimônia.
- Conteúdo decorativo usa `aria-hidden`; imagens informativas têm texto alternativo contextual.
- Tabelas usam caption, headers e escopo apropriado.

## Contraste e movimento
- Contraste mínimo WCAG AA: 4.5:1 para texto comum e 3:1 para texto grande e elementos gráficos relevantes.
- Não transmita status apenas por cor.
- Respeite `prefers-reduced-motion`; desative animações não essenciais e parallax.
- Não pisque conteúdo nem use animações que possam provocar desconforto.
- Foco não pode ser ocultado por elementos fixos.

## Testes
Quando disponível, use axe ou ferramenta equivalente nos fluxos principais. Faça revisão manual de teclado e leitor de tela em componentes complexos. Não afirme conformidade integral com base apenas em um teste automatizado.

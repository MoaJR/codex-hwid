# Motion, microinterações e feedback

## Princípios
Motion deve comunicar hierarquia, continuidade, causa e efeito — nunca atrasar a tarefa.
- Animações curtas e consistentes; prefira transform/opacity.
- Evite animar layout, blur, sombras grandes ou propriedades que provoquem repaint contínuo.
- Não adicione animações a cada elemento só para parecer sofisticado.
- Respeite `prefers-reduced-motion` e ofereça transições reduzidas.
- Não bloqueie interação durante animação decorativa.
- Evite spring excessivo, bounce infantil, parallax e scroll-jacking.

## Estados
- Hover, focus-visible, active, pressed, selected, disabled, loading e success devem ter feedback coerente.
- Feedback otimista só quando houver rollback claro e seguro.
- Toast não substitui mensagem inline em erros de formulário.
- Ação destrutiva exige confirmação contextual; toast de desfazer é preferível quando seguro.
- Loading não pode mudar drasticamente dimensões nem causar layout shift.

## Bibliotecas
Antes de adicionar Framer Motion ou outra lib, verifique dependências existentes e padrões. Não introduza duas bibliotecas para o mesmo problema. Animações precisam funcionar em touch, teclado e leitores de tela.

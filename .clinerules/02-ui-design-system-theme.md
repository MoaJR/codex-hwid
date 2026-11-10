# UI, design system, tema e identidade visual

## Fonte visual oficial
Consultar `docs/VISUAL_IDENTITY.md` e os arquivos originais em `docs/identidade visual/` antes de criar ou alterar elementos de marca. A identidade não é opcional nem deve ser substituída por um tema genérico.

- Azul Suave `#0367A6` — principal.
- Azul Profundo `#023859` — profundidade e estrutura.
- Azul Sereno `#0378A6` — apoio.
- Azul Claro `#049DBF` — acento.
- Cinza Neutro `#F2F2F2` — base neutra.
- DM Sans — tipografia principal; Gantari — complementar.
- Usar logos e símbolo oficiais sem deformar, recolorir ou reconstruir. Ver `docs/identidade visual/`.

## Princípios
- Construir tokens semânticos para cor, tipografia, espaçamento, raio, sombra, borda, foco e camadas. Componentes devem consumir tokens, não espalhar valores arbitrários.
- Claro é o tema de referência. Se houver tema escuro, mapear tokens semânticos e validar contraste; não inverter cores mecanicamente.
- Hierarquia visual limpa, acolhedora e sofisticada; superfícies leves, densidade adequada e foco claro.
- Evitar aparência genérica de template SaaS, excesso de cards, gradientes gratuitos, glassmorphism indiscriminado, sombras pesadas e decoração que compete com dados.
- Não usar cor como único indicador. Estados devem combinar texto, ícone e forma.
- Tipografia funcional legível; evitar texto menor que 12px e preferir 14px ou mais para conteúdo de uso frequente.
- Contraste WCAG 2.2 AA para texto, controles, foco e estados.
- Não criar uma identidade paralela para o portal do paciente: manter a mesma marca com uma experiência mais simples e acolhedora.

## Processo
Antes de criar um componente, procure equivalente no projeto. Reutilize e melhore padrões existentes. Teste visualmente estados normal, hover, focus-visible, active, disabled, loading, error, empty e success em desktop e mobile.

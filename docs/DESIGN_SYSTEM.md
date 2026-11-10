# Design system — identidade visual Dr. Douglas Vaz

Status: **aplicado em código a partir de 09/11/2026**, com pendências registradas na seção 9.
Fonte da marca: `docs/identidade visual/Apresentação Identidade Visual Douglas Vaz.pdf`
(apresentação exportada do Figma; ver observação metodológica na seção 8).

## 1. Marca

- **Símbolo**: cérebro desenhado como **balão de fala**, contorno monoline. Existe em versão
  *outline* e *sólida*, e em monocromático.
- **Wordmark**: “Douglas Vaz” em sans geométrica, com `g` de andar único. Na versão secundária, o
  **“u” de “Douglas” é substituído por um estetoscópio**.
- **Assinatura**: `SAÚDE MENTAL E QUALIDADE DE VIDA`, caixa alta, tracking largo.
- **Lockups presentes no material**: horizontal, vertical, empilhado, com e sem assinatura,
  monocromático, sobre fundo claro e sobre fundo escuro.
- **Aplicações demonstradas**: cartão de visita, chaveiro, bordado em jaleco, fachada/luminoso e
  peças sociais.

Regras de uso:

1. Não recriar, redesenhar, inclinar, condensar ou aplicar contorno/sombra no símbolo.
2. Não trocar o wordmark por outra fonte: a fonte oficial ainda não está disponível (seção 9).
3. Não usar a assinatura como título ou CTA; ela acompanha o lockup.
4. Em aplicação interna de produto, o wordmark aparece sem símbolo até o vetor oficial existir.

## 2. Paleta

Valores exatos lidos no material de identidade:

| Token | Hex | Papel |
| --- | --- | --- |
| `--brand-deep` | `#023859` | azul profundo; superfície escura e hover da ação |
| `--brand-primary` | `#0367A6` | azul principal; ação, links, ênfase |
| `--brand-medium` | `#0379A6` | azul médio; apoio, texto grande e gráficos |
| `--brand-cyan` | `#049DBF` | ciano; acento gráfico e texto grande |
| `--brand-neutral` | `#F2F2F2` | cinza claro do manual; fundo |

Tons **derivados** (tints do azul principal, apenas superfície — não são cores de marca):
`--brand-tint-050 #EAF2F8`, `--brand-tint-100 #E3EEF6`, `--brand-cyan-tint #E1F3F8`,
`--color-primary-border #9FBDD4`.

Neutros de texto e borda foram mantidos do produto (`--color-ink #0B1A31`,
`--color-muted #55657D`, `--color-border #DCE4F0`) para não abrir uma segunda paleta neutra.

### Contraste (WCAG 2.2, calculado em `tests/design-tokens.test.mjs`)

| Combinação | Razão | Uso permitido |
| --- | --- | --- |
| `#023859` sobre `#F2F2F2` | 10,95:1 | qualquer texto |
| `#0367A6` sobre `#F2F2F2` | 5,37:1 | texto normal |
| `#0379A6` sobre `#F2F2F2` | 4,37:1 | **não** para texto pequeno; só grande/gráfico |
| `#049DBF` sobre branco | 3,19:1 | **só** gráfico e texto grande |
| branco sobre `#0367A6` | 6,01:1 | botão primário |
| `#55657D` sobre `#F2F2F2` | 5,29:1 | texto secundário |
| `#D08A3E` sobre `#F2F2F2` | 2,54:1 | **nunca** texto; apenas borda/indicador |

### Status (leitura operacional preservada)

`--color-success #1D6946` / `--color-success-soft #DCEFE4`, `--color-warning-text #7B5A12` /
`--color-warning-soft #FFF0CE`, `--color-danger #9E442B` / `--color-danger-soft #FFF0EC`,
`--color-info-strong #315D7B` / `--color-info-soft #EAF0FA`, `--color-neutral-strong #665F59` /
`--color-neutral-soft #ECEBEA`. Todos os pares passam AA. Status **nunca** são comunicados só por

## 3. Tipografia

O material de identidade usa uma **sans geométrica** no wordmark, mas o PDF exporta o texto como
contorno (fontes Type3), então **o nome da fonte não é recuperável do arquivo**. Até a fonte oficial
ser entregue:

- `--font-display` e `--font-sans` apontam para a pilha de sistema
  (`ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial`).
- Títulos, wordmark e corpo passam a usar a **mesma família**; a serifa `Georgia` foi removida do
  produto por não pertencer à identidade.
- A troca para a fonte oficial é **uma linha** em `src/styles/tokens.css`.

Escala (nada de texto abaixo de 12px):

| Token | Valor | Uso |
| --- | --- | --- |
| `--text-2xs` | 12px | micro-rótulos em caixa alta (eyebrow, badge, meta) |
| `--text-xs` | 12px | legenda e texto auxiliar |
| `--text-sm` | 13px | texto denso de tabela/lista |
| `--text-base` | 15px | corpo |
| `--text-md` | 16px | corpo de destaque |
| `--text-lg` | 18px | subtítulo |
| `--text-xl` | 22px | título de bloco |
| `--text-2xl` | `clamp(32px, 3.3vw, 46px)` | h2 |
| `--text-3xl` | `clamp(44px, 5.1vw, 72px)` | h1 |

Pesos: 700 em micro-rótulos, 600 em títulos e botões, 400 no corpo. Tracking: `--tracking-tight`
em títulos grandes e `--tracking-wide` (0,16em) em caixa alta.

## 4. Estrutura

- **Espaçamento**: base 4px (`--space-1` a `--space-20`).
- **Raios**: `--radius-sm 6`, `--radius-md 10` (padrão legado `--radius`), `--radius-lg 16`,
  `--radius-xl 24`, `--radius-pill 999`.
- **Elevação**: `--shadow-sm/md/lg`. Sombra não compensa hierarquia tipográfica.
- **Camadas**: `--z-header 100`, `--z-overlay 200`, `--z-modal 300`, `--z-toast 400`.
- **Movimento**: `--motion-fast 150ms`, `--motion-base 200ms`, `--ease-out`. Toda transição é
  neutralizada em `prefers-reduced-motion: reduce` (regra já existente no CSS).

## 5. Componentes e classes

O produto usa **classes CSS de domínio** (`.button`, `.panel`, `.form-grid`, `.status-badge`,
`.home-*`), não uma biblioteca de componentes React. Esta entrega **não renomeou nenhuma classe**:
os componentes existentes passaram a herdar a marca pelos tokens.

Diretrizes para evoluir:

- Botão: `.button` (primário), `.button-outline`/`.button-secondary` (secundário),
  `.button-light` (sobre superfície escura). Estados `hover`, `focus-visible`, `disabled` e
  `aria-busy` obrigatórios.
- Formulário: label persistente + `.field-hint` + erro associado por `aria-describedby`;
  `.form-error` em `--color-danger`; nunca substituir label por placeholder.
- Status: `.status-badge` e `.status-*` com fundo suave + rótulo textual.
- Superfícies: `.panel` (branco, borda `--color-border`), `.soft-panel`
  (`--color-surface-muted`), `.context-notice` e `.notice` com barra lateral na cor de marca.
- Agenda/editorial: tabelas mantêm cabeçalho, `scope` e rolagem horizontal acessível.

cor: sempre com rótulo textual.


## 6. Acessibilidade aplicada

- Piso de **12px** para qualquer texto (antes havia 8, 9, 9.5, 10, 10.5, 11 e 11.5px; 59 ocorrências
  corrigidas, incluindo `.eyebrow`, `.brand small`, `.status-badge`, meta de artigo e cards do hero).
- Alvos de toque: menu mobile (acionador e itens) e link inline da home com `min-height: 44px`;
  ícones decorativos com `aria-hidden`.
- Contraste verificado por teste automatizado (`tests/design-tokens.test.mjs`).
- Status nunca depende só de cor; o rótulo acompanha o badge.
- Tema: **somente claro** (`color-scheme: light`). A identidade não define modo escuro; os tokens
  estão prontos para um `[data-theme="dark"]` futuro, sem toggle inerte.

## 7. O que foi aplicado nesta entrega (09/11/2026)

- `src/styles/tokens.css`: camada única de tokens (marca, semânticos, tipografia, espaço, raio,
  sombra, camada, movimento), importada antes de `globals.css` em `src/app/layout.tsx`.
- `src/app/globals.css`: `:root` legado agora aponta para os tokens; 34 grupos de substituição
  trocaram hex por token (paleta principal, superfícies, foco, status, rodapé, hero, cartão de CTA,
  moldura do retrato). Serifa removida de títulos e do wordmark.
- `.brand` em `src/components/site/site-shell.tsx`: o desenho botânico saiu do header e do rodapé;
  o lockup passa a ser o **wordmark da marca** com o descritor `PSIQUIATRIA`.
- `tests/design-tokens.test.mjs`: guarda permanente (paleta exata, ausência de cor nova, retirada da
  paleta navy, piso de 12px, tokens inexistentes, alfa colado em `var()`, contraste AA).

## 8. Observação metodológica

A apresentação é um export de Figma em **página única (1927 × 10732 pt)** com texto convertido em
**contorno (Type3)**: não há mapa `ToUnicode` utilizável, portanto o texto do PDF não é extraível e
os nomes de fonte não aparecem. As cores foram lidas nas amostras do próprio material (rótulos de
HEX visíveis nas pranchas do símbolo) e os lockups, na inspeção das imagens embutidas. Nenhum valor
foi estimado por aproximação.

## 9. Pendências (dependem do responsável ou do designer)

| # | Pendência | Impacto | Fallback em uso |
| --- | --- | --- | --- |
| 1 | Fonte oficial (nome + arquivo `.woff2`) | tipografia fiel ao manual | pilha de sistema em `--font-display` |
| 2 | Vetores oficiais do símbolo e do wordmark (SVG) | mark no header, favicon, OG image | wordmark tipográfico, sem símbolo |
| 3 | HEX do rosa suave do ícone outline | acento secundário | não aplicado |
| 4 | Área de proteção, redução mínima e malha do lockup | regras de aplicação | não documentadas |
| 5 | Aprovação da assinatura “Saúde mental e qualidade de vida” no site | copy institucional | descritor atual `PSIQUIATRIA` |
| 6 | Direitos/consentimento das fotos do material | hero e página “Sobre” | retrato já existente em `public/images` |
| 7 | Decisão sobre hero claro (a identidade é predominantemente clara; o hero segue escuro) | direção visual da home | hero em azul profundo da marca |

## 10. Dívida registrada

`src/app/globals.css` ainda contém **85 valores hexadecimais legados** (122 ocorrências: brancos
translúcidos, azuis claros de tabelas/editorial e stops de gradiente). Eles estão listados em
`legacyAllowlist` dentro de `tests/design-tokens.test.mjs` e **a lista só pode encolher**: qualquer
cor nova fora dos tokens quebra a suíte. A migração é incremental, por tela, sem renomear classes.

**Atualização de 09/11/2026 (onda 1 concluída).** Migrados para token os valores que já tinham
equivalente exato, sem mudança de rendering: `#fff`/`#ffffff` → `--color-surface` (fundo e borda) ou
`--color-on-brand` (texto sobre marca), `#fff0ec` → `--color-danger-soft` e `#eaf0fa` →
`--color-info-soft` (46 ocorrências). A dívida caiu de 89 para 85 valores distintos e de 168 para
122 ocorrências. Na mesma passada, as 11 ocorrências restantes de `Georgia,serif` passaram a
`var(--font-display)`, encerrando a serifa aposentada no CSS global. Uma guarda passou a reprovar
entrada da `legacyAllowlist` que não exista mais no CSS, para a lista não voltar a crescer por
inércia. A onda 2 (brancos translúcidos e azuis claros) exige decisão de escala de alfa/tints e
revisão visual por tela.

## 11. Dashboard autenticado (10/11/2026, ampliado em 11/11/2026)

- Casca em `src/components/dashboard/app-shell.tsx` (menu lateral fixo ≥ 901px; gaveta abaixo disso, com `aria-expanded`, `aria-controls`, Escape, foco devolvido ao botão e fundo `inert`). Cabeçalho de página em `page-header.tsx`; ícones SVG decorativos em `icons.tsx`.
- Tokens em `tokens.css`: `--sidebar-width`, `--sidebar-width-collapsed`, `--topbar-height`, `--app-content-max`, `--app-bottom-nav-height`, `--z-sidebar`. Estilos `.app-*` em `globals.css` usam apenas tokens, sem hex novo.
- Menu em azul profundo com texto claro e item ativo marcado por `aria-current` e barra, além da cor. Sem dark mode.
- **Sidebar recolhível (11/11/2026)**: `data-collapsed` no `.app-shell` troca `--sidebar-current-width` entre 272 px e 76 px, com transição só depois de restaurar a preferência (`data-ready`). Recolhida, os rótulos são clipados (continuam acessíveis), os ícones ficam centralizados, o wordmark vira o monograma “DV” e o `title` funciona como tooltip nativa. `.app-body` acompanha a largura pela mesma variável.
- **Barra inferior mobile (11/11/2026)**: `aria-label` próprio (“Navegação rápida do painel”), até três destinos com rótulo curto, `aria-current`, indicador superior e fundo `--color-primary-soft` no ativo, alvos de 44 px e `env(safe-area-inset-bottom)`. O botão “Mais opções do menu” reaproveita a gaveta; a barra some com a gaveta aberta e o conteúdo reserva `--app-bottom-nav-height`.
- **Topbar mobile** exibe o título da seção atual resolvido por `sectionForPath`, com truncamento por reticências e contraste AA.

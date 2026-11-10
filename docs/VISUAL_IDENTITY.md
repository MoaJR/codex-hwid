# Identidade visual — Douglas Vaz

**Fonte oficial:** arquivos originais em `docs/identidade visual/`. Não redesenhar nem reinterpretar a marca quando o asset oficial atender ao uso.

## Posicionamento visual
A marca representa uma medicina que acolhe, escuta e promove bem-estar com base científica. Deve comunicar clareza, serenidade, leveza, sofisticação, confiança, cuidado e precisão clínica. O resultado digital deve ser humano, contemporâneo, limpo e confiável — não hospitalar/frio, infantil, excessivamente corporativo ou visualmente carregado.

## Paleta oficial
Valores extraídos da prancha `Paleta de cores.png`:

| Token sugerido | Nome oficial | HEX | Uso |
|---|---|---|---|
| `brand-primary` | Azul Suave | `#0367A6` | Cor principal da identidade, links e ações primárias |
| `brand-deep` | Azul Profundo | `#023859` | Profundidade, navegação, títulos/áreas de destaque |
| `brand-serene` | Azul Sereno | `#0378A6` | Apoio, estados informativos e elementos secundários |
| `brand-light` | Azul Claro | `#049DBF` | Destaques leves, foco visual e acentos com parcimônia |
| `neutral-100` | Cinza Neutro | `#F2F2F2` | Base neutra, superfícies claras e contraste com azuis |

Os nomes e códigos acima são oficiais. Tons adicionais para superfícies, texto, bordas, estados de sucesso/alerta/erro e fundos podem ser derivados como tokens funcionais, desde que não substituam nem alterem os cinco tons institucionais. Documentar os valores derivados no design system e verificar contraste WCAG 2.2 AA. Não usar o azul claro como texto pequeno sobre branco sem validar contraste.

## Tipografia
- **DM Sans:** família principal para interface, títulos, textos, formulários, navegação e dados.
- **Gantari:** família complementar para usos de apoio/editoriais quando houver benefício real e consistência.
- Priorizar DM Sans em toda a UI de produto para legibilidade e consistência; usar Gantari com parcimônia. Verificar arquivos de fonte existentes/licenciamento antes de adicionar fontes externas.
- Escala tipográfica responsiva, line-height confortável e piso recomendado de 14px para texto funcional; textos auxiliares nunca devem ficar ilegíveis.

## Logotipos e símbolo
Assets disponíveis:
- `Logo Completa Azul Marinho.png`: aplicação institucional horizontal com símbolo e nome.
- `nome logo isolado.png`: nome/assinatura sem símbolo.
- `icone logo isolado.png`: símbolo cerebral para avatar, favicon e contextos compactos.
- `Doutor.png`: fotografia institucional do médico.

Regras:
- Usar o arquivo original adequado ao fundo e ao espaço; preservar proporção, área de respiro e legibilidade.
- Nunca esticar, inclinar, recolorir, redesenhar, aplicar sombra pesada ou reconstruir o logotipo com texto/fonte.
- Não usar logo completa em espaços estreitos onde fique ilegível; preferir símbolo oficial.
- Não substituir a marca por ícones genéricos de cérebro.
- A foto `Doutor.png` pode ser usada em apresentação institucional/perfil quando fizer sentido; não inventar fotos, credenciais, especialidades ou depoimentos.

## Aplicação em interface
- Preferir fundos claros e neutros, superfícies brancas/cinza suave e azul profundo para estrutura. Azul primário para ação principal; tons sereno/claro como acentos.
- Interface arejada, hierarquia tipográfica clara, bordas discretas, estados de foco nítidos e componentes consistentes.
- Evitar saturar todas as telas de azul, gradientes decorativos, glassmorphism indiscriminado, sombras exageradas, excesso de cards, aparência de template genérico ou visual de SaaS multi-tenant.
- A navegação profissional pode ter personalidade visual mais estruturada, enquanto o portal do paciente deve transmitir acolhimento e simplicidade. Ambos devem parecer parte da mesma marca.
- Cor nunca deve ser o único indicador de status; combinar texto, ícone e forma.
- Garantir contraste de texto, controles, foco e estados em todos os temas e breakpoints.

## Temas
A identidade oficial define a paleta de marca, não obriga um modo escuro. Implementar/ajustar tema claro como experiência de referência. Se existir modo escuro, mantê-lo funcional e legível com tokens semânticos próprios derivados da identidade; não inverter cores mecanicamente nem sacrificar contraste. Preferência do sistema deve ser respeitada quando suportada pelo produto.

## Assets
Manter os arquivos originais em `docs/identidade visual/` como referência de marca. Se forem copiados para `public/` para uso na aplicação, preservar os originais e documentar a origem/cópia. Não converter ou otimizar de modo destrutivo.

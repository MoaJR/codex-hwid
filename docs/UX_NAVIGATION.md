# Navegação e experiência das áreas autenticadas

## Princípio
Uma única operação, duas experiências: **Área profissional (médico/admin)** e **Portal do paciente**. Médico e administrador são a mesma pessoa e não devem aparecer como perfis ou painéis separados para o titular.

## Área profissional
Sidebar global no desktop, com grupos nomeados de acordo com os módulos realmente existentes. A estrutura abaixo é uma proposta de organização, não autorização para inventar páginas:
- Visão geral
- Atendimento: Agenda, Solicitações, Pacientes (somente se esses módulos existirem e estiverem autorizados)
- Conteúdo e presença: Conteúdos/CMS e páginas públicas (se existentes)
- Gestão: Configurações, segurança da conta e ferramentas administrativas já implementadas

Regras:
- Não duplicar itens por conta dos papéis DOCTOR e ADMIN.
- Unir permissões efetivas do titular sem mostrar alternância de papel.
- Item ativo, breadcrumb/título de página e ação principal precisam ser claros.
- Sidebar recolhida deve manter tooltip acessível e rótulos disponíveis para leitor de tela.
- Em telas estreitas, drawer com overlay, fechamento por Escape, foco gerenciado e retorno do foco ao acionador.
- Se houver poucos destinos frequentes no mobile, usar barra inferior de até 4–5 destinos prioritários e manter o restante no drawer/“Mais”. Não duplicar navegação em excesso.
- Não exibir no menu recursos inexistentes, indisponíveis ou ainda não aprovados.

## Portal do paciente
Navegação independente, simples e orientada às tarefas:
- Início/Resumo
- Meus atendimentos ou Minha agenda
- Solicitações (se o fluxo existir)
- Minha conta e segurança
- Ajuda/contato apenas com canais oficiais já confirmados

Não mostrar CMS, gestão, configurações profissionais, pacientes de terceiros ou ações internas. Não expor identificadores internos. O paciente só pode consultar ou alterar recursos próprios segundo as permissões e fluxos existentes.

## Breakpoints e comportamento
- Mobile estreito (320–359px): drawer; evitar barra inferior com muitos itens ou labels truncados.
- Mobile (360–767px): drawer + opcional bottom navigation para destinos de maior frequência.
- Tablet (768–1023px): sidebar compacta/colapsável ou drawer persistente, conforme espaço real.
- Desktop (1024px+): sidebar persistente, colapsável; conteúdo fluido com limite de largura quando apropriado.
Os breakpoints são referências iniciais; validar com o layout e conteúdo real, não tratar como valores rígidos.

## Estado implementado (11/11/2026)
A casca real é `src/app/painel/layout.tsx` + `src/components/dashboard/app-shell.tsx`. O que existe hoje:

- **Menu único** derivado de `navigationForRoles` (grupos Geral, Atendimento, Site, Gestão, Conta), sem item duplicado por papel. `profileForRoles` produz três perfis de interface: Médico e administrador, Secretaria e Paciente.
- **Desktop (≥ 901 px)**: sidebar persistente em azul profundo e **recolhível** pelo botão do cabeçalho (`aria-expanded`, `aria-controls`). Recolhida, ela mantém `--sidebar-width-collapsed` (76 px), mostra só ícones e o monograma, preserva o rótulo na árvore de acessibilidade (texto clipado, não removido) e oferece `title` como tooltip nativa. A preferência fica em `localStorage` e é restaurada depois da hidratação, sem atributo divergente no HTML e sem animação no carregamento. O conteúdo acompanha a largura via `--sidebar-current-width`.
- **Tablet (768–1023 px)**: a faixa 768–900 usa a gaveta; 901–1023 mantém a sidebar completa, que pode ser recolhida manualmente quando o conteúdo precisar de espaço.
- **Mobile (≤ 900 px)**: topbar fixa com o **título da seção atual** (fallback “Painel”), acionador “Abrir menu” e uma **barra inferior** com até três destinos frequentes (`--app-bottom-nav-height`, alvos de 44 px, `aria-current`, indicador além da cor) mais o botão “Mais opções do menu”, que abre a gaveta com o menu completo. A barra some enquanto a gaveta está aberta e respeita `env(safe-area-inset-bottom)`.
- **Prioridade da barra**: Início, Agenda, Conteúdos, Acompanhar, Conta — respeitando os módulos autorizados. Administração nunca entra na barra; o titular a alcança pelo drawer.
- **Gaveta**: Escape, clique no overlay, foco movido para o primeiro link, foco devolvido ao acionador e fundo `inert`.
- **Autorização**: o menu e a barra são apenas apresentação. Cada rota `/painel/*` mantém `requirePanelPage`/`requirePermissionPage`/`requirePatientPage`; rotas legadas respondem 308 em `next.config.mjs`.
- **Testes**: `tests/panel-access.test.mjs` cobre prioridades e negações; `tests/design-tokens.test.mjs` guarda tokens, piso de 12 px e alvos de 44 px; `tests/e2e/dashboard-shell.spec.ts` cobre colapso, persistência, título da topbar, barra inferior por perfil, Escape e overflow.


## Componentes e acessibilidade
- Usar links semânticos para navegação e botões para ações.
- Navegação por teclado, `aria-current="page"`, nome acessível para ícones, foco visível, contraste AA, alvos de toque preferencialmente 44×44 CSS px.
- Drawer/modal deve controlar foco, Escape, scroll do fundo e restauração de foco.
- Não depender de hover, gesto ou cor.
- Preservar voltar/avançar, deep links e estado de rota.
- Loading, vazio, erro, sem permissão e sucesso precisam ter estados compreensíveis.

# Base atual do produto — Dr. Douglas Vaz

**Documento canônico de produto. Atualizado em 10/11/2026.**

## Natureza do produto
Este é um sistema próprio, desenvolvido exclusivamente para a operação do consultório e a marca profissional do Dr. Douglas Vaz. **Não é SaaS, não é multi-tenant e não deve ser desenhado como plataforma para clínicas ou médicos independentes.**

Existe uma única operação clínica e um único médico responsável. O médico e o administrador são a mesma pessoa, na mesma identidade e no mesmo painel. A interface deve chamá-lo de **Painel do médico** ou **Painel profissional**, nunca oferecer alternância entre “Admin” e “Médico”.

Pode existir acesso de secretaria/equipe se isso já estiver previsto no produto e na matriz de permissões. Pacientes têm portal próprio. Não inventar outros médicos, clínicas, organizações, unidades, workspaces ou tenants.

## Duas experiências autenticadas
1. **Área profissional (médico/admin):** visão operacional única, com navegação global consistente e acesso a todas as áreas permitidas ao titular: agenda, pacientes, solicitações, conteúdos/CMS, configurações, segurança e demais módulos existentes/autorizados no projeto.
2. **Portal do paciente:** experiência separada e centrada no paciente, com acesso às próprias informações e ações disponibilizadas pelo produto. Toda consulta e mutação deve derivar o titular da sessão validada no servidor.

As áreas podem compartilhar design system e componentes, mas não devem compartilhar uma navegação confusa nem expor ações profissionais no portal do paciente.

## Navegação e responsividade
- Desktop: menu lateral persistente/colapsável, inspirado na organização e clareza do painel ZoomPro fornecido como referência. Marca no topo, grupos de navegação, ícones consistentes, item ativo evidente, possibilidade de recolher e conteúdo principal com largura e hierarquia bem resolvidas.
- Tablet: sidebar compacta ou drawer conforme a largura; preservar acesso direto e legibilidade.
- Mobile: não reduzir o sidebar desktop até ficar impraticável. Usar drawer acessível acionado por botão e/ou navegação inferior para destinos frequentes, conforme densidade de módulos. A navegação completa deve continuar disponível no drawer. Não esconder funções essenciais somente em hover.
- Paciente: aplicar a mesma lógica responsiva, mas com IA de informação mais simples e rótulos orientados a tarefas do paciente.
- A navegação deve ser dirigida por permissões no servidor e refletida na UI. Esconder link não substitui autorização na rota/API.
- Preservar rotas canônicas e URLs profundas existentes; não mover ou renomear rotas sem necessidade demonstrada e atualização dos consumidores/documentação.

## Direção de produto
Priorizar clareza, acolhimento, confiança, previsibilidade e eficiência. Não criar complexidade de SaaS. Não adicionar módulos clínicos, dados ou fluxos por suposição: primeiro verificar escopo atual e decisões registradas. A interface deve deixar claro o que é informação, o que é ação e o que exige confirmação.

## Fonte de verdade e conflitos
A identidade visual oficial está em `docs/identidade visual/` e suas regras de aplicação em `docs/VISUAL_IDENTITY.md`. A navegação está em `docs/UX_NAVIGATION.md`. Decisões atuais em `docs/DECISIONS.md` prevalecem sobre documentos históricos de fase e código legado. Antes de qualquer implementação, confirmar o comportamento real no código.

# Contexto do projeto — Dr. Douglas Vaz

## Produto
Sistema web exclusivo do consultório e da marca profissional do Dr. Douglas Vaz. Não é SaaS nem multi-tenant. Existe uma única operação clínica e um único médico responsável. **O médico e o administrador são a mesma pessoa, na mesma conta e na mesma área profissional.** Não criar seletor “Médico/Admin”, painéis duplicados, organizações, tenants ou onboarding multi-clínica.

O portal do paciente é uma experiência separada, com navegação própria e isolamento estrito dos dados do titular. A existência de secretaria/equipe deve seguir o código e `docs/PERMISSIONS.md`; não presumir novos papéis ou fluxos.

## Fonte de verdade
Leia `docs/CLINE_NEXT.md` primeiro em todo chat. Depois:
- `docs/PRODUCT_BASELINE.md`
- `docs/VISUAL_IDENTITY.md` e assets em `docs/identidade visual/`
- `docs/UX_NAVIGATION.md`
- `docs/ARCHITECTURE.md`, `DATABASE.md`, `DECISIONS.md`, `ROUTES.md`, `PERMISSIONS.md`
- `SECURITY.md`, `PRIVACY.md`, `INTEGRATIONS.md`, `LOCAL_DEVELOPMENT.md`, `PROGRESS.md`
- regras específicas em `.clinerules/`

Conflito: decisão mais recente em `DECISIONS.md` → segurança/privacidade → baseline do produto e identidade visual → arquitetura/schema/permissões/rotas → progresso → histórico de fases → código legado. Se houver divergência, investigue o código e corrija a documentação sem apagar o histórico relevante.

## Direção de interface
- Área profissional: painel único médico/admin, sidebar desktop persistente e colapsável, organização por grupos, item ativo claro; no mobile usar drawer e, quando útil, bottom navigation para destinos frequentes.
- Portal do paciente: navegação independente, simples e orientada a tarefas; sidebar desktop e adaptação mobile própria.
- Mobile é primeira classe; nunca comprimir simplesmente a interface desktop.
- Seguir identidade oficial: Azul Suave `#0367A6`, Azul Profundo `#023859`, Azul Sereno `#0378A6`, Azul Claro `#049DBF`, Cinza Neutro `#F2F2F2`; DM Sans principal e Gantari complementar. Consultar `docs/VISUAL_IDENTITY.md`.
- Não criar telas/itens de menu para recursos inexistentes. Não inventar dados médicos, credenciais, depoimentos, preços ou disponibilidade.

## Stack conhecida
Next.js App Router, React, TypeScript, Prisma/PostgreSQL, Better Auth e Vercel. Confirme o estado atual do repositório antes de alterar dependências, contratos ou arquitetura.

## Autonomia de execução
Você pode investigar e implementar as melhorias solicitadas, inclusive refatorações necessárias, correções, testes, acessibilidade, responsividade e documentação. Não se limite a sugerir quando é possível executar. Preserve segurança operacional: não exponha segredos nem dados reais; não faça deploy, publicação, alterações remotas ou operações destrutivas em dados sem autorização explícita.

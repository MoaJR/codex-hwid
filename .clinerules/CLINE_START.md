# CLINE_START — entrada obrigatória

Antes de executar qualquer tarefa:

1. Leia `docs/CLINE_NEXT.md` inteiro. Este arquivo informa o último estado e o próximo passo; atualize-o no encerramento.
2. Leia `.clinerules/00-project-context.md` e `.clinerules/13-automation-agent-safety.md`.
3. Leia as regras específicas da tarefa em `.clinerules/`.
4. Leia `docs/PRODUCT_BASELINE.md`, `docs/VISUAL_IDENTITY.md`, `docs/UX_NAVIGATION.md` e os documentos técnicos pertinentes.

## Contexto que não pode ser perdido
- Produto exclusivo do Dr. Douglas Vaz; não é SaaS e não é multi-tenant.
- Médico e administrador são a mesma pessoa, na mesma conta e no mesmo painel profissional. Não criar duas áreas nem seletor de papel para o titular.
- Portal do paciente tem navegação própria e acesso estritamente aos dados do titular.
- Painel profissional: sidebar desktop persistente/colapsável; mobile com drawer e navegação inferior quando útil.
- Portal paciente: sidebar desktop e adaptação mobile própria.
- Identidade oficial: azul `#0367A6`, `#023859`, `#0378A6`, `#049DBF`, cinza `#F2F2F2`; DM Sans principal e Gantari complementar. Assets originais em `docs/identidade visual/`.
- Não criar telas para módulos inexistentes; verificar código e decisões atuais.
- Trabalhar com autonomia nas mudanças locais solicitadas; confirmação somente para ações externas/irreversíveis e riscos reais.
- Nunca usar segredos ou dados reais de pacientes.

## Critérios de entrega
Executar os checks aplicáveis, revisar desktop e mobile, documentar alterações e atualizar `docs/CLINE_NEXT.md` com o próximo passo específico para o próximo chat.

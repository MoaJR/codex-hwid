# Arquitetura
Next.js App Router e React/TypeScript em monólito modular. app compõe UI e valida fronteiras HTTP; modules concentra casos de uso; server concentra sessão, autorização e banco; providers isola serviços externos. UI nunca importa Prisma.
Neste marco: apenas apresentação pública e healthcheck. Não existem sessões verificadas nem endpoints clínicos. Guardas server-only protegem exports de autorização e banco. Policy pura permite teste sem dependências.
Demonstração estática preservada e explicitamente separada da aplicação operacional. Futuras APIs devem validar entrada, obter ator da sessão e contexto do banco, autorizar e então executar transação com auditoria. Nenhum userId/role enviado pelo cliente é autoridade.

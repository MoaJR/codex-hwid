# Segurança operacional do agente Cline

## Autonomia permitida
Pode inspecionar arquivos de código e documentação, criar/editar testes e implementar mudanças locais dentro do escopo solicitado. Pode executar comandos locais não destrutivos e checks documentados.

## Sempre pedir confirmação antes de
- instalar/remover/atualizar dependências;
- executar migrations, seeds ou comandos que alterem banco;
- apagar arquivos/diretórios ou executar comandos destrutivos;
- alterar CI/CD, Vercel, DNS, domínios, variáveis, secrets ou integrações remotas;
- fazer commit, push, deploy, rollback ou publicar;
- alterar permissões, autenticação, RBAC, CSP ou controles de segurança;
- implementar novos módulos com dados pessoais ou clínicos;
- alterar decisões de produto ou políticas de privacidade.

## Proibido
- Ler `.env`, `.env.*`, credenciais, arquivos de sessão, tokens ou secrets.
- Usar banco/serviço de Produção, mesmo em leitura, salvo autorização separada e procedimento seguro fora do Cline.
- Baixar env de Produção (`vercel env pull`).
- Executar `prisma migrate reset`, `db push`, `DROP`, `TRUNCATE`, `DELETE` amplo ou equivalentes sem confirmação explícita e prova de alvo local descartável.
- Criar usuários/senhas padrão, fixtures com dados reais ou bypass de autorização.
- Desativar testes, lint, typecheck, CSP, rate limit ou validações para contornar falhas.
- Fazer scraping, chamadas externas ou enviar conteúdo do projeto a serviços externos sem autorização.
- Executar Playwright/E2E contra host que não seja `localhost`, `127.0.0.1` ou `::1`, ou com identidades que não sejam fictícias.

## Higiene de comandos
- Antes de executar comandos de banco, verifique que a URL aponta exclusivamente para `localhost`, `127.0.0.1` ou `::1`, sem exibir credenciais.
- Nunca imprimir conteúdo de `.env*`; não usar shell tracing em scripts que possam tocar segredos.
- Prefira `npm ci` ao instalar com resolução variável, mas peça aprovação antes de instalação.
- Não executar `npm run build` se ele puder acionar pipeline de produção; use `npm run build:next` localmente.
- Não defina `VERCEL_ENV=production` no ambiente local.
- Se o alvo não puder ser comprovado como local, não execute a operação.

## Falhas e incidentes
Se um comando revelar possível segredo, pare e não replique o valor na resposta. Se detectar risco de dados reais ou acesso remoto, interrompa a ação e solicite orientação.

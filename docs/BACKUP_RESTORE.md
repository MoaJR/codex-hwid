# Backup, restauração e continuidade (D5)

Decisão aprovada pelo responsável em 10/11/2026: backup diário gerenciado pelo provedor do
banco, retenção de 30 dias, **RPO 24h / RTO 24h** e teste de restauração trimestral em banco
descartável. O agente nunca executa restauração sobre produção.

## Procedimento executado (ambiente local)

Banco de origem `douglas_vaz_dev` em `127.0.0.1:5432` (PostgreSQL 17 em container), destino
`douglas_vaz_restore_test` — descartável e removido ao final.

```bash
# 1. cópia lógica
docker exec douglas-vaz-postgres pg_dump -U postgres -d douglas_vaz_dev \
  --no-owner --no-privileges > /tmp/hwid-backup.sql

# 2. banco descartável
docker exec douglas-vaz-postgres psql -U postgres -c 'CREATE DATABASE douglas_vaz_restore_test'

# 3. restauração
docker exec -i douglas-vaz-postgres psql -U postgres -d douglas_vaz_restore_test -q < /tmp/hwid-backup.sql

# 4. conferência de integridade por contagem

# 5. descarte
docker exec douglas-vaz-postgres psql -U postgres -c 'DROP DATABASE douglas_vaz_restore_test'
```

## Evidência da execução — 10/11/2026

| Etapa | Resultado |
| --- | --- |
| `pg_dump` | concluído em 0,52 s, 90.853 bytes, saída 0 |
| criação do banco descartável | ok |
| restauração | concluída em 1,21 s, saída 0, nenhum erro no log |
| descarte do banco de teste | ok, restou apenas `douglas_vaz_dev` |

Contagens idênticas entre origem e destino após a restauração:

| Métrica | Origem | Restaurado |
| --- | --- | --- |
| tabelas | 21 | 21 |
| migrations aplicadas | 5 | 5 |
| usuários | 4 | 4 |
| consultas | 8 | 8 |
| eventos de consulta | 24 | 24 |
| eventos de auditoria | 97 | 97 |
| artigos | 4 | 4 |
| sessões | 27 | 27 |

Identidades e dados são fictícios. Nenhum identificador, e-mail, horário individual ou
credencial foi impresso pela conferência — apenas contagens agregadas.

## O que este teste não cobre

- Backup gerenciado e retenção de 30 dias: são configuração do provedor (Vercel/Prisma Postgres)
  em `iad1`, fora do escopo do agente e sujeitos a D4.
- Restauração de produção: exige janela autorizada pelo responsável e execução fora do agente.
- Próxima execução prevista: trimestral, registrada neste documento com data e resultado.

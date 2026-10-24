# Fase 5 — Agenda operacional

## Marco 5A: operação interna controlada

Objetivo: substituir horários ilustrativos por uma agenda persistente para o médico e a secretaria, sem abrir coleta pública de dados pessoais antes da revisão operacional de privacidade.

O recorte usa uma clínica e um médico. Pacientes precisam ser provisionados pelo fluxo confiável existente. `/agendar` permanece demonstrativo; não existe cadastro público, pedido anônimo, pagamento, motivo clínico, upload, lembrete ou integração de mensagens.

### Dados e integridade

- `AppointmentService` mantém catálogo controlado, modalidade, duração, intervalo e buffers.
- `AvailabilityRule` guarda disponibilidade semanal em `America/Sao_Paulo`.
- `AvailabilityException` representa uma abertura extra ou bloqueio explícito.
- `Appointment` preserva uma fotografia do serviço, horários UTC, intervalo bloqueado com buffers, fuso, estado, versão e chave de idempotência.
- `AppointmentEvent` registra criação, reagendamento, cancelamento e estados futuros sem texto livre.
- `ApiRateLimit` implementa limite compartilhado por usuário sem reutilizar a tabela interna do Better Auth.

O PostgreSQL usa `btree_gist` e duas constraints de exclusão. Uma impede sobreposição do médico considerando buffers; a outra impede sobreposição do paciente. Intervalos são `[início, fim)`, portanto horários realmente contíguos são permitidos. Consultas canceladas liberam o período; os registros e eventos não são apagados.

As quatro migrations foram aplicadas do zero em PostgreSQL 17 descartável. Os testes de banco rejeitaram serviço de outro médico, choque com buffer e choque do paciente entre médicos; cancelamento liberou o período. Um erro forçado antes do `COMMIT` confirmou rollback atômico da migration.

Em produção, o deployment `dpl_DPSck3iYscPuyeoHvATp1QytTok8` aplicou a migration, confirmou 20/20 tabelas sem colunas, constraints ou índices ausentes e inseriu os quatro serviços iniciais. O domínio principal respondeu sem erros de runtime; acesso anônimo à agenda terminou no login.

### Segurança

Médico acessa somente sua agenda. Secretaria acessa a agenda da clínica única; a resolução falha se houver zero ou mais de um médico. Administrador não recebe agenda por herança. Toda operação de equipe exige MFA da sessão, origem canônica exata, JSON estrito com até 8 KiB, campos conhecidos e limite de dez mutações por minuto. Leitura da API é limitada a sessenta requisições por minuto.

Criação e reagendamento recebem duração, buffers e modalidade do servidor. A transação adquire lock por médico, recalcula disponibilidade, grava consulta, evento e auditoria e depende também da constraint do banco. Conflito de horário retorna `409` sem detalhes do PostgreSQL. Criação exige `Idempotency-Key` UUID; repetição do mesmo pedido retorna a mesma consulta.

Auditoria contém ação, resultado, origem, ator, titular, tipo e UUID do recurso. Não contém nome, e-mail, contato, motivo, diagnóstico, corpo HTTP ou IP bruto.

### Interface e rotas

- `/medico/agenda`: visão protegida da janela de 31 dias, regras, exceções e consultas.
- `GET /api/medico/agenda`: leitura protegida da agenda.
- `POST /api/medico/appointments`: criação para paciente provisionado.
- `PATCH /api/medico/appointments/[id]`: reagendamento com versão otimista.
- `POST /api/medico/appointments/[id]/cancel`: cancelamento sem exclusão física.
- `POST /api/medico/availability`: regra semanal, bloqueio ou abertura extra.
- `DELETE /api/medico/availability/[id]`: desativação de regra ou remoção de exceção auditada.

### Limites para a validação

Usar somente pacientes fictícios. A política de privacidade ainda precisa definir controlador, bases legais, retenção, subprocessadores, transferência internacional, direitos, backups e resposta a incidentes antes de qualquer uso real. O banco está na região `iad1`, o que também exige análise da operação e dos contratos.

### Próximo marco

Depois da validação interna e da revisão de privacidade, a Fase 5B poderá oferecer horários públicos sem detalhes de ocupação e confirmação somente para paciente autenticado. Pedido anônimo, se aprovado, será um recurso separado de consulta e não prometerá reserva.

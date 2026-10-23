# Banco inicial
PostgreSQL + Prisma; proposta em prisma/schema.prisma. User 1:N UserRole; User 1:0..1 Patient/Doctor; Patient N:M Doctor via CareAssignment, com endedAt para revogação. Patient 1:N MoodEntry.
UUID, e-mail único, foreign keys Restrict, índice paciente/data e profissional/vínculo ativo. Antes de migrations: validar schema, revisar retenção e consentimentos e adicionar constraint score BETWEEN 1 AND 10. Não há campo livre de conteúdo clínico neste marco.
Agendamento futuro: disponibilidade, duração, buffer e bloqueios; impedir sobreposição com constraint de exclusão PostgreSQL e transação. Unicidade somente de horário inicial não basta. Prontuários versionados, arquivos privados e auditoria serão adicionados nas fases correspondentes.

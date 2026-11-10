-- Fase 5B: solicitação de horário pelo paciente autenticado.
-- Migration puramente aditiva. A tabela "Appointment", seus enums e as duas
-- exclusion constraints GiST da 5A permanecem exatamente como estão: a
-- solicitação não reserva o intervalo, e a garantia final continua sendo o lock
-- por médico mais a constraint na criação do "Appointment".

BEGIN;

CREATE TYPE "AppointmentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');

CREATE TABLE "AppointmentRequest" (
  "id" UUID NOT NULL,
  "doctorId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "serviceId" UUID NOT NULL,
  "idempotencyKey" UUID NOT NULL,
  "serviceLabel" TEXT NOT NULL,
  "mode" "AppointmentMode" NOT NULL,
  "startsAt" TIMESTAMPTZ(3) NOT NULL,
  "endsAt" TIMESTAMPTZ(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "bufferBeforeMinutes" INTEGER NOT NULL,
  "bufferAfterMinutes" INTEGER NOT NULL,
  "timeZone" TEXT NOT NULL,
  "status" "AppointmentRequestStatus" NOT NULL DEFAULT 'PENDING',
  "version" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "submittedByUserId" UUID NOT NULL,
  "decidedByUserId" UUID,
  "decidedAt" TIMESTAMPTZ(3),
  "appointmentId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppointmentRequest_idempotencyKey_key" ON "AppointmentRequest"("idempotencyKey");
CREATE UNIQUE INDEX "AppointmentRequest_appointmentId_key" ON "AppointmentRequest"("appointmentId");
CREATE INDEX "AppointmentRequest_status_startsAt_idx" ON "AppointmentRequest"("status","startsAt");
CREATE INDEX "AppointmentRequest_patientId_startsAt_idx" ON "AppointmentRequest"("patientId","startsAt");
CREATE INDEX "AppointmentRequest_doctorId_startsAt_idx" ON "AppointmentRequest"("doctorId","startsAt");

-- Uma única solicitação pendente por horário e por paciente. Sem estes índices
-- parciais, duas requisições concorrentes poderiam criar pedidos duplicados,
-- porque a solicitação não grava "Appointment" e portanto não passa pelas GiST.
CREATE UNIQUE INDEX "AppointmentRequest_doctor_pending_key" ON "AppointmentRequest"("doctorId","startsAt") WHERE "status" = 'PENDING';
CREATE UNIQUE INDEX "AppointmentRequest_patient_pending_key" ON "AppointmentRequest"("patientId") WHERE "status" = 'PENDING';

ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_serviceId_doctorId_fkey" FOREIGN KEY ("serviceId","doctorId") REFERENCES "AppointmentService"("id","doctorId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_decidedByUserId_fkey" FOREIGN KEY ("decidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_period_check" CHECK ("endsAt" > "startsAt");
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_expiry_check" CHECK ("expiresAt" > "createdAt");

COMMIT;

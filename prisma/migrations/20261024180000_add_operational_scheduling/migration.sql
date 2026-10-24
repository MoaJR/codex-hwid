BEGIN;

CREATE TYPE "AppointmentMode" AS ENUM ('IN_PERSON', 'ONLINE');
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');
CREATE TYPE "AvailabilityExceptionKind" AS ENUM ('AVAILABLE', 'BLOCKED');
CREATE TYPE "AppointmentEventType" AS ENUM ('CREATED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Doctor" ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_time_zone_check" CHECK ("timeZone" = 'America/Sao_Paulo');

CREATE TABLE "AppointmentService" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doctorId" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "mode" "AppointmentMode" NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "slotIntervalMinutes" INTEGER NOT NULL DEFAULT 30,
  "bufferBeforeMinutes" INTEGER NOT NULL DEFAULT 0,
  "bufferAfterMinutes" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AppointmentService_code_check" CHECK ("code" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT "AppointmentService_name_check" CHECK (length(btrim("name")) BETWEEN 2 AND 120),
  CONSTRAINT "AppointmentService_duration_check" CHECK ("durationMinutes" BETWEEN 15 AND 480),
  CONSTRAINT "AppointmentService_interval_check" CHECK ("slotIntervalMinutes" BETWEEN 5 AND 240),
  CONSTRAINT "AppointmentService_buffers_check" CHECK (
    "bufferBeforeMinutes" BETWEEN 0 AND 240 AND "bufferAfterMinutes" BETWEEN 0 AND 240
  )
);

CREATE TABLE "AvailabilityRule" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doctorId" UUID NOT NULL,
  "weekday" INTEGER NOT NULL,
  "startMinute" INTEGER NOT NULL,
  "endMinute" INTEGER NOT NULL,
  "validFrom" DATE NOT NULL,
  "validUntil" DATE,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AvailabilityRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AvailabilityRule_weekday_check" CHECK ("weekday" BETWEEN 1 AND 7),
  CONSTRAINT "AvailabilityRule_minutes_check" CHECK (
    "startMinute" BETWEEN 0 AND 1439 AND "endMinute" BETWEEN 1 AND 1440 AND "startMinute" < "endMinute"
  ),
  CONSTRAINT "AvailabilityRule_dates_check" CHECK ("validUntil" IS NULL OR "validUntil" >= "validFrom")
);

CREATE TABLE "AvailabilityException" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doctorId" UUID NOT NULL,
  "kind" "AvailabilityExceptionKind" NOT NULL,
  "startsAt" TIMESTAMPTZ(3) NOT NULL,
  "endsAt" TIMESTAMPTZ(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AvailabilityException_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AvailabilityException_period_check" CHECK ("endsAt" > "startsAt")
);

CREATE TABLE "Appointment" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doctorId" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "serviceId" UUID NOT NULL,
  "idempotencyKey" UUID NOT NULL,
  "serviceLabel" TEXT NOT NULL,
  "mode" "AppointmentMode" NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
  "startsAt" TIMESTAMPTZ(3) NOT NULL,
  "endsAt" TIMESTAMPTZ(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "bufferBeforeMinutes" INTEGER NOT NULL,
  "bufferAfterMinutes" INTEGER NOT NULL,
  "blockedFrom" TIMESTAMPTZ(3) NOT NULL,
  "blockedUntil" TIMESTAMPTZ(3) NOT NULL,
  "timeZone" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdByUserId" UUID NOT NULL,
  "updatedByUserId" UUID,
  "cancelledByUserId" UUID,
  "cancelledAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Appointment_service_label_check" CHECK (length(btrim("serviceLabel")) BETWEEN 2 AND 120),
  CONSTRAINT "Appointment_duration_check" CHECK ("durationMinutes" BETWEEN 15 AND 480),
  CONSTRAINT "Appointment_buffers_check" CHECK (
    "bufferBeforeMinutes" BETWEEN 0 AND 240 AND "bufferAfterMinutes" BETWEEN 0 AND 240
  ),
  CONSTRAINT "Appointment_end_check" CHECK (
    "endsAt" = "startsAt" + ("durationMinutes" * INTERVAL '1 minute')
  ),
  CONSTRAINT "Appointment_blocked_period_check" CHECK (
    "blockedFrom" = "startsAt" - ("bufferBeforeMinutes" * INTERVAL '1 minute')
    AND "blockedUntil" = "endsAt" + ("bufferAfterMinutes" * INTERVAL '1 minute')
    AND "blockedFrom" < "blockedUntil"
  ),
  CONSTRAINT "Appointment_time_zone_check" CHECK ("timeZone" = 'America/Sao_Paulo'),
  CONSTRAINT "Appointment_version_check" CHECK ("version" >= 1),
  CONSTRAINT "Appointment_cancelled_fields_check" CHECK (
    ("status" = 'CANCELLED' AND "cancelledAt" IS NOT NULL)
    OR ("status" <> 'CANCELLED' AND "cancelledAt" IS NULL)
  )
);

CREATE TABLE "AppointmentEvent" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "appointmentId" UUID NOT NULL,
  "type" "AppointmentEventType" NOT NULL,
  "actorUserId" UUID,
  "previousStartsAt" TIMESTAMPTZ(3),
  "previousEndsAt" TIMESTAMPTZ(3),
  "nextStartsAt" TIMESTAMPTZ(3),
  "nextEndsAt" TIMESTAMPTZ(3),
  "previousStatus" "AppointmentStatus",
  "nextStatus" "AppointmentStatus",
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApiRateLimit" (
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApiRateLimit_pkey" PRIMARY KEY ("key"),
  CONSTRAINT "ApiRateLimit_count_check" CHECK ("count" >= 1)
);

CREATE UNIQUE INDEX "AppointmentService_doctorId_code_key" ON "AppointmentService"("doctorId", "code");
CREATE UNIQUE INDEX "AppointmentService_id_doctorId_key" ON "AppointmentService"("id", "doctorId");
CREATE INDEX "AppointmentService_doctorId_active_idx" ON "AppointmentService"("doctorId", "active");
CREATE INDEX "AvailabilityRule_doctorId_weekday_active_idx" ON "AvailabilityRule"("doctorId", "weekday", "active");
CREATE INDEX "AvailabilityRule_doctorId_validFrom_validUntil_idx" ON "AvailabilityRule"("doctorId", "validFrom", "validUntil");
CREATE INDEX "AvailabilityException_doctorId_startsAt_idx" ON "AvailabilityException"("doctorId", "startsAt");
CREATE UNIQUE INDEX "Appointment_idempotencyKey_key" ON "Appointment"("idempotencyKey");
CREATE INDEX "Appointment_doctorId_startsAt_idx" ON "Appointment"("doctorId", "startsAt");
CREATE INDEX "Appointment_patientId_startsAt_idx" ON "Appointment"("patientId", "startsAt");
CREATE INDEX "Appointment_status_startsAt_idx" ON "Appointment"("status", "startsAt");
CREATE INDEX "AppointmentEvent_appointmentId_occurredAt_idx" ON "AppointmentEvent"("appointmentId", "occurredAt");
CREATE INDEX "AppointmentEvent_actorUserId_occurredAt_idx" ON "AppointmentEvent"("actorUserId", "occurredAt");
CREATE INDEX "ApiRateLimit_expiresAt_idx" ON "ApiRateLimit"("expiresAt");

ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AvailabilityRule" ADD CONSTRAINT "AvailabilityRule_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AvailabilityException" ADD CONSTRAINT "AvailabilityException_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_doctorId_fkey" FOREIGN KEY ("serviceId","doctorId") REFERENCES "AppointmentService"("id","doctorId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppointmentEvent" ADD CONSTRAINT "AppointmentEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppointmentEvent" ADD CONSTRAINT "AppointmentEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctor_no_overlap" EXCLUDE USING gist (
  "doctorId" WITH =,
  tstzrange("blockedFrom","blockedUntil",'[)') WITH &&
) WHERE ("status" <> 'CANCELLED');

ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patient_no_overlap" EXCLUDE USING gist (
  "patientId" WITH =,
  tstzrange("startsAt", "endsAt", '[)') WITH &&
) WHERE ("status" <> 'CANCELLED');

COMMIT;

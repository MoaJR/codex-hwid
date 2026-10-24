import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const migrationUrl=new URL('../prisma/migrations/20261024180000_add_operational_scheduling/migration.sql',import.meta.url);

test('migration da agenda protege integridade, concorrência e histórico',async()=>{
  const sql=await readFile(migrationUrl,'utf8');
  assert.match(sql,/^BEGIN;/);
  assert.match(sql,/COMMIT;\s*$/);
  assert.match(sql,/CREATE EXTENSION IF NOT EXISTS btree_gist/);
  assert.match(sql,/Appointment_doctor_no_overlap[\s\S]*EXCLUDE USING gist/);
  assert.match(sql,/Appointment_patient_no_overlap[\s\S]*EXCLUDE USING gist/);
  assert.match(sql,/"blockedFrom" TIMESTAMPTZ\(3\) NOT NULL/);
  assert.match(sql,/"blockedUntil" TIMESTAMPTZ\(3\) NOT NULL/);
  assert.match(sql,/Appointment_blocked_period_check/);
  assert.match(sql,/"blockedFrom" = "startsAt" - \("bufferBeforeMinutes" \* INTERVAL '1 minute'\)/);
  assert.match(sql,/tstzrange\("blockedFrom","blockedUntil",'\[\)'\)/);
  assert.match(sql,/WHERE \("status" <> 'CANCELLED'\)/);
  assert.match(sql,/Appointment_end_check/);
  assert.match(sql,/Appointment_cancelled_fields_check/);
  assert.match(sql,/Appointment_idempotencyKey_key/);
  assert.match(sql,/Appointment_serviceId_doctorId_fkey[\s\S]*\("serviceId","doctorId"\)[\s\S]*\("id","doctorId"\)/);
  assert.match(sql,/AppointmentEvent_appointmentId_fkey[\s\S]*ON DELETE RESTRICT/);
  assert.match(sql,/ApiRateLimit_count_check/);
  assert.match(sql,/Doctor_time_zone_check[\s\S]*America\/Sao_Paulo/);
});

test('schema declara vinte modelos e snapshot de agenda',async()=>{
  const schema=await readFile(new URL('../prisma/schema.prisma',import.meta.url),'utf8');
  assert.equal((schema.match(/^model /gm)??[]).length,20);
  for(const model of ['AppointmentService','AvailabilityRule','AvailabilityException','Appointment','AppointmentEvent','ApiRateLimit'])assert.match(schema,new RegExp(`model ${model} \\{`));
  assert.match(schema,/startsAt\s+DateTime\s+@db\.Timestamptz\(3\)/);
  assert.match(schema,/serviceLabel\s+String/);
  assert.match(schema,/bufferAfterMinutes\s+Int/);
  assert.match(schema,/blockedFrom\s+DateTime\s+@db\.Timestamptz\(3\)/);
});

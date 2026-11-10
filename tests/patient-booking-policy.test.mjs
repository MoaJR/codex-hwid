import test from 'node:test';
import assert from 'node:assert/strict';
import {can} from '../src/server/authorization/policy.mjs';

// Fase 5B: o paciente solicita horário e cancela o próprio atendimento. As
// permissões são separadas de `appointment.write` para não conceder
// reagendamento nem agenda da clínica por consequência.
const patientId='paciente-ficticio';
const patient={userId:patientId,roles:['PATIENT']};
const own={patientUserId:patientId};
const other={patientUserId:'outro-paciente'};
const scheduleScope={appointmentDoctorUserId:'medico-ficticio'};
const patientPermissions=['appointment.request','appointment.request.cancel','appointment.cancel'];

test('paciente solicita, retira e cancela somente no próprio escopo',()=>{
  for(const permission of patientPermissions){
    assert.equal(can(patient,permission,own),true,`PATIENT deveria acessar ${permission}`);
    assert.equal(can(patient,permission,other),false,`PATIENT não deveria acessar ${permission} de outro titular`);
    assert.equal(can(patient,permission,scheduleScope),false,`${permission} não pode vir do escopo da agenda`);
    assert.equal(can(patient,permission,{}),false,`${permission} exige titularidade explícita`);
  }
});

test('paciente continua sem mutação de equipe',()=>{
  for(const permission of ['appointment.write','availability.read','availability.write','patient.read','medical_record.read','medical_record.write'])assert.equal(can(patient,permission,own),false,`PATIENT não deveria acessar ${permission}`);
});

test('equipe e administração não herdam as permissões do paciente',()=>{
  for(const role of ['DOCTOR','SECRETARY','ADMIN']){
    const actor={userId:'equipe',roles:[role]};
    for(const permission of patientPermissions)assert.equal(can(actor,permission,own),false,`${role} não deveria acessar ${permission}`);
  }
});

test('as permissões novas exigem identidade resolvida no servidor',()=>{
  for(const permission of patientPermissions){
    assert.equal(can(null,permission,own),false);
    assert.equal(can({userId:'',roles:['PATIENT']},permission,own),false);
    assert.equal(can({userId:patientId,roles:[]},permission,own),false);
    assert.equal(can({userId:patientId,roles:['OWNER']},permission,own),false);
  }
});

test('conta com PATIENT e outro papel mantém apenas a união explícita',()=>{
  const actor={userId:patientId,roles:['PATIENT','SECRETARY']};
  assert.equal(can(actor,'appointment.request',own),true);
  assert.equal(can(actor,'appointment.request',{}),false);
  // `appointment.write` vem de SECRETARY (clínica única), nunca do papel PATIENT.
  assert.equal(can(actor,'appointment.write',own),true);
  assert.equal(can({userId:patientId,roles:['PATIENT']},'appointment.write',own),false);
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {can,authorize,AuthorizationError} from '../src/server/authorization/policy.mjs';
const patient={userId:'patient-a',roles:['PATIENT']};
test('anonymous and unknown permissions are denied',()=>{assert.equal(can(null,'mood.read',{}),false);assert.equal(can(patient,'unknown',{patientUserId:'patient-a'}),false)});
test('patient can write own diary but cannot read another diary',()=>{assert.equal(can(patient,'mood.write',{patientUserId:'patient-a'}),true);assert.equal(can(patient,'mood.read',{patientUserId:'patient-b'}),false)});
test('doctor requires explicit care assignment',()=>{const actor={userId:'doctor-a',roles:['DOCTOR']};assert.equal(can(actor,'medical_record.write',{assignedDoctorUserIds:['doctor-a']}),true);assert.equal(can(actor,'medical_record.read',{assignedDoctorUserIds:['doctor-b']}),false)});
test('secretary and admin have no implicit clinical access',()=>{for(const role of ['SECRETARY','ADMIN'])assert.equal(can({userId:'staff',roles:[role]},'medical_record.read',{assignedDoctorUserIds:['staff']}),false)});
test('patient cannot change medication or clinical notes',()=>{for(const permission of ['medication.write','medical_record.write','permission.manage'])assert.equal(can(patient,permission,{patientUserId:'patient-a'}),false)});
test('authorization throws a safe domain error',()=>assert.throws(()=>authorize(patient,'medical_record.read',{}),AuthorizationError));
test('doctor cannot infer assignment from missing scope',()=>assert.equal(can({userId:'d',roles:['DOCTOR']},'patient.read',{}),false));
test('agenda própria não concede acesso clínico ao médico',()=>{
  const actor={userId:'doctor-a',roles:['DOCTOR']};
  const schedule={appointmentDoctorUserId:'doctor-a'};
  assert.equal(can(actor,'appointment.read',schedule),true);
  assert.equal(can(actor,'appointment.write',schedule),true);
  assert.equal(can(actor,'availability.write',schedule),true);
  assert.equal(can(actor,'appointment.write',{appointmentDoctorUserId:'doctor-b'}),false);
  assert.equal(can(actor,'medical_record.read',schedule),false);
});
test('secretaria opera agenda, paciente só lê a própria e admin não herda acesso',()=>{
  const scope={appointmentDoctorUserId:'doctor-a'};
  assert.equal(can({userId:'secretary',roles:['SECRETARY']},'appointment.write',scope),true);
  assert.equal(can({userId:'secretary',roles:['SECRETARY']},'availability.write',scope),false);
  assert.equal(can(patient,'appointment.read',{patientUserId:'patient-a'}),true);
  assert.equal(can(patient,'appointment.write',{patientUserId:'patient-a'}),false);
  assert.equal(can({userId:'admin',roles:['ADMIN']},'appointment.read',scope),false);
});
test('conteúdo editorial exige equipe autorizada e publicação clínica exige médico',()=>{
  assert.equal(can({userId:'d',roles:['DOCTOR']},'content.write'),true);
  assert.equal(can({userId:'d',roles:['DOCTOR']},'content.publish'),true);
  assert.equal(can({userId:'a',roles:['ADMIN']},'content.write'),true);
  assert.equal(can({userId:'a',roles:['ADMIN']},'content.submit_review'),true);
  assert.equal(can({userId:'a',roles:['ADMIN']},'content.publish'),false);
  assert.equal(can({userId:'s',roles:['SECRETARY']},'content.read'),false);
  assert.equal(can(patient,'content.read'),false);
});

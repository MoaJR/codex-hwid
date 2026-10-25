import test from 'node:test';
import assert from 'node:assert/strict';
import {labelsForRoles,modulesForRoles} from '../src/modules/account/panel-access.mjs';
import {can} from '../src/server/authorization/policy.mjs';

// Matriz de aceite da bateria autenticada da Fase 5A. Cada linha reflete o que
// deve ser observado no E2E de DOCTOR, SECRETARY, PATIENT e ADMIN. As identidades
// abaixo são fictícias: o teste valida apenas política pura e mapa de módulos.
const userId='conta-ficticia';
const otherPatient='outro-paciente';
const otherDoctor='outro-medico';
const clinicDoctor='medico-da-clinica';
const actorFor=role=>({userId,roles:role?[role]:[]});
const accepts=(role,permission,resource={})=>can(actorFor(role),permission,resource);
const moduleIds=roles=>modulesForRoles(roles).map(module=>module.id);

const expectedAccess={
  PATIENT:{modules:['patient','account'],label:'Paciente'},
  DOCTOR:{modules:['schedule','content','account'],label:'Médico'},
  SECRETARY:{modules:['schedule','account'],label:'Secretaria'},
  ADMIN:{modules:['content','admin','account'],label:'Administrador'},
};
const roles=Object.keys(expectedAccess);

const ownPatient={patientUserId:userId};
const ownSchedule={appointmentDoctorUserId:userId};
const clinicSchedule={appointmentDoctorUserId:clinicDoctor};
const everyScope={patientUserId:userId,appointmentDoctorUserId:userId,assignedDoctorUserIds:[userId]};

test('cada papel recebe exatamente os módulos e o rótulo esperados',()=>{
  assert.deepEqual(roles.sort(),['ADMIN','DOCTOR','PATIENT','SECRETARY']);
  for(const role of roles){
    const expected=expectedAccess[role];
    assert.deepEqual(moduleIds([role]),expected.modules,`módulos de ${role}`);
    assert.deepEqual(labelsForRoles([role]),[expected.label],`rótulo de ${role}`);
  }
});

test('paciente lê somente a própria agenda e não recebe mutação ou área de equipe',()=>{
  const allow=[['appointment.read',ownPatient]];
  const deny=[
    ['appointment.read',{patientUserId:otherPatient}],
    ['appointment.read',ownSchedule],
    ['appointment.write',ownPatient],
    ['availability.read',ownPatient],
    ['availability.write',ownPatient],
    ['content.read',everyScope],
    ['content.write',everyScope],
    ['content.publish',everyScope],
    ['settings.manage',everyScope],
    ['user.manage',everyScope],
    ['patient.read',ownPatient],
    ['medical_record.read',everyScope],
    ['audit.read',everyScope],
  ];
  for(const [permission,resource] of allow)assert.equal(accepts('PATIENT',permission,resource),true,`PATIENT deveria acessar ${permission}`);
  for(const [permission,resource] of deny)assert.equal(accepts('PATIENT',permission,resource),false,`PATIENT não deveria acessar ${permission}`);
});

test('médico opera apenas a própria agenda e mantém o domínio editorial',()=>{
  const allow=[
    ['appointment.read',ownSchedule],
    ['appointment.write',ownSchedule],
    ['availability.read',ownSchedule],
    ['availability.write',ownSchedule],
    ['content.read',{}],
    ['content.write',{}],
    ['content.submit_review',{}],
    ['content.publish',{}],
  ];
  const deny=[
    ['appointment.read',{appointmentDoctorUserId:otherDoctor}],
    ['appointment.write',{appointmentDoctorUserId:otherDoctor}],
    ['availability.write',{appointmentDoctorUserId:otherDoctor}],
    ['appointment.read',ownPatient],
    ['patient.read',ownSchedule],
    ['medical_record.read',ownSchedule],
    ['settings.manage',everyScope],
    ['user.manage',everyScope],
    ['audit.read',everyScope],
  ];
  for(const [permission,resource] of allow)assert.equal(accepts('DOCTOR',permission,resource),true,`DOCTOR deveria acessar ${permission}`);
  for(const [permission,resource] of deny)assert.equal(accepts('DOCTOR',permission,resource),false,`DOCTOR não deveria acessar ${permission}`);
});

test('secretaria opera a agenda da clínica sem disponibilidade, conteúdo ou prontuário',()=>{
  const allow=[
    ['appointment.read',clinicSchedule],
    ['appointment.write',clinicSchedule],
    ['patient.demographics.read',clinicSchedule],
  ];
  const deny=[
    ['availability.read',clinicSchedule],
    ['availability.write',clinicSchedule],
    ['content.read',{}],
    ['content.write',{}],
    ['content.publish',{}],
    ['settings.manage',everyScope],
    ['user.manage',everyScope],
    ['patient.read',clinicSchedule],
    ['medical_record.read',{assignedDoctorUserIds:[userId]}],
    ['mood.read',ownPatient],
    ['audit.read',{}],
  ];
  for(const [permission,resource] of allow)assert.equal(accepts('SECRETARY',permission,resource),true,`SECRETARY deveria acessar ${permission}`);
  for(const [permission,resource] of deny)assert.equal(accepts('SECRETARY',permission,resource),false,`SECRETARY não deveria acessar ${permission}`);
});


test('administrador gerencia conteúdo e configurações sem herdar agenda, paciente ou publicação',()=>{
  const allow=[
    ['settings.manage',{}],
    ['content.read',{}],
    ['content.write',{}],
    ['content.submit_review',{}],
    ['audit.read',{}],
  ];
  const deny=[
    ['content.publish',{}],
    ['appointment.read',everyScope],
    ['appointment.write',everyScope],
    ['availability.write',everyScope],
    ['patient.read',everyScope],
    ['medical_record.read',everyScope],
    ['mood.read',everyScope],
  ];
  for(const [permission,resource] of allow)assert.equal(accepts('ADMIN',permission,resource),true,`ADMIN deveria acessar ${permission}`);
  for(const [permission,resource] of deny)assert.equal(accepts('ADMIN',permission,resource),false,`ADMIN não deveria acessar ${permission}`);
});

test('papel ausente, desconhecido ou permissão não listada negam por padrão',()=>{
  for(const permission of ['appointment.read','content.read','settings.manage','medical_record.read']){
    assert.equal(can(null,permission,everyScope),false,`anônimo não deveria acessar ${permission}`);
    assert.equal(can({userId,roles:[]},permission,everyScope),false,`sem papel não deveria acessar ${permission}`);
    assert.equal(can({userId,roles:['OWNER']},permission,everyScope),false,`papel desconhecido não deveria acessar ${permission}`);
    assert.equal(can({userId:'',roles:['ADMIN']},permission,everyScope),false,`ator sem identidade não deveria acessar ${permission}`);
  }
  for(const role of roles)assert.equal(accepts(role,'permission.unknown',everyScope),false,`${role} não deveria acessar permissão desconhecida`);
  assert.deepEqual(moduleIds([]),[]);
  assert.deepEqual(moduleIds(['OWNER']),[]);
  assert.deepEqual(labelsForRoles(undefined),[]);
});

test('conta com vários papéis recebe a união dos módulos',()=>{
  assert.deepEqual(moduleIds(['DOCTOR','ADMIN']),['schedule','content','admin','account']);
  assert.deepEqual(moduleIds(['PATIENT','SECRETARY']),['patient','schedule','account']);
  assert.deepEqual(moduleIds(['PATIENT','ROLE_DESCONHECIDO']),['patient','account']);
});


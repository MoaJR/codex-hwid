import test from 'node:test';
import assert from 'node:assert/strict';
import {labelsForRoles,modulesForRoles} from '../src/modules/account/panel-access.mjs';

function moduleIds(roles){return modulesForRoles(roles).map(module=>module.id);}

test('painel apresenta somente os módulos autorizados para cada papel',()=>{
  assert.deepEqual(moduleIds(['PATIENT']),['patient','account']);
  assert.deepEqual(moduleIds(['DOCTOR']),['schedule','content','account']);
  assert.deepEqual(moduleIds(['SECRETARY']),['schedule','account']);
  assert.deepEqual(moduleIds(['ADMIN']),['content','admin','account']);
});

test('contas com múltiplos papéis recebem a união sem módulos duplicados',()=>{
  assert.deepEqual(moduleIds(['DOCTOR','ADMIN','ADMIN']),['schedule','content','admin','account']);
  assert.deepEqual(labelsForRoles(['DOCTOR','ADMIN','DOCTOR']),['Médico','Administrador']);
});

test('papéis ausentes ou desconhecidos não liberam módulos',()=>{
  assert.deepEqual(moduleIds(undefined),[]);
  assert.deepEqual(moduleIds(['UNKNOWN']),[]);
  assert.deepEqual(labelsForRoles(['UNKNOWN']),[]);
});

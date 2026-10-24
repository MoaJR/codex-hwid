import test from 'node:test';
import assert from 'node:assert/strict';
import {getReconciliationDecision} from '../scripts/reconcile-initial-migration.mjs';

const targetChecksum='target-checksum';
const baseline={
  name:'20261023120000_init',
  checksum:'192e90c027ea987d2d22dfdc2a0c0c69ba3f4aa8830c51f0950bc132fa5ca0bd',
  finished:true,
  rolledBack:false,
  appliedSteps:1,
};

function exactReport(target){
  return {
    operation:'SCHEMA_METADATA_READ_ONLY',
    status:'connected',
    expectedTableCount:11,
    expectedTables:Object.fromEntries(Array.from({length:11},(_,index)=>[`table-${index}`,true])),
    missingColumns:{User:[]},
    extraColumns:{User:[]},
    missingConstraints:[],
    missingIndexes:[],
    moodScoreCheck:'CHECK (((score >= 1) AND (score <= 10)))',
    roleLabels:['PATIENT','DOCTOR','SECRETARY','ADMIN'],
    migrations:[baseline,target],
  };
}

test('reconcilia somente migration sem nenhuma etapa aplicada e com schema exato',()=>{
  const report=exactReport({
    name:'20261023204500_initial_platform',
    checksum:targetChecksum,
    finished:false,
    rolledBack:false,
    appliedSteps:0,
  });
  assert.equal(getReconciliationDecision(report,targetChecksum),'apply');
});

test('reconciliação é idempotente quando a migration já está aplicada',()=>{
  const report=exactReport({
    name:'20261023204500_initial_platform',
    checksum:targetChecksum,
    finished:true,
    rolledBack:false,
    appliedSteps:0,
  });
  assert.equal(getReconciliationDecision(report,targetChecksum),'already_applied');
});

test('cancela reconciliação se houver divergência estrutural',()=>{
  const report=exactReport({
    name:'20261023204500_initial_platform',
    checksum:targetChecksum,
    finished:false,
    rolledBack:false,
    appliedSteps:0,
  });
  report.missingIndexes.push('User_email_key');
  assert.throws(()=>getReconciliationDecision(report,targetChecksum),/diverge/);
});

test('cancela reconciliação se alguma etapa tiver sido aplicada',()=>{
  const report=exactReport({
    name:'20261023204500_initial_platform',
    checksum:targetChecksum,
    finished:false,
    rolledBack:false,
    appliedSteps:1,
  });
  assert.throws(()=>getReconciliationDecision(report,targetChecksum),/estado seguro/);
});

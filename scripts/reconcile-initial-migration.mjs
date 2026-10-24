import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {inspectDatabaseSchema} from './inspect-database-schema.mjs';

const baselineMigration='20261023120000_init';
const baselineChecksum='192e90c027ea987d2d22dfdc2a0c0c69ba3f4aa8830c51f0950bc132fa5ca0bd';
const targetMigration='20261023204500_initial_platform';
const migrationPath=new URL(`../prisma/migrations/${targetMigration}/migration.sql`,import.meta.url);
const expectedRoles=['PATIENT','DOCTOR','SECRETARY','ADMIN'];
const expectedMoodCheck='CHECK (((score >= 1) AND (score <= 10)))';

function allArraysEmpty(record){
  return record&&Object.values(record).every((value)=>Array.isArray(value)&&value.length===0);
}

function isSuccessful(migration,checksum){
  return migration?.checksum===checksum&&migration.finished===true&&migration.rolledBack===false;
}

export function getReconciliationDecision(report,targetChecksum){
  if(report?.operation!=='SCHEMA_METADATA_READ_ONLY'||report.status!=='connected'){
    throw new Error('A inspeção segura do schema não confirmou conexão com o banco.');
  }
  if(
    report.expectedTableCount!==11||
    !Object.values(report.expectedTables??{}).every(Boolean)||
    !allArraysEmpty(report.missingColumns)||
    !allArraysEmpty(report.extraColumns)||
    !Array.isArray(report.missingConstraints)||report.missingConstraints.length!==0||
    !Array.isArray(report.missingIndexes)||report.missingIndexes.length!==0||
    report.moodScoreCheck!==expectedMoodCheck||
    JSON.stringify(report.roleLabels)!==JSON.stringify(expectedRoles)
  ){
    throw new Error('O schema de produção diverge do baseline esperado; reconciliação cancelada.');
  }

  const migrations=Array.isArray(report.migrations)?report.migrations:[];
  const baseline=migrations.find((migration)=>(
    migration.name===baselineMigration&&
    isSuccessful(migration,baselineChecksum)&&
    migration.appliedSteps===1
  ));
  if(!baseline){
    throw new Error('A migration original concluída não foi confirmada; reconciliação cancelada.');
  }

  const targetRecords=migrations.filter((migration)=>migration.name===targetMigration);
  if(targetRecords.some((migration)=>isSuccessful(migration,targetChecksum))){
    return 'already_applied';
  }
  const failedTarget=targetRecords.find((migration)=>(
    migration.checksum===targetChecksum&&
    migration.finished===false&&
    migration.rolledBack===false&&
    migration.appliedSteps===0
  ));
  if(!failedTarget){
    throw new Error('A migration interrompida não está no estado seguro esperado; reconciliação cancelada.');
  }
  return 'apply';
}

async function run(command,args){
  return await new Promise((resolve,reject)=>{
    const child=spawn(command,args,{
      cwd:fileURLToPath(new URL('..',import.meta.url)),
      env:process.env,
      stdio:'inherit',
    });
    child.once('error',reject);
    child.once('exit',(code,signal)=>{
      if(code===0)return resolve();
      reject(new Error(`Comando de reconciliação falhou (${signal??code??'sem código'}).`));
    });
  });
}

async function main(){
  const sql=await readFile(migrationPath);
  const targetChecksum=createHash('sha256').update(sql).digest('hex');
  const inspection=await inspectDatabaseSchema();
  console.log(JSON.stringify(inspection));
  const decision=getReconciliationDecision(inspection,targetChecksum);

  if(decision==='already_applied'){
    console.log(JSON.stringify({operation:'MIGRATION_RECONCILIATION',status:'already_applied',migration:targetMigration}));
    return;
  }

  await run(process.execPath,[
    '--env-file-if-exists=.env.local',
    'node_modules/prisma/build/index.js',
    'migrate','resolve','--applied',targetMigration,
  ]);
  console.log(JSON.stringify({operation:'MIGRATION_RECONCILIATION',status:'applied',migration:targetMigration}));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch((error)=>{
    console.error(error instanceof Error?error.message:'Falha na reconciliação da migration.');
    process.exitCode=1;
  });
}

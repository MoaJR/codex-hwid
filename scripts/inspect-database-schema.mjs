import {pathToFileURL} from 'node:url';

/** Read-only production preflight. It reports structure only and never row data or connection details. */
const expectedTables=[
  'User','UserRole','Patient','Doctor','CareAssignment','MoodEntry',
  'Session','Account','Verification','RateLimit','TwoFactor',
];
const expectedColumns={
  User:['id','email','name','emailVerified','image','twoFactorEnabled','createdAt','updatedAt'],
  UserRole:['userId','role'],
  Patient:['id','userId','createdAt'],
  Doctor:['id','userId'],
  CareAssignment:['patientId','doctorId','createdAt','endedAt'],
  MoodEntry:['id','patientId','score','recordedAt','createdAt'],
  Session:['id','expiresAt','token','mfaVerifiedAt','createdAt','updatedAt','ipAddress','userAgent','userId'],
  Account:['id','accountId','providerId','userId','accessToken','refreshToken','idToken','accessTokenExpiresAt','refreshTokenExpiresAt','scope','password','createdAt','updatedAt'],
  Verification:['id','identifier','value','expiresAt','createdAt','updatedAt'],
  RateLimit:['id','key','count','lastRequest'],
  TwoFactor:['id','secret','backupCodes','userId','verified','failedVerificationCount','lockedUntil'],
};
const expectedConstraints=[
  'User_pkey','UserRole_pkey','Patient_pkey','Doctor_pkey','CareAssignment_pkey','MoodEntry_pkey',
  'Session_pkey','Account_pkey','Verification_pkey','RateLimit_pkey','TwoFactor_pkey',
  'UserRole_userId_fkey','Patient_userId_fkey','Doctor_userId_fkey',
  'CareAssignment_patientId_fkey','CareAssignment_doctorId_fkey','MoodEntry_patientId_fkey',
  'Session_userId_fkey','Account_userId_fkey','TwoFactor_userId_fkey',
];
const expectedIndexes=[
  'User_email_key','Patient_userId_key','Doctor_userId_key','CareAssignment_doctorId_endedAt_idx',
  'MoodEntry_patientId_recordedAt_idx','Session_token_key','Session_userId_idx','Account_userId_idx',
  'Account_providerId_accountId_key','Verification_identifier_idx','RateLimit_key_key',
  'TwoFactor_secret_idx','TwoFactor_userId_idx',
];

export async function inspectDatabaseSchema(environment=process.env){
  if(!environment.DATABASE_URL?.trim())return {operation:'SCHEMA_METADATA_READ_ONLY',status:'not_configured'};
  let client;
  try{
    const {PrismaClient}=await import('@prisma/client');
    client=new PrismaClient({log:[],errorFormat:'minimal'});
    const tables=await client.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const present=new Set(tables.map(({table_name})=>table_name));
    const roleLabels=await client.$queryRaw`
      SELECT enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE pg_namespace.nspname = 'public' AND pg_type.typname = 'Role'
      ORDER BY enumsortorder
    `;
    const columns=await client.$queryRaw`
      SELECT table_name,column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
    `;
    const actualColumns=new Map();
    for(const {table_name,column_name} of columns){
      if(!actualColumns.has(table_name))actualColumns.set(table_name,new Set());
      actualColumns.get(table_name).add(column_name);
    }
    const constraints=await client.$queryRaw`
      SELECT conname,pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
    `;
    const actualConstraints=new Map(constraints.map(({conname,definition})=>[conname,definition]));
    const indexes=await client.$queryRaw`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;
    const actualIndexes=new Set(indexes.map(({indexname})=>indexname));
    let migrationState=[];
    if(present.has('_prisma_migrations')){
      migrationState=await client.$queryRaw`
        SELECT migration_name, checksum,
               finished_at IS NOT NULL AS finished,
               rolled_back_at IS NOT NULL AS rolled_back,
               applied_steps_count
        FROM "_prisma_migrations"
        ORDER BY started_at
      `;
    }
    return {
      operation:'SCHEMA_METADATA_READ_ONLY',
      status:'connected',
      expectedTables:Object.fromEntries(expectedTables.map((name)=>[name,present.has(name)])),
      expectedTableCount:expectedTables.filter((name)=>present.has(name)).length,
      publicTableCount:present.size,
      missingColumns:Object.fromEntries(Object.entries(expectedColumns).map(([table,names])=>[
        table,names.filter((name)=>!actualColumns.get(table)?.has(name)),
      ])),
      extraColumns:Object.fromEntries(Object.entries(expectedColumns).map(([table,names])=>[
        table,[...(actualColumns.get(table)??[])].filter((name)=>!names.includes(name)),
      ])),
      missingConstraints:expectedConstraints.filter((name)=>!actualConstraints.has(name)),
      missingIndexes:expectedIndexes.filter((name)=>!actualIndexes.has(name)),
      moodScoreCheck:actualConstraints.get('MoodEntry_score_check')??null,
      roleLabels:roleLabels.map(({enumlabel})=>enumlabel),
      migrations:migrationState.map((row)=>({
        name:row.migration_name,
        checksum:row.checksum,
        finished:row.finished,
        rolledBack:row.rolled_back,
        appliedSteps:Number(row.applied_steps_count),
      })),
    };
  }catch{
    return {operation:'SCHEMA_METADATA_READ_ONLY',status:'failed'};
  }finally{
    try{if(client)await client.$disconnect();}catch{/* no sensitive output */}
  }
}

async function main(){
  const result=await inspectDatabaseSchema();
  console.log(JSON.stringify(result));
  if(result.status!=='connected')process.exitCode=1;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(()=>{
    console.log(JSON.stringify({operation:'SCHEMA_METADATA_READ_ONLY',status:'failed'}));
    process.exitCode=1;
  });
}

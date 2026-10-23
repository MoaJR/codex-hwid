/** Read-only production preflight. It reports structure only and never row data or connection details. */
const expectedTables=[
  'User','UserRole','Patient','Doctor','CareAssignment','MoodEntry',
  'Session','Account','Verification','RateLimit','TwoFactor',
];

function report(payload){
  console.log(JSON.stringify({operation:'SCHEMA_METADATA_READ_ONLY',...payload}));
}

if(!process.env.DATABASE_URL?.trim()){
  report({status:'not_configured'});
  process.exitCode=1;
}else{
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
    let migrationState=[];
    if(present.has('_prisma_migrations')){
      migrationState=await client.$queryRaw`
        SELECT migration_name,
               finished_at IS NOT NULL AS finished,
               rolled_back_at IS NOT NULL AS rolled_back,
               applied_steps_count
        FROM "_prisma_migrations"
        ORDER BY started_at
      `;
    }
    report({
      status:'connected',
      expectedTables:Object.fromEntries(expectedTables.map((name)=>[name,present.has(name)])),
      expectedTableCount:expectedTables.filter((name)=>present.has(name)).length,
      publicTableCount:present.size,
      roleLabels:roleLabels.map(({enumlabel})=>enumlabel),
      migrations:migrationState.map((row)=>({
        name:row.migration_name,
        finished:row.finished,
        rolledBack:row.rolled_back,
        appliedSteps:Number(row.applied_steps_count),
      })),
    });
  }catch{
    report({status:'failed'});
    process.exitCode=1;
  }finally{
    try{if(client)await client.$disconnect();}catch{/* no sensitive output */}
  }
}

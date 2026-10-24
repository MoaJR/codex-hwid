import {pathToFileURL} from 'node:url';

/** Read-only production preflight. It reports structure only and never row data or connection details. */
const expectedTables=[
  'User','UserRole','Patient','Doctor','CareAssignment','MoodEntry',
  'Session','Account','Verification','RateLimit','TwoFactor','AuditEvent',
  'Article','ArticleBlock',
  'AppointmentService','AvailabilityRule','AvailabilityException','Appointment','AppointmentEvent','ApiRateLimit',
];
const expectedColumns={
  User:['id','email','name','emailVerified','image','twoFactorEnabled','createdAt','updatedAt'],
  UserRole:['userId','role'],
  Patient:['id','userId','createdAt'],
  Doctor:['id','userId','timeZone'],
  CareAssignment:['patientId','doctorId','createdAt','endedAt'],
  MoodEntry:['id','patientId','score','recordedAt','createdAt'],
  Session:['id','expiresAt','token','mfaVerifiedAt','createdAt','updatedAt','ipAddress','userAgent','userId'],
  Account:['id','accountId','providerId','userId','accessToken','refreshToken','idToken','accessTokenExpiresAt','refreshTokenExpiresAt','scope','password','createdAt','updatedAt'],
  Verification:['id','identifier','value','expiresAt','createdAt','updatedAt'],
  RateLimit:['id','key','count','lastRequest'],
  TwoFactor:['id','secret','backupCodes','userId','verified','failedVerificationCount','lockedUntil'],
  AuditEvent:['id','action','outcome','source','actorUserId','subjectUserId','resourceType','resourceId','occurredAt'],
  Article:['id','slug','title','excerpt','category','readingMinutes','status','editorialLabel','reviewNotice','publishedAt','version','createdById','updatedById','reviewedById','publishedById','reviewedAt','createdAt','updatedAt'],
  ArticleBlock:['id','articleId','position','type','text','items'],
  AppointmentService:['id','doctorId','code','name','mode','durationMinutes','slotIntervalMinutes','bufferBeforeMinutes','bufferAfterMinutes','active','createdAt','updatedAt'],
  AvailabilityRule:['id','doctorId','weekday','startMinute','endMinute','validFrom','validUntil','active','createdAt','updatedAt'],
  AvailabilityException:['id','doctorId','kind','startsAt','endsAt','createdAt','updatedAt'],
  Appointment:['id','doctorId','patientId','serviceId','idempotencyKey','serviceLabel','mode','status','startsAt','endsAt','durationMinutes','bufferBeforeMinutes','bufferAfterMinutes','blockedFrom','blockedUntil','timeZone','version','createdByUserId','updatedByUserId','cancelledByUserId','cancelledAt','createdAt','updatedAt'],
  AppointmentEvent:['id','appointmentId','type','actorUserId','previousStartsAt','previousEndsAt','nextStartsAt','nextEndsAt','previousStatus','nextStatus','occurredAt'],
  ApiRateLimit:['key','count','expiresAt','updatedAt'],
};
const expectedConstraints=[
  'User_pkey','UserRole_pkey','Patient_pkey','Doctor_pkey','CareAssignment_pkey','MoodEntry_pkey',
  'Session_pkey','Account_pkey','Verification_pkey','RateLimit_pkey','TwoFactor_pkey','AuditEvent_pkey',
  'Article_pkey','ArticleBlock_pkey','Article_slug_format_check','Article_reading_minutes_check',
  'Article_version_check','Article_published_at_check','ArticleBlock_position_check','ArticleBlock_content_check',
  'AppointmentService_pkey','AvailabilityRule_pkey','AvailabilityException_pkey','Appointment_pkey','AppointmentEvent_pkey','ApiRateLimit_pkey',
  'Doctor_time_zone_check','AppointmentService_code_check','AppointmentService_name_check','AppointmentService_duration_check','AppointmentService_interval_check','AppointmentService_buffers_check',
  'AvailabilityRule_weekday_check','AvailabilityRule_minutes_check','AvailabilityRule_dates_check','AvailabilityException_period_check',
  'Appointment_service_label_check','Appointment_duration_check','Appointment_buffers_check','Appointment_end_check','Appointment_blocked_period_check','Appointment_time_zone_check','Appointment_version_check','Appointment_cancelled_fields_check',
  'Appointment_doctor_no_overlap','Appointment_patient_no_overlap','ApiRateLimit_count_check',
  'UserRole_userId_fkey','Patient_userId_fkey','Doctor_userId_fkey',
  'CareAssignment_patientId_fkey','CareAssignment_doctorId_fkey','MoodEntry_patientId_fkey',
  'Session_userId_fkey','Account_userId_fkey','TwoFactor_userId_fkey',
  'AuditEvent_actorUserId_fkey','AuditEvent_subjectUserId_fkey',
  'Article_createdById_fkey','Article_updatedById_fkey','Article_reviewedById_fkey','Article_publishedById_fkey',
  'ArticleBlock_articleId_fkey',
  'AppointmentService_doctorId_fkey','AvailabilityRule_doctorId_fkey','AvailabilityException_doctorId_fkey',
  'Appointment_doctorId_fkey','Appointment_patientId_fkey','Appointment_serviceId_doctorId_fkey','Appointment_createdByUserId_fkey','Appointment_updatedByUserId_fkey','Appointment_cancelledByUserId_fkey',
  'AppointmentEvent_appointmentId_fkey','AppointmentEvent_actorUserId_fkey',
];
const expectedIndexes=[
  'User_email_key','Patient_userId_key','Doctor_userId_key','CareAssignment_doctorId_endedAt_idx',
  'MoodEntry_patientId_recordedAt_idx','Session_token_key','Session_userId_idx','Account_userId_idx',
  'Account_providerId_accountId_key','Verification_identifier_idx','RateLimit_key_key',
  'TwoFactor_secret_idx','TwoFactor_userId_idx','AuditEvent_occurredAt_idx',
  'AuditEvent_actorUserId_occurredAt_idx','AuditEvent_subjectUserId_occurredAt_idx',
  'AuditEvent_resourceType_resourceId_occurredAt_idx',
  'Article_slug_key','Article_status_publishedAt_idx','Article_category_status_publishedAt_idx',
  'ArticleBlock_articleId_position_key','ArticleBlock_articleId_idx',
  'AppointmentService_doctorId_code_key','AppointmentService_id_doctorId_key','AppointmentService_doctorId_active_idx',
  'AvailabilityRule_doctorId_weekday_active_idx','AvailabilityRule_doctorId_validFrom_validUntil_idx','AvailabilityException_doctorId_startsAt_idx',
  'Appointment_idempotencyKey_key','Appointment_doctorId_startsAt_idx','Appointment_patientId_startsAt_idx','Appointment_status_startsAt_idx',
  'AppointmentEvent_appointmentId_occurredAt_idx','AppointmentEvent_actorUserId_occurredAt_idx','ApiRateLimit_expiresAt_idx',
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
    const domainLabels=await client.$queryRaw`
      SELECT pg_type.typname,pg_enum.enumlabel
      FROM pg_enum
      JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
      JOIN pg_namespace ON pg_namespace.oid = pg_type.typnamespace
      WHERE pg_namespace.nspname = 'public' AND pg_type.typname IN ('ArticleStatus','ArticleBlockType','AppointmentMode','AppointmentStatus','AvailabilityExceptionKind','AppointmentEventType')
      ORDER BY pg_type.typname,pg_enum.enumsortorder
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
      articleStatusLabels:domainLabels.filter(({typname})=>typname==='ArticleStatus').map(({enumlabel})=>enumlabel),
      articleBlockTypeLabels:domainLabels.filter(({typname})=>typname==='ArticleBlockType').map(({enumlabel})=>enumlabel),
      appointmentModeLabels:domainLabels.filter(({typname})=>typname==='AppointmentMode').map(({enumlabel})=>enumlabel),
      appointmentStatusLabels:domainLabels.filter(({typname})=>typname==='AppointmentStatus').map(({enumlabel})=>enumlabel),
      availabilityExceptionKindLabels:domainLabels.filter(({typname})=>typname==='AvailabilityExceptionKind').map(({enumlabel})=>enumlabel),
      appointmentEventTypeLabels:domainLabels.filter(({typname})=>typname==='AppointmentEventType').map(({enumlabel})=>enumlabel),
      articleChecks:{
        slug:actualConstraints.get('Article_slug_format_check')??null,
        readingMinutes:actualConstraints.get('Article_reading_minutes_check')??null,
        version:actualConstraints.get('Article_version_check')??null,
        publishedAt:actualConstraints.get('Article_published_at_check')??null,
        blockPosition:actualConstraints.get('ArticleBlock_position_check')??null,
        blockContent:actualConstraints.get('ArticleBlock_content_check')??null,
      },
      schedulingChecks:{
        doctorOverlap:actualConstraints.get('Appointment_doctor_no_overlap')??null,
        patientOverlap:actualConstraints.get('Appointment_patient_no_overlap')??null,
        appointmentEnd:actualConstraints.get('Appointment_end_check')??null,
        blockedPeriod:actualConstraints.get('Appointment_blocked_period_check')??null,
        cancelledFields:actualConstraints.get('Appointment_cancelled_fields_check')??null,
        ruleMinutes:actualConstraints.get('AvailabilityRule_minutes_check')??null,
      },
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
  const missingColumns=result.status==='connected'?Object.values(result.missingColumns).flat():['connection'];
  const same=(actual,expected)=>JSON.stringify(actual)===JSON.stringify(expected);
  const enumsReady=result.status==='connected'
    &&same(result.roleLabels,['PATIENT','DOCTOR','SECRETARY','ADMIN'])
    &&same(result.articleStatusLabels,['DRAFT','IN_REVIEW','PUBLISHED','ARCHIVED'])
    &&same(result.articleBlockTypeLabels,['PARAGRAPH','HEADING','LIST'])
    &&same(result.appointmentModeLabels,['IN_PERSON','ONLINE'])
    &&same(result.appointmentStatusLabels,['CONFIRMED','CANCELLED','COMPLETED','NO_SHOW'])
    &&same(result.availabilityExceptionKindLabels,['AVAILABLE','BLOCKED'])
    &&same(result.appointmentEventTypeLabels,['CREATED','RESCHEDULED','CANCELLED','COMPLETED','NO_SHOW']);
  if(result.status!=='connected'||result.expectedTableCount!==expectedTables.length||missingColumns.length||result.missingConstraints.length||result.missingIndexes.length||!enumsReady)process.exitCode=1;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(()=>{
    console.log(JSON.stringify({operation:'SCHEMA_METADATA_READ_ONLY',status:'failed'}));
    process.exitCode=1;
  });
}

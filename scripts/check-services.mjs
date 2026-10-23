/** Configuration indicators only. Never logs secrets and never makes network calls. */
const groups={
  postgres:['DATABASE_URL','POSTGRES_PRISMA_URL','POSTGRES_URL'],
  supabase:['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL'],
  blob:['BLOB_READ_WRITE_TOKEN'],
  redis:['KV_REST_API_URL','KV_REST_API_TOKEN'],
};
const variables=Object.fromEntries(Object.values(groups).flat().map(name=>[name,typeof process.env[name]==='string'&&process.env[name].trim()!=='']));
console.log(JSON.stringify({
  variables,
  configurationDetected:Object.fromEntries(Object.entries(groups).map(([kind,names])=>[kind,names.some(name=>variables[name])])),
  prismaDatasourceConfigured:variables.DATABASE_URL,
  connectionChecked:false,
  note:'Presença de configuração não comprova conexão, schema, autenticação ou backend operacional.',
},null,2));

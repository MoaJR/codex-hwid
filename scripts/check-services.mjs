import {pathToFileURL} from 'node:url';

/** Configuration indicators only. Never logs secrets and never makes network calls. */
const groups={
  postgres:['DATABASE_URL','POSTGRES_PRISMA_URL','POSTGRES_URL'],
  supabase:['SUPABASE_URL','NEXT_PUBLIC_SUPABASE_URL'],
  blob:['BLOB_READ_WRITE_TOKEN'],
  redis:['KV_REST_API_URL','KV_REST_API_TOKEN'],
};
export function inspectServices(environment=process.env){
  const variables=Object.fromEntries(Object.values(groups).flat().map(name=>[name,typeof environment[name]==='string'&&environment[name].trim()!=='']));
  return {
    variables,
    configurationDetected:Object.fromEntries(Object.entries(groups).map(([kind,names])=>[kind,names.some(name=>variables[name])])),
    prismaDatasourceConfigured:variables.DATABASE_URL,
    connectionChecked:false,
    note:'Presença de configuração não comprova conexão, schema, autenticação ou backend operacional.',
  };
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  console.log(JSON.stringify(inspectServices(),null,2));
}

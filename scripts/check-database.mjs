import {pathToFileURL} from 'node:url';

/** Read-only diagnostic, intended for a trusted terminal, never a public route. */
function report(status,code){console.log(JSON.stringify({status,code,operation:'SELECT 1',schemaChecked:false},null,2));}

export function getMissingDatabaseReport(environment=process.env){
  return environment.DATABASE_URL?.trim()?null:{status:'not_configured',code:'DATABASE_URL_MISSING',operation:'SELECT 1',schemaChecked:false};
}

async function main(){
  const missing=getMissingDatabaseReport();
  if(missing){console.log(JSON.stringify(missing,null,2));process.exitCode=1;return;}
  let client;
  const deadline=setTimeout(()=>{report('failed','DATABASE_CHECK_TIMEOUT');process.exit(1);},10000);
  deadline.unref();
  try{
    const {PrismaClient}=await import('@prisma/client');
    client=new PrismaClient({log:[],errorFormat:'minimal'});
    await client.$queryRaw`SELECT 1`;
    report('connected','READ_ONLY_QUERY_SUCCEEDED');
  }catch{
    // Raw provider errors may include URLs or credentials. Never print them.
    report('failed','DATABASE_CHECK_FAILED');
    process.exitCode=1;
  }finally{
    try{if(client)await client.$disconnect();}catch{/* no sensitive output */}
    clearTimeout(deadline);
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  await main();
}

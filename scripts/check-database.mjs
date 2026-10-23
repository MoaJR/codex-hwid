/** Read-only diagnostic, intended for a trusted terminal, never a public route. */
function report(status,code){console.log(JSON.stringify({status,code,operation:'SELECT 1',schemaChecked:false},null,2));}
if(!process.env.DATABASE_URL?.trim()){
  report('not_configured','DATABASE_URL_MISSING');
  process.exitCode=1;
}else{
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

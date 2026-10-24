import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';

export const schedulingServiceSeed=[
  {code:'first-in-person',name:'Primeira consulta presencial',mode:'IN_PERSON',durationMinutes:60,slotIntervalMinutes:30,bufferBeforeMinutes:0,bufferAfterMinutes:10},
  {code:'follow-up-in-person',name:'Retorno presencial',mode:'IN_PERSON',durationMinutes:50,slotIntervalMinutes:30,bufferBeforeMinutes:0,bufferAfterMinutes:10},
  {code:'first-online',name:'Primeira consulta online',mode:'ONLINE',durationMinutes:60,slotIntervalMinutes:30,bufferBeforeMinutes:0,bufferAfterMinutes:10},
  {code:'follow-up-online',name:'Retorno online',mode:'ONLINE',durationMinutes:50,slotIntervalMinutes:30,bufferBeforeMinutes:0,bufferAfterMinutes:10},
];

export async function seedScheduling(client){
  const doctors=await client.$queryRaw`
    SELECT d."id",u."name" FROM "Doctor" d JOIN "User" u ON u."id"=d."userId" ORDER BY d."id"
  `;
  const named=doctors.filter(doctor=>doctor.name.trim().toLocaleLowerCase('pt-BR').replace(/^dr\.?\s+/,'')==='douglas vaz');
  const doctor=named.length===1?named[0]:doctors.length===1?doctors[0]:null;
  if(!doctor)throw new Error('Não foi possível resolver um único médico para o catálogo.');
  let inserted=0;
  for(const item of schedulingServiceSeed){
    const count=await client.$executeRaw`
      INSERT INTO "AppointmentService"
        ("id","doctorId","code","name","mode","durationMinutes","slotIntervalMinutes","bufferBeforeMinutes","bufferAfterMinutes","active","createdAt","updatedAt")
      VALUES
        (${randomUUID()}::uuid,${doctor.id}::uuid,${item.code},${item.name},${item.mode}::"AppointmentMode",${item.durationMinutes},${item.slotIntervalMinutes},${item.bufferBeforeMinutes},${item.bufferAfterMinutes},true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
      ON CONFLICT ("doctorId","code") DO NOTHING
    `;
    inserted+=count;
  }
  return {operation:'SCHEDULING_SERVICE_SEED',status:'ready',inserted,skipped:schedulingServiceSeed.length-inserted};
}

async function main(){
  if(!process.env.DATABASE_URL?.trim())throw new Error('DATABASE_URL não configurada.');
  const {PrismaClient}=await import('@prisma/client');
  const client=new PrismaClient({log:[],errorFormat:'minimal'});
  try{console.log(JSON.stringify(await seedScheduling(client)));}
  finally{await client.$disconnect();}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(()=>{console.log(JSON.stringify({operation:'SCHEDULING_SERVICE_SEED',status:'failed'}));process.exitCode=1;});
}

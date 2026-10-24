import {stdin,stdout} from 'node:process';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {inspectAuthEnvironment} from '../src/server/auth/configuration.mjs';

const allowedRoles=new Set(['PATIENT','DOCTOR','SECRETARY','ADMIN']);

export function parseProvisioningArguments(argv){
  const values={};
  for(let index=0;index<argv.length;index++){
    const argument=argv[index];
    if(!argument.startsWith('--'))throw new Error(`Argumento não reconhecido: ${argument}`);
    const [rawName,inlineValue]=argument.slice(2).split('=',2);
    if(!['email','name','role','confirm'].includes(rawName))throw new Error(`Opção não permitida: --${rawName}`);
    const value=inlineValue??argv[++index];
    if(!value||value.startsWith('--'))throw new Error(`Informe um valor para --${rawName}.`);
    if(values[rawName])throw new Error(`A opção --${rawName} foi repetida.`);
    values[rawName]=value;
  }
  return values;
}

export function validateProvisioningInput(values){
  const email=String(values.email??'').trim().toLowerCase();
  const name=String(values.name??'').trim().replace(/\s+/g,' ');
  const role=String(values.role??'').trim().toUpperCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new Error('Informe um e-mail válido.');
  if(name.length<2||name.length>120)throw new Error('O nome deve ter entre 2 e 120 caracteres.');
  if(!allowedRoles.has(role))throw new Error('O papel deve ser PATIENT, DOCTOR, SECRETARY ou ADMIN.');
  if(values.confirm!=='PROVISIONAR')throw new Error('Confirme a operação com --confirm PROVISIONAR.');
  return {email,name,role};
}

function readSecret(prompt){
  if(!stdin.isTTY||!stdout.isTTY)throw new Error('Execute o provisionamento em um terminal interativo.');
  stdout.write(prompt);
  stdin.setEncoding('utf8');
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve,reject)=>{
    let value='';
    const finish=(error)=>{
      stdin.off('data',onData);stdin.setRawMode(false);stdin.pause();stdout.write('\n');
      if(error)reject(error);else resolve(value);
    };
    const onData=(chunk)=>{
      for(const character of chunk){
        if(character==='\u0003')return finish(new Error('Provisionamento cancelado.'));
        if(character==='\r'||character==='\n')return finish();
        if(character==='\u007f'||character==='\b'){value=value.slice(0,-1);continue;}
        if(character>=' ')value+=character;
      }
    };
    stdin.on('data',onData);
  });
}

export function validatePassword(password,confirmation){
  if(password.length<12||password.length>128)throw new Error('A senha deve ter entre 12 e 128 caracteres.');
  if(password!==confirmation)throw new Error('As senhas não coincidem.');
}

export function validateProvisioningEnvironment(environment){
  const status=inspectAuthEnvironment({...environment,AUTH_ENABLED:'true'});
  if(status.missing.length)throw new Error(`Configuração ausente: ${status.missing.join(', ')}.`);
  if(status.invalid.length)throw new Error(`Configuração inválida: ${status.invalid.join(', ')}.`);
  return new URL(environment.BETTER_AUTH_URL).origin;
}

async function provision(input,password,environment=process.env){
  const origin=validateProvisioningEnvironment(environment);

  const [{betterAuth},{prismaAdapter},{PrismaClient}]=await Promise.all([
    import('better-auth'),import('better-auth/adapters/prisma'),import('@prisma/client'),
  ]);
  const db=new PrismaClient({log:[],errorFormat:'minimal'});
  let createdUserId;
  try{
    if(await db.user.findUnique({where:{email:input.email},select:{id:true}}))throw new Error('Já existe uma conta com esse e-mail.');
    const auth=betterAuth({
      appName:'Dr. Douglas Vaz',baseURL:origin,secret:environment.BETTER_AUTH_SECRET,
      database:prismaAdapter(db,{provider:'postgresql'}),
      emailAndPassword:{enabled:true,disableSignUp:false,minPasswordLength:12,maxPasswordLength:128,requireEmailVerification:false},
      account:{accountLinking:{enabled:false}},
      advanced:{database:{generateId:'uuid'},useSecureCookies:origin.startsWith('https:')},
      logger:{disabled:true},
    });
    const created=await auth.api.signUpEmail({body:{email:input.email,name:input.name,password}});
    if(!created?.user?.id)throw new Error('O provedor de autenticação não criou a conta.');
    createdUserId=created.user.id;
    await db.$transaction(async transaction=>{
      await transaction.userRole.create({data:{userId:createdUserId,role:input.role}});
      if(input.role==='DOCTOR')await transaction.doctor.create({data:{userId:createdUserId}});
      if(input.role==='PATIENT')await transaction.patient.create({data:{userId:createdUserId}});
      await transaction.session.deleteMany({where:{userId:createdUserId}});
      await transaction.$executeRaw`
        INSERT INTO "AuditEvent" ("id", "action", "outcome", "source", "subjectUserId", "occurredAt")
        VALUES (${randomUUID()}::uuid, 'ACCESS_PROVISIONED', 'SUCCESS', 'TRUSTED_CLI', ${createdUserId}::uuid, CURRENT_TIMESTAMP)
      `;
    });
    console.log(JSON.stringify({operation:'ACCESS_PROVISIONING',status:'provisioned',role:input.role,activeSessions:0}));
  }catch(error){
    if(createdUserId){try{await db.user.delete({where:{id:createdUserId}});}catch{/* Avoid leaking database details. */}}
    throw error;
  }finally{await db.$disconnect();}
}

async function main(){
  const input=validateProvisioningInput(parseProvisioningArguments(process.argv.slice(2)));
  const password=await readSecret('Senha inicial (não será exibida): ');
  const confirmation=await readSecret('Repita a senha: ');
  validatePassword(password,confirmation);
  await provision(input,password);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(error=>{console.error(error instanceof Error?error.message:'Falha no provisionamento.');process.exitCode=1;});
}

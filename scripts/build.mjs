import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export function getBuildScripts(environment=process.env){
  return [
    'db:generate',
    ...(environment.VERCEL_ENV==='production'?['db:migrate:deploy','db:inspect:schema','db:seed:articles']:[]),
    'build:next',
  ];
}

async function runNpmScript(script){
  const npmCli=process.env.npm_execpath;
  if(!npmCli)throw new Error('npm_execpath não está disponível para executar o build.');
  console.log(`[build] npm run ${script}`);
  await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,[npmCli,'run',script],{stdio:'inherit',env:process.env});
    child.once('error',reject);
    child.once('exit',(code,signal)=>{
      if(code===0)return resolve();
      reject(new Error(`npm run ${script} falhou (${signal??code??'sem código'}).`));
    });
  });
}

async function main(){
  for(const script of getBuildScripts())await runNpmScript(script);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch((error)=>{
    console.error(error instanceof Error?error.message:'Falha no build.');
    process.exitCode=1;
  });
}

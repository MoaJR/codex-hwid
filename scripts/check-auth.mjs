import {inspectAuthEnvironment} from '../src/server/auth/configuration.mjs';
const report=inspectAuthEnvironment(process.env);
console.log(JSON.stringify({...report,connectionChecked:false,schemaChecked:false,note:'Somente validação de configuração; não comprova login ou banco.'},null,2));
if(report.enabled&&!report.configured)process.exitCode=1;

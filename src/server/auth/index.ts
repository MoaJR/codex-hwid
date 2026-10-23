import 'server-only';
import {getAuthConfigurationStatus} from './config';
type Auth=ReturnType<typeof import('./provider').createAuth>;
let instance:Auth|undefined;
export async function getAuth():Promise<Auth|null>{
  if(!getAuthConfigurationStatus().configured)return null;
  if(!instance){const {createAuth}=await import('./provider');instance=createAuth();}
  return instance;
}

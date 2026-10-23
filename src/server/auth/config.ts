import 'server-only';
import {inspectAuthEnvironment} from './configuration.mjs';
export function getAuthConfigurationStatus(){
  const status=inspectAuthEnvironment(process.env);
  // Only this coarse flag may be passed to public pages, never credentials.
  return {configured:status.configured};
}

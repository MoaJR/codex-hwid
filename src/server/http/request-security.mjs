/** @param {string|null} requestOrigin @param {string|undefined} configuredUrl */
export function isTrustedMutationOrigin(requestOrigin,configuredUrl){
  if(!requestOrigin||!configuredUrl)return false;
  try{return new URL(requestOrigin).origin===new URL(configuredUrl).origin&&requestOrigin===new URL(requestOrigin).origin;}catch{return false;}
}

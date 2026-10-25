/** Decide only the enrollment/verification destination for protected staff pages.
 * @param {{staffMfaRequired:boolean,twoFactorEnabled:boolean,sessionMfaVerified:boolean}} input
 * @returns {'/conta'|'/verificar-acesso'|null}
 */
export function staffMfaRedirect(input){
  if(!input.staffMfaRequired)return null;
  if(!input.twoFactorEnabled)return '/conta';
  if(!input.sessionMfaVerified)return '/verificar-acesso';
  return null;
}

/** Pure policy. Actors and resource ownership must come from trusted server queries. */
/** @typedef {'PATIENT'|'DOCTOR'|'SECRETARY'|'ADMIN'} Role */
/** @typedef {{userId:string,roles:Role[]}} Actor */
/** @typedef {{patientUserId?:string,assignedDoctorUserIds?:string[]}} Resource */
/** @param {Actor|null} actor @param {string} permission @param {Resource} resource */
export function can(actor, permission, resource = {}) {
  if (!actor?.userId || !Array.isArray(actor.roles)) return false;
  const own = resource.patientUserId === actor.userId;
  const assigned = resource.assignedDoctorUserIds?.includes(actor.userId) === true;
  return actor.roles.some(role => {
    if (role === 'PATIENT') return own && ['appointment.read','mood.read','mood.write','document.shared.read','message.read','message.write'].includes(permission);
    if (role === 'DOCTOR') return ['content.read','content.write','content.submit_review','content.publish'].includes(permission)||(assigned && ['appointment.read','appointment.write','patient.read','medical_record.read','medical_record.write','mood.read','document.create','document.shared.read','message.read','message.write'].includes(permission));
    if (role === 'SECRETARY') return ['appointment.read','appointment.write','patient.demographics.read'].includes(permission);
    if (role === 'ADMIN') return ['user.manage','permission.manage','audit.read','settings.manage','content.read','content.write','content.submit_review'].includes(permission);
    return false;
  });
}
/** @param {Actor|null} actor @param {string} permission @param {Resource} resource */
export function authorize(actor, permission, resource = {}) {
  if (!can(actor,permission,resource)) throw new AuthorizationError();
}
export class AuthorizationError extends Error {
  constructor(){super('Acesso não permitido.');this.name='AuthorizationError';}
}

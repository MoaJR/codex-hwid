// Máquina de estados da solicitação de horário (Fase 5B). Módulo puro, sem
// banco, sem sessão e sem `server-only`: a mesma regra é usada pela rota, pelo
// store e pelos testes unitários.
export const REQUEST_STATUSES = Object.freeze(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'WITHDRAWN']);

export class RequestStateError extends Error {
  constructor(message = 'Estado da solicitação inválido.') {
    super(message);
    this.name = 'RequestStateError';
  }
}

/** @param {unknown} value */
function timestamp(value) {
  const parsed = value instanceof Date ? value.getTime() : new Date(/** @type {string} */ (value)).getTime();
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** @param {unknown} value */
function instant(value) {
  const parsed = timestamp(value);
  if (!Number.isFinite(parsed)) throw new RequestStateError('Horário da solicitação inválido.');
  return new Date(parsed).toISOString();
}

/**
 * Pendência expira quando o próprio horário chega: nunca sobrevive ao slot.
 * @param {{status?:string,expiresAt?:string|Date}|null|undefined} request
 * @param {Date} [now]
 */
export function isRequestExpired(request, now = new Date()) {
  if (!request || typeof request !== 'object') return true;
  if (request.status !== 'PENDING') return false;
  const expiresAt = timestamp(request.expiresAt);
  return Number.isFinite(expiresAt) ? expiresAt <= now.getTime() : true;
}

/**
 * Estado efetivo para leitura e decisão: `PENDING` vencido é reportado como
 * `EXPIRED` sem depender de rotina agendada.
 * @param {{status?:string,expiresAt?:string|Date}} request
 * @param {Date} [now]
 */
export function effectiveRequestStatus(request, now = new Date()) {
  const status = request?.status;
  if (!REQUEST_STATUSES.includes(/** @type {string} */ (status))) throw new RequestStateError();
  return isRequestExpired(request, now) ? 'EXPIRED' : /** @type {string} */ (status);
}

/** @param {{status?:string,expiresAt?:string|Date}} request @param {Date} [now] */
export function canDecideRequest(request, now = new Date()) {
  return effectiveRequestStatus(request, now) === 'PENDING';
}

/** @param {{status?:string,expiresAt?:string|Date}} request @param {Date} [now] */
export function canWithdrawRequest(request, now = new Date()) {
  return effectiveRequestStatus(request, now) === 'PENDING';
}

const transitions = Object.freeze({
  PENDING: Object.freeze({ APPROVE: 'APPROVED', REJECT: 'REJECTED', WITHDRAW: 'WITHDRAWN' }),
});

/**
 * @param {string} status
 * @param {'APPROVE'|'REJECT'|'WITHDRAW'} action
 * @returns {'APPROVED'|'REJECTED'|'WITHDRAWN'}
 */
export function nextRequestStatus(status, action) {
  const next = transitions[/** @type {'PENDING'} */ (status)]?.[action];
  if (!next) throw new RequestStateError();
  return next;
}

/**
 * Repetição idempotente: só devolve a solicitação original quando o pedido é
 * exatamente o mesmo. Qualquer divergência é conflito, sem revelar o registro.
 * @param {{id:string,patientId:string,serviceId:string,startsAt:string|Date}|null|undefined} existing
 * @param {{patientId:string,serviceId:string,startsAt:string|Date}} request
 * @returns {{kind:'create'}|{kind:'replay',requestId:string}|{kind:'conflict'}}
 */
export function evaluateRequestReplay(existing, request) {
  if (!existing) return { kind: 'create' };
  const matches = existing.patientId === request.patientId
    && existing.serviceId === request.serviceId
    && instant(existing.startsAt) === instant(request.startsAt);
  return matches ? { kind: 'replay', requestId: existing.id } : { kind: 'conflict' };
}

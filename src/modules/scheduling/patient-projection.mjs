// Projeções da área do paciente e da fila da equipe. Módulo puro: cada função
// recebe linhas com campos internos e devolve somente a allowlist pública,
// sempre com teto de itens. Nenhum nome de campo interno escapa daqui.
export const PATIENT_BOOKING_LIMITS = Object.freeze({
  services: 6,
  slotsPerService: 60,
  requests: 10,
  appointments: 20,
  queue: 50,
});

/** @param {unknown} value */
function iso(value) {
  return value instanceof Date ? value.toISOString() : String(value);
}

/** @param {unknown} rows @param {number} limit @returns {any[]} */
function capped(rows, limit) {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, limit);
}

/**
 * Solicitação vista pelo próprio paciente: estado, serviço e horário. Sem
 * `patientId`, `doctorId`, `idempotencyKey`, decisão ou autoria.
 * @param {{id:string,status:string,serviceLabel:string,mode:string,startsAt:string|Date,endsAt:string|Date,expiresAt:string|Date,version:number}} row
 */
export function projectPatientRequest(row) {
  return {
    id: row.id,
    status: row.status,
    serviceLabel: row.serviceLabel,
    mode: row.mode,
    startsAt: iso(row.startsAt),
    endsAt: iso(row.endsAt),
    expiresAt: iso(row.expiresAt),
    version: row.version,
  };
}

/**
 * Consulta confirmada vista pelo paciente.
 * @param {{id:string,serviceLabel:string,mode:string,status:string,startsAt:string|Date,endsAt:string|Date,version:number}} row
 */
export function projectPatientAppointment(row) {
  return {
    id: row.id,
    serviceLabel: row.serviceLabel,
    mode: row.mode,
    status: row.status,
    startsAt: iso(row.startsAt),
    endsAt: iso(row.endsAt),
    version: row.version,
  };
}

/**
 * @param {{services:any[],requests:any[],appointments:any[]}} input
 */
export function projectPatientBooking(input) {
  const services = capped(input.services, PATIENT_BOOKING_LIMITS.services).map(service => ({
    id: service.id,
    label: service.label,
    mode: service.mode,
    durationMinutes: service.durationMinutes,
    slots: capped(service.slots, PATIENT_BOOKING_LIMITS.slotsPerService).map(slot => ({
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      date: slot.date,
      time: slot.time,
      timeZone: slot.timeZone,
    })),
  }));
  return {
    services,
    requests: capped(input.requests, PATIENT_BOOKING_LIMITS.requests).map(projectPatientRequest),
    appointments: capped(input.appointments, PATIENT_BOOKING_LIMITS.appointments).map(projectPatientAppointment),
  };
}

/**
 * Fila da equipe: aqui o nome do paciente é necessário para a operação e já é
 * visível na agenda. Identificadores de paciente, chave de idempotência e
 * autoria continuam fora da projeção.
 * @param {{id:string,patientName:string,serviceLabel:string,mode:string,startsAt:string|Date,endsAt:string|Date,expiresAt:string|Date,status:string,version:number}} row
 */
export function projectPendingRequest(row) {
  return {
    id: row.id,
    patientName: row.patientName,
    serviceLabel: row.serviceLabel,
    mode: row.mode,
    startsAt: iso(row.startsAt),
    endsAt: iso(row.endsAt),
    expiresAt: iso(row.expiresAt),
    status: row.status,
    version: row.version,
  };
}

/** @param {any[]} rows */
export function projectPendingRequests(rows) {
  return capped(rows, PATIENT_BOOKING_LIMITS.queue).map(projectPendingRequest);
}

/**
 * Resultado de uma decisão da equipe.
 * @param {{id:string,status:string,version:number,startsAt:string|Date,serviceLabel:string}} row
 * @param {string|null} appointmentId
 */
export function projectRequestDecision(row, appointmentId) {
  return {
    request: {
      id: row.id,
      status: row.status,
      version: row.version,
      startsAt: iso(row.startsAt),
      serviceLabel: row.serviceLabel,
    },
    appointmentId: appointmentId ?? null,
  };
}

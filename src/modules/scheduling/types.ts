export type AppointmentMode='IN_PERSON'|'ONLINE';
export type AppointmentStatus='CONFIRMED'|'CANCELLED'|'COMPLETED'|'NO_SHOW';
export type RequestStatus='PENDING'|'APPROVED'|'REJECTED'|'EXPIRED'|'WITHDRAWN';
export type ScheduleService={id:string;code:string;name:string;mode:AppointmentMode;durationMinutes:number;slotIntervalMinutes:number;bufferBeforeMinutes:number;bufferAfterMinutes:number;active:boolean};
export type ScheduleRule={id:string;weekday:number;startMinute:number;endMinute:number;validFrom:string;validUntil:string|null;active:boolean};
export type ScheduleException={id:string;kind:'AVAILABLE'|'BLOCKED';startsAt:string;endsAt:string};
export type SchedulePatient={id:string;name:string};
export type ScheduleAppointment={id:string;patientId:string;patientName:string;serviceId:string;serviceLabel:string;mode:AppointmentMode;status:AppointmentStatus;startsAt:string;endsAt:string;durationMinutes:number;bufferBeforeMinutes:number;bufferAfterMinutes:number;version:number};
export type BookingSlot={startsAt:string;endsAt:string;date:string;time:string;timeZone:string};
export type PatientBookingService={id:string;label:string;mode:AppointmentMode;durationMinutes:number;slots:BookingSlot[]};
export type PatientRequestSummary={id:string;status:RequestStatus;serviceLabel:string;mode:AppointmentMode;startsAt:string;endsAt:string;expiresAt:string;version:number};
export type PatientBookingAppointment={id:string;serviceLabel:string;mode:AppointmentMode;status:AppointmentStatus;startsAt:string;endsAt:string;version:number};
export type PatientBookingOptions={available:boolean;reason:'PROFILE_UNLINKED'|'SCHEDULE_UNAVAILABLE'|null;services:PatientBookingService[];requests:PatientRequestSummary[];appointments:PatientBookingAppointment[]};
export type PendingRequestSummary={id:string;patientName:string;serviceLabel:string;mode:AppointmentMode;startsAt:string;endsAt:string;expiresAt:string;status:RequestStatus;version:number};
export type RequestDecisionResult={request:{id:string;status:RequestStatus;version:number;startsAt:string;serviceLabel:string};appointmentId:string|null};
export type SchedulingWorkspace={doctor:{id:string;timeZone:string};from:string;to:string;services:ScheduleService[];rules:ScheduleRule[];exceptions:ScheduleException[];patients:SchedulePatient[];appointments:ScheduleAppointment[]};


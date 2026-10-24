export type AppointmentMode='IN_PERSON'|'ONLINE';
export type AppointmentStatus='CONFIRMED'|'CANCELLED'|'COMPLETED'|'NO_SHOW';
export type ScheduleService={id:string;code:string;name:string;mode:AppointmentMode;durationMinutes:number;slotIntervalMinutes:number;bufferBeforeMinutes:number;bufferAfterMinutes:number;active:boolean};
export type ScheduleRule={id:string;weekday:number;startMinute:number;endMinute:number;validFrom:string;validUntil:string|null;active:boolean};
export type ScheduleException={id:string;kind:'AVAILABLE'|'BLOCKED';startsAt:string;endsAt:string};
export type SchedulePatient={id:string;name:string};
export type ScheduleAppointment={id:string;patientId:string;patientName:string;serviceId:string;serviceLabel:string;mode:AppointmentMode;status:AppointmentStatus;startsAt:string;endsAt:string;durationMinutes:number;bufferBeforeMinutes:number;bufferAfterMinutes:number;version:number};
export type SchedulingWorkspace={doctor:{id:string;timeZone:string};from:string;to:string;services:ScheduleService[];rules:ScheduleRule[];exceptions:ScheduleException[];patients:SchedulePatient[];appointments:ScheduleAppointment[]};

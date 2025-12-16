/**
 * Appointment-related types
 */

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Approved' | 'Completed' | 'Cancelled' | 'Expired';
  appointmentType?: string;
  duration?: number; // Duration in minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  date?: string;
  time?: string;
  notes?: string;
  status?: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface ScheduledAppointmentResponse {
  id: number;
  doctorId: number;
  patientId: number | null; // Can be null for available slots
  doctorName: string | null; // Can be null
  patientName: string | null; // Can be null for available slots
  patientUsername: string | null; // Can be null
  doctorUsername: string | null; // Can be null
  appointmentDate: string; // date-time format: "2024-12-20T10:00:00"
  appointmentType: string | null; // enum: "checkup" | "followup" | "consultation" | "emergency" - can be null
  appointmentStatus: string; // enum: "scheduled" | "completed" | "cancelled"
}

export interface OpenSlotRequest {
  appointment_date: string; // ISO 8601 format: "2024-12-20T10:00:00"
}


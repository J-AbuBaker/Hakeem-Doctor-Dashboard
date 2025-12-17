import {
  Appointment,
} from '../../../types';

/**
 * Appointment service interface
 * Defines the contract for appointment-related operations
 */
export interface IAppointmentService {
  /**
   * Fetch scheduled appointments for the authenticated doctor
   */
  getScheduledAppointments(): Promise<Appointment[]>;

  /**
   * Open a new appointment slot
   * @param appointmentDate - LocalDateTime format: "YYYY-MM-DDTHH:mm:ss"
   */
  openSlot(appointmentDate: string): Promise<void>;

  /**
   * Mark an appointment as completed
   * @param id - Appointment identifier
   */
  completeAppointment(id: string): Promise<Appointment>;
}

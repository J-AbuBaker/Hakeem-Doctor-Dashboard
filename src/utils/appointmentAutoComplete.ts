/**
 * Auto-completion utility for appointments
 * Handles logic for determining when appointments should be automatically marked as complete
 */

import { Appointment } from '../types';
import { parseAppointmentDate } from './dateUtils';
import { hasStatus } from './statusUtils';
import { APP_CONFIG } from '../constants/appConfig';

/**
 * Calculates the end time of an appointment (start time + duration)
 * @param appointment - Appointment object
 * @returns Date object representing the appointment end time, or null if invalid
 */
export function calculateAppointmentEndTime(appointment: Appointment): Date | null {
  const startTime = parseAppointmentDate(appointment);

  if (!startTime) {
    return null;
  }

  // Get duration from appointment, fallback to default
  const duration = appointment.duration || APP_CONFIG.DEFAULT_APPOINTMENT_DURATION;

  // Calculate end time: start time + duration (in milliseconds)
  const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

  return endTime;
}

/**
 * Checks if an appointment should be auto-completed
 * An appointment should be auto-completed if:
 * - Status is "Scheduled" (not Completed or Cancelled)
 * - Has a patient (not an available slot)
 * - Current time >= (appointment end time + grace period)
 * @param appointment - Appointment object
 * @param gracePeriodMinutes - Grace period in minutes after end time (default: 5)
 * @returns true if appointment should be auto-completed
 */
export function shouldAutoComplete(
  appointment: Appointment,
  gracePeriodMinutes: number = APP_CONFIG.AUTO_COMPLETE.GRACE_PERIOD_MINUTES
): boolean {
  // Must be scheduled (not completed or cancelled)
  if (!hasStatus(appointment.status, 'Scheduled')) {
    return false;
  }

  // Must not be cancelled
  if (hasStatus(appointment.status, 'Cancelled')) {
    return false;
  }

  // Must have a patient (not an available slot)
  if (!appointment.patientId || appointment.patientId === '0' || appointment.patientName === 'Available Slot') {
    return false;
  }

  // Calculate appointment end time
  const endTime = calculateAppointmentEndTime(appointment);
  if (!endTime) {
    return false;
  }

  // Calculate completion time: end time + grace period
  const completionTime = new Date(endTime.getTime() + gracePeriodMinutes * 60 * 1000);

  // Check if current time has passed the completion time
  const now = new Date();
  return now >= completionTime;
}

/**
 * Filters appointments to get those that should be auto-completed
 * @param appointments - Array of appointments to check
 * @param gracePeriodMinutes - Grace period in minutes after end time (default: 5)
 * @returns Array of appointments that should be auto-completed
 */
export function getAppointmentsToAutoComplete(
  appointments: Appointment[],
  gracePeriodMinutes: number = APP_CONFIG.AUTO_COMPLETE.GRACE_PERIOD_MINUTES
): Appointment[] {
  return appointments.filter(appointment => shouldAutoComplete(appointment, gracePeriodMinutes));
}

import { isSameDay, parseISO, startOfDay } from 'date-fns';
import { Appointment } from '../types';

/**
 * Extracts the date part (YYYY-MM-DD) from an ISO datetime string
 * Handles formats like "2025-12-15T09:00:00" or "2025-12-15T09:00:00.000"
 * @param dateTimeString - ISO datetime string from API
 * @returns Date string in YYYY-MM-DD format, or null if invalid
 */
export function extractDateFromDateTime(dateTimeString: string | undefined | null): string | null {
  if (!dateTimeString) return null;

  // Extract date part before 'T'
  const datePart = dateTimeString.split('T')[0];

  // Validate format (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  return null;
}

/**
 * Parses an appointment date string to a Date object
 * Uses the original appointmentDate from API (createdAt) if available for accuracy
 * Falls back to the date field if appointmentDate is not available
 * @param appointment - Appointment object
 * @returns Date object, or null if invalid
 */
export function parseAppointmentDate(appointment: Appointment): Date | null {
  // Prefer using the original appointmentDate from API (stored in createdAt)
  // This has the full datetime information: "2025-12-15T09:00:00"
  const appointmentDateStr = appointment.createdAt || appointment.date;

  if (!appointmentDateStr) {
    return null;
  }

  // If it's a full datetime string (contains 'T'), parse it properly
  if (appointmentDateStr.includes('T')) {
    // Extract date and time parts
    const [datePart, timePart] = appointmentDateStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds = 0] = (timePart || '00:00:00').split(':').map(part => parseInt(part, 10));

    // Create date in local timezone to avoid timezone conversion issues
    // Backend returns LocalDateTime (no timezone), so treat as local time
    const date = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  // If it's just a date string (YYYY-MM-DD), parse it
  const date = parseISO(appointmentDateStr);
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Checks if an appointment falls on a specific date
 * Uses the original appointmentDate from API for accurate comparison
 * @param appointment - Appointment object
 * @param targetDate - Date to compare against
 * @returns true if appointment is on the target date
 */
export function isAppointmentOnDate(appointment: Appointment, targetDate: Date): boolean {
  const appointmentDate = parseAppointmentDate(appointment);

  if (!appointmentDate) {
    return false;
  }

  // Use isSameDay which compares only year, month, and day (ignores time)
  return isSameDay(appointmentDate, targetDate);
}

/**
 * Checks if an appointment falls within a date range (inclusive)
 * @param appointment - Appointment object
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns true if appointment is within the date range
 */
export function isAppointmentInDateRange(
  appointment: Appointment,
  startDate: Date,
  endDate: Date
): boolean {
  const appointmentDate = parseAppointmentDate(appointment);

  if (!appointmentDate) {
    return false;
  }

  // Normalize dates to start of day for comparison
  const aptStartOfDay = startOfDay(appointmentDate);
  const rangeStart = startOfDay(startDate);
  const rangeEnd = startOfDay(endDate);

  return aptStartOfDay >= rangeStart && aptStartOfDay <= rangeEnd;
}

/**
 * Gets all appointments for a specific date
 * @param appointments - Array of appointments
 * @param targetDate - Date to filter by
 * @returns Filtered array of appointments for the target date
 */
export function getAppointmentsForDate(
  appointments: Appointment[],
  targetDate: Date
): Appointment[] {
  return appointments.filter(apt => isAppointmentOnDate(apt, targetDate));
}

/**
 * Gets all appointments for today
 * @param appointments - Array of appointments
 * @returns Filtered array of appointments for today
 */
export function getTodayAppointments(appointments: Appointment[]): Appointment[] {
  const today = new Date();
  return getAppointmentsForDate(appointments, today);
}

/**
 * Checks if an appointment is in the future (start time is after now)
 * Uses the full datetime from createdAt and time field for accurate comparison
 * @param appointment - Appointment object
 * @returns true if appointment start time is in the future
 */
export function isAppointmentInFuture(appointment: Appointment): boolean {
  const appointmentDate = parseAppointmentDate(appointment);

  if (!appointmentDate) {
    return false;
  }

  // If we only have date (no time), combine with time field
  if (!appointment.createdAt || !appointment.createdAt.includes('T')) {
    if (appointment.time && appointment.time.includes(':')) {
      const [hours, minutes] = appointment.time.split(':').map(Number);
      appointmentDate.setHours(hours || 0, minutes || 0, 0, 0);
    }
  }

  const now = new Date();
  return appointmentDate > now;
}

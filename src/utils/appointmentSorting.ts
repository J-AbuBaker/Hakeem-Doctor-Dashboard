import { Appointment } from '../types';
import { parseAppointmentDate } from './dateUtils';

/**
 * Sorts appointments by date and time
 * @param appointments - Array of appointments to sort
 * @returns Sorted array of appointments (earliest first)
 */
export function sortAppointmentsByDateTime(appointments: Appointment[]): Appointment[] {
  return [...appointments].sort((a, b) => {
    // Parse appointment dates
    const dateA = parseAppointmentDate(a);
    const dateB = parseAppointmentDate(b);

    // If dates are invalid, put them at the end
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    // First sort by date
    const dateComparison = dateA.getTime() - dateB.getTime();
    if (dateComparison !== 0) {
      return dateComparison;
    }

    // Then by time
    const timeA = a.time.split(':').map(Number);
    const timeB = b.time.split(':').map(Number);
    const timeAMinutes = (timeA[0] || 0) * 60 + (timeA[1] || 0);
    const timeBMinutes = (timeB[0] || 0) * 60 + (timeB[1] || 0);

    return timeAMinutes - timeBMinutes;
  });
}


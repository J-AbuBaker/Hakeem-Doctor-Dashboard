/**
 * String utility functions
 */

/**
 * Capitalizes the first letter of a string
 * @param str - String to capitalize
 * @returns Capitalized string
 */
export function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formats appointment type for display
 * Converts formats like "checkup", "follow-up", "emergency" to "Checkup", "Follow Up", "Emergency"
 * @param appointmentType - Appointment type string
 * @returns Formatted appointment type
 */
export function formatAppointmentType(appointmentType: string): string {
  if (!appointmentType) return '';

  return appointmentType
    .split(/[\s_-]+/)
    .map((word) => capitalizeFirst(word))
    .join(' ');
}


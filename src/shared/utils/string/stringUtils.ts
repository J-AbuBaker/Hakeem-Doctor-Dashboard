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

/**
 * Gets initials from a full name
 * @param name - Full name string
 * @returns Initials (e.g., "John Doe" -> "JD", "John" -> "J")
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}
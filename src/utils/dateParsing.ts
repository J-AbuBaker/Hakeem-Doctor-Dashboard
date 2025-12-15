/**
 * Date parsing utilities for appointment dates
 * Handles conversion between API date formats and frontend formats
 */

/**
 * Parses ISO datetime string to Date object
 * Handles formats like "2024-12-20T10:00:00" or "2024-12-20T10:00:00.000"
 * @param dateTimeString - ISO datetime string
 * @returns Date object or null if invalid
 */
export function parseDateTimeString(dateTimeString: string | null | undefined): Date | null {
  if (!dateTimeString) return null;

  try {
    if (dateTimeString.includes('T')) {
      const [datePart, timePart] = dateTimeString.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds = 0] = (timePart || '00:00:00')
        .split(':')
        .map((part) => parseInt(part, 10));

      const date = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);

      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: ${dateTimeString}`);
      }

      return date;
    }

    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) {
      return null;
    }

    return date;
  } catch (error) {
    console.error('Error parsing date:', error, dateTimeString);
    return null;
  }
}

/**
 * Formats Date object to YYYY-MM-DD string
 * @param date - Date object
 * @returns Formatted date string
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats Date object to HH:mm time string
 * @param date - Date object
 * @returns Formatted time string
 */
export function formatTimeToString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Validates datetime string format
 * Expected format: "YYYY-MM-DDTHH:mm:ss"
 * @param dateTimeString - Datetime string to validate
 * @returns true if format is valid
 */
export function isValidDateTimeFormat(dateTimeString: string): boolean {
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
  return dateTimeRegex.test(dateTimeString);
}

/**
 * Validates date components
 * @param dateTimeString - Datetime string in format "YYYY-MM-DDTHH:mm:ss"
 * @returns true if date components are valid
 */
export function validateDateTimeComponents(dateTimeString: string): boolean {
  try {
    const [datePart, timePart] = dateTimeString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Validate date components
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    // Validate time components
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
      return false;
    }

    // Validate actual date (handles invalid dates like Feb 30)
    const testDate = new Date(year, month - 1, day, hours, minutes, seconds);
    return (
      testDate.getFullYear() === year &&
      testDate.getMonth() === month - 1 &&
      testDate.getDate() === day &&
      testDate.getHours() === hours &&
      testDate.getMinutes() === minutes &&
      testDate.getSeconds() === seconds
    );
  } catch {
    return false;
  }
}

/**
 * Validates complete datetime string (format + components)
 * @param dateTimeString - Datetime string to validate
 * @returns true if datetime is valid
 */
export function isValidDateTime(dateTimeString: string): boolean {
  if (!isValidDateTimeFormat(dateTimeString)) {
    return false;
  }

  return validateDateTimeComponents(dateTimeString);
}


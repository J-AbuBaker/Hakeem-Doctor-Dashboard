/**
 * Duration calculation and formatting utilities
 * Handles duration calculations for calendar events created via UI
 */

/**
 * Formats duration in minutes to a human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "30 min", "1h 30m", "2 hours")
 */
export const formatDuration = (minutes?: number | null): string => {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return 'N/A';
  }

  // Round to nearest minute for display
  const roundedMinutes = Math.round(minutes);

  if (roundedMinutes === 0) {
    return '0 min';
  }

  if (roundedMinutes < 60) {
    return `${roundedMinutes} min`;
  }

  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Calculates duration between two times
 * @param startTime - Start time in HH:mm format
 * @param endTime - End time in HH:mm format
 * @returns Duration in minutes, or null if calculation fails
 */
export const calculateDurationBetweenTimes = (
  startTime: string,
  endTime: string
): number | null => {
  try {
    if (!startTime || !endTime) {
      return null;
    }

    const parseTime = (timeStr: string): number | null => {
      const parts = timeStr.split(':');
      if (parts.length < 2) {
        return null;
      }

      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);

      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }

      return hours * 60 + minutes; // Convert to minutes since midnight
    };

    const startMinutes = parseTime(startTime);
    const endMinutes = parseTime(endTime);

    if (startMinutes === null || endMinutes === null) {
      return null;
    }

    // Handle case where end time is next day (e.g., 23:00 to 01:00)
    let duration = endMinutes - startMinutes;
    if (duration < 0) {
      duration += 24 * 60; // Add 24 hours
    }

    return duration;
  } catch (error) {
    console.error('Error calculating duration between times:', error);
    return null;
  }
};

/**
 * Calculates end time from start time and duration
 * @param startTime - Start time in HH:mm format
 * @param durationMinutes - Duration in minutes
 * @returns End time in HH:mm format, or null if calculation fails
 */
export const calculateEndTime = (
  startTime: string,
  durationMinutes: number
): string | null => {
  try {
    if (!startTime || isNaN(durationMinutes) || durationMinutes < 0) {
      return null;
    }

    const parts = startTime.split(':');
    if (parts.length < 2) {
      return null;
    }

    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);

    if (isNaN(hours) || isNaN(minutes)) {
      return null;
    }

    // Calculate total minutes since midnight
    const totalMinutes = hours * 60 + minutes + durationMinutes;

    // Calculate new hours and minutes
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;

    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating end time:', error);
    return null;
  }
};

/**
 * Validates duration value
 * @param duration - Duration in minutes
 * @param minDuration - Minimum allowed duration (default: 5 minutes)
 * @param maxDuration - Maximum allowed duration (default: 480 minutes / 8 hours)
 * @returns True if duration is valid
 */
export const isValidDuration = (
  duration: number | null | undefined,
  minDuration: number = 5,
  maxDuration: number = 480
): boolean => {
  if (duration === null || duration === undefined) {
    return false;
  }

  if (isNaN(duration)) {
    return false;
  }

  return duration >= minDuration && duration <= maxDuration;
};

/**
 * Normalizes duration to ensure it's within valid range
 * @param duration - Duration in minutes
 * @param minDuration - Minimum allowed duration (default: 5 minutes)
 * @param maxDuration - Maximum allowed duration (default: 480 minutes / 8 hours)
 * @param defaultDuration - Default duration if provided duration is invalid (default: 30 minutes)
 * @returns Normalized duration in minutes
 */
export const normalizeDuration = (
  duration: number | null | undefined,
  minDuration: number = 5,
  maxDuration: number = 480,
  defaultDuration: number = 30
): number => {
  if (duration === null || duration === undefined || isNaN(duration)) {
    return defaultDuration;
  }

  if (duration < minDuration) {
    return minDuration;
  }

  if (duration > maxDuration) {
    return maxDuration;
  }

  return Math.round(duration);
};

/**
 * Gets duration for calendar event positioning
 * Ensures minimum height for visibility
 * @param duration - Duration in minutes
 * @param minDisplayDuration - Minimum duration for display purposes (default: 15 minutes)
 * @returns Duration to use for calendar positioning
 */
export const getDisplayDuration = (
  duration: number | null | undefined,
  minDisplayDuration: number = 15
): number => {
  const normalized = normalizeDuration(duration);
  return Math.max(normalized, minDisplayDuration);
};


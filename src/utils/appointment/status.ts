/**
 * Status utility functions for handling appointment statuses
 * Backend returns: "scheduled", "completed", "cancelled" (lowercase)
 * Frontend uses: "Scheduled", "Completed", "Cancelled", "Expired" (capitalized)
 */

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'Expired';

/**
 * Valid status values from the backend API
 */
export const BACKEND_STATUSES = ['scheduled', 'completed', 'cancelled', 'expired'] as const;
export type BackendStatus = typeof BACKEND_STATUSES[number];

/**
 * Frontend status values (capitalized)
 */
export const FRONTEND_STATUSES: AppointmentStatus[] = ['Scheduled', 'Completed', 'Cancelled', 'Expired'];

/**
 * Maps backend status (lowercase) to frontend status (capitalized)
 * @param backendStatus - Status from API: "scheduled", "completed", or "cancelled"
 * @returns Frontend status: "Scheduled", "Completed", or "Cancelled"
 */
export function mapBackendStatusToFrontend(backendStatus: string | null | undefined): AppointmentStatus {
  if (!backendStatus || typeof backendStatus !== 'string') {
    console.warn('Invalid or missing appointment status. Defaulting to "Scheduled".', { backendStatus });
    return 'Scheduled';
  }

  const normalized = backendStatus.toLowerCase().trim();

  const statusMap: Record<string, AppointmentStatus> = {
    'scheduled': 'Scheduled',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'expired': 'Expired',
  };

  const mapped = statusMap[normalized];

  if (!mapped) {
    console.error(`Unknown appointment status: "${backendStatus}" (normalized: "${normalized}"). Defaulting to "Scheduled".`, {
      originalStatus: backendStatus,
    });
    return 'Scheduled';
  }

  return mapped;
}

/**
 * Checks if an appointment has a specific status (case-insensitive)
 * @param appointmentStatus - The appointment's status
 * @param targetStatus - The status to check against
 * @returns true if the statuses match (case-insensitive)
 */
export function hasStatus(
  appointmentStatus: string | null | undefined,
  targetStatus: AppointmentStatus
): boolean {
  if (!appointmentStatus || !targetStatus) {
    return false;
  }

  const normalizedAppointment = appointmentStatus.toLowerCase().trim();
  const normalizedTarget = targetStatus.toLowerCase().trim();

  return normalizedAppointment === normalizedTarget || appointmentStatus === targetStatus;
}

/**
 * Validates that a status is one of the valid frontend statuses
 * @param status - Status to validate
 * @returns true if status is valid
 */
export function isValidStatus(status: string | null | undefined): status is AppointmentStatus {
  if (!status) return false;
  return FRONTEND_STATUSES.includes(status as AppointmentStatus) ||
    BACKEND_STATUSES.includes(status.toLowerCase().trim() as BackendStatus);
}

/**
 * Normalizes a status to the frontend format (capitalized)
 * @param status - Status to normalize
 * @returns Normalized status or 'Scheduled' as default
 */
export function normalizeStatus(status: string | null | undefined): AppointmentStatus {
  return mapBackendStatusToFrontend(status);
}

/**
 * Checks if an appointment should be marked as expired
 * An appointment is expired if:
 * - It's scheduled (not completed or cancelled)
 * - The appointment end time (start time + duration) has passed
 * - It has no patient assigned (patientId is '0' or patientName is 'Available Slot')
 * @param appointment - Appointment object to check
 * @returns true if appointment should be marked as expired
 */
export function isExpiredAppointment(appointment: { status: string; patientId: string; patientName: string; createdAt: string; date: string; time: string; duration?: number }): boolean {
  // Never mark Completed or Cancelled appointments as expired
  if (hasStatus(appointment.status, 'Completed') || hasStatus(appointment.status, 'Cancelled')) {
    return false;
  }

  // Only check scheduled appointments
  if (!hasStatus(appointment.status, 'Scheduled')) {
    return false;
  }

  // Check if appointment has no patient assigned
  const hasNoPatient = !appointment.patientId ||
    appointment.patientId === '0' ||
    appointment.patientName === 'Available Slot';

  if (!hasNoPatient) {
    return false;
  }

  // Check if appointment end time (start time + duration) has passed
  try {
    const appointmentDateStr = appointment.createdAt || appointment.date;
    if (!appointmentDateStr) {
      return false;
    }

    // Parse the appointment start datetime
    let appointmentStart: Date;
    if (appointmentDateStr.includes('T')) {
      // Full datetime format: "2024-12-20T14:30:00"
      const [datePart, timePart] = appointmentDateStr.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds = 0] = (timePart || '00:00:00').split(':').map(part => parseInt(part, 10));
      appointmentStart = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
    } else {
      // Date only format: need to combine with time field
      const [year, month, day] = appointmentDateStr.split('-').map(Number);
      if (appointment.time && appointment.time.includes(':')) {
        const [hours, minutes] = appointment.time.split(':').map(Number);
        appointmentStart = new Date(year, month - 1, day, hours || 0, minutes || 0, 0);
      } else {
        // No time info, use start of day
        appointmentStart = new Date(year, month - 1, day, 0, 0, 0);
      }
    }

    if (isNaN(appointmentStart.getTime())) {
      return false;
    }

    // Calculate appointment end time (start time + duration in minutes)
    // Default duration is 30 minutes if not provided
    const durationMinutes = appointment.duration || 30;
    const appointmentEnd = new Date(appointmentStart.getTime() + durationMinutes * 60 * 1000);

    // Compare end time with current time
    const now = new Date();

    return appointmentEnd < now;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Error checking if appointment is expired:', error);
    }
    return false;
  }
}

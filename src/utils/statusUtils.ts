/**
 * Status utility functions for handling appointment statuses
 * Backend returns: "scheduled", "completed", "cancelled" (lowercase)
 * Frontend uses: "Scheduled", "Completed", "Cancelled" (capitalized)
 */

export type AppointmentStatus = 'Scheduled' | 'Completed' | 'Cancelled';

/**
 * Valid status values from the backend API
 */
export const BACKEND_STATUSES = ['scheduled', 'completed', 'cancelled'] as const;
export type BackendStatus = typeof BACKEND_STATUSES[number];

/**
 * Frontend status values (capitalized)
 */
export const FRONTEND_STATUSES: AppointmentStatus[] = ['Scheduled', 'Completed', 'Cancelled'];

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

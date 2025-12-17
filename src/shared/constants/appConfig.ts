/**
 * Application configuration constants
 */

export const APP_CONFIG = {
  // Token storage keys
  STORAGE_KEYS: {
    TOKEN: 'token',
    TOKEN_EXPIRATION: 'tokenExpiration',
  },

  // Default appointment duration in minutes
  DEFAULT_APPOINTMENT_DURATION: 30,

  // API timeout in milliseconds
  API_TIMEOUT: 30000,

  // Roles
  ROLES: {
    DOCTOR: 'DOCTOR',
    PATIENT: 'PATIENT',
    PARAMEDIC: 'PARAMEDIC',
  },

  // Auto-completion settings
  AUTO_COMPLETE: {
    CHECK_INTERVAL_MS: 60000, // 1 minute
    GRACE_PERIOD_MINUTES: 5, // 5 minutes after end time
  },

  // Slot opening end time (6 PM)
  SLOT_END_TIME: {
    HOUR: 18, // 6 PM
    MINUTE: 0,
  },
} as const;

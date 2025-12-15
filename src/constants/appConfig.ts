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
} as const;


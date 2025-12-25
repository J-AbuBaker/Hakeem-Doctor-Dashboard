/**
 * API endpoint constants
 * Centralized location for all API endpoints
 */

export const API_ENDPOINTS = {
  // Authentication endpoints
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    DOCTORS: '/auth/doctors',
  },

  // User endpoints
  USER: {
    INFO: '/me/info',
  },

  // Appointment endpoints
  APPOINTMENT: {
    DOCTOR_SCHEDULED: '/appointment/doctor/scheduled',
    DOCTOR_SCHEDULE: '/appointment/doctor/schedule',
    DOCTOR_COMPLETE: '/appointment/doctor/complete',
  },

  // Doctor endpoints
  DOCTOR: {
    BY_ID: (id: string) => `/doctors/${id}`,
    SEARCH: '/doctors',
  },

  // Medical Records endpoints
  MEDICAL_RECORDS: {
    INTERVIEWS: (userId: string) => `/medical-records/interviews/${userId}`,
    RISK_FACTORS: (patientId: string) => `/medical-records/risk-factors/patient/${patientId}`,
  },
} as const;

// Authentication Types
export interface SignUpUserDto {
  username: string;
  password: string;
  name: string;
  dob: string; // ISO 8601 date string
  gender: boolean; // true = male, false = female
  blood_type: string;
  age: number;
  weight: number;
  ph_num: number;
  specialization: string;
  license: number;
  description: string;
  x: number; // longitude
  y: number; // latitude
  role: string; // user role: "doctor", "patient", "paramedic"
}

export interface LoginUserDto {
  username: string;
  password: string;
}

export interface ForgotPasswordRequest {
  username: string;
}

export interface ResetPasswordRequest {
  username: string;
  password: string;
  code: string;
}

// Role object structure from API (from signup response)
export interface Role {
  id: number;
  role: string; // "DOCTOR", "PARAMEDIC", "PATIENT", etc.
}

// Login response (from /auth/login)
export interface LoginResponse {
  token: string;
  username: string;
  expiresIn: number;
}

// Signup response (from /auth/signup)
export interface SignupResponse {
  token: string;
  username: string;
  role: Role; // Role object with id and role fields
}

// Legacy AuthResponse for backward compatibility
export type AuthResponse = LoginResponse | SignupResponse;

// User Info response from /me/info endpoint
export interface UserInfo {
  id: number;
  username: string;
  name: string;
  dob: string; // ISO 8601 date string
  gender: boolean; // true = male, false = female
  bloodType: string;
  age: number;
  weight: number;
  phoneNumber: number;
  specialization: string;
  license: number;
  description: string;
  latitude: number;
  longitude: number;
  role: string; // "DOCTOR", "PARAMEDIC", "PATIENT", etc.
}

// Doctor Types
export interface Doctor {
  id: string;
  username: string;
  name: string;
  dob: string;
  gender: boolean;
  blood_type: string;
  age: number;
  weight: number;
  ph_num: number;
  specialization: string;
  license: number;
  description: string;
  x: number;
  y: number;
  role: string;
}

/**
 * Appointment interface representing a scheduled medical appointment
 */
export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Approved' | 'Completed' | 'Cancelled';
  appointmentType?: string;
  duration?: number; // Duration in minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentDto {
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  date?: string;
  time?: string;
  notes?: string;
  status?: 'Scheduled' | 'Completed' | 'Cancelled';
}

/**
 * API response type for scheduled appointments
 * Fields may be null for available slots when no patient is assigned
 */
export interface ScheduledAppointmentResponse {
  id: number;
  doctorId: number;
  patientId: number | null; // Can be null for available slots
  doctorName: string | null; // Can be null
  patientName: string | null; // Can be null for available slots
  patientUsername: string | null; // Can be null
  doctorUsername: string | null; // Can be null
  appointmentDate: string; // date-time format: "2024-12-20T10:00:00"
  appointmentType: string | null; // enum: "checkup" | "followup" | "consultation" | "emergency" - can be null
  appointmentStatus: string; // enum: "scheduled" | "completed" | "cancelled"
}

// Request DTO for opening slots (DoctorAppointmentScheduleRequest)
export interface OpenSlotRequest {
  appointment_date: string; // ISO 8601 format: "2024-12-20T10:00:00"
}

// Specialization Options
export const SPECIALIZATIONS = [
  'Allergologist',
  'Angiologist',
  'Cardiologist',
  'Dentist',
  'Dermatologist',
  'Diabetologist',
  'Endocrinologist',
  'ENT doctor',
  'Gastroenterologist',
  'General Practitioner',
  'Gynecologist',
  'Hematologist',
  'Infectologist',
  'Internal Medicine Specialist',
  'Maxillofacial surgeon',
  'Neonatologist',
  'Nephrologist',
  'Neurologist',
  'Oncologist',
  'Ophthalmologist',
  'Orthopedist',
  'Pediatrician',
  'Psychiatrist',
  'Pulmonologist',
  'Rheumatologist',
  'Surgeon',
  'Toxicologist',
  'Urologist'
] as const;

export type Specialization = typeof SPECIALIZATIONS[number];

// Blood Type Options
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type BloodType = typeof BLOOD_TYPES[number];


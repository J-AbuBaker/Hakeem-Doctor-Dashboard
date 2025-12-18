/**
 * Authentication-related types
 */

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

export interface Role {
  id: number;
  role: string; // "DOCTOR", "PARAMEDIC", "PATIENT", etc.
}

export interface LoginResponse {
  token: string;
  username: string;
  expiresIn: number;
}

export interface SignupResponse {
  token: string;
  username: string;
  role: Role; // Role object with id and role fields
}

export type AuthResponse = LoginResponse | SignupResponse;

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
  city?: string; // City name (optional - not returned by API yet)
  town?: string; // Town name (optional - not returned by API yet)
}


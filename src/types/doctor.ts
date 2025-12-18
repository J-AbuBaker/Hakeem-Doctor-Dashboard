/**
 * Doctor-related types
 */

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
  city?: string; // City name (optional - not returned by API yet)
  town?: string; // Town name (optional - not returned by API yet)
}

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
  'Urologist',
] as const;

export type Specialization = typeof SPECIALIZATIONS[number];

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type BloodType = typeof BLOOD_TYPES[number];


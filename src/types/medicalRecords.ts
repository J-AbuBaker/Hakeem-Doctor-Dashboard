/**
 * Medical Records-related types
 */

export interface Symptom {
  id: number;
  name: string;
}

export interface Diagnosis {
  id: number;
  name: string;
  probability: number;
}

export interface DoctorRecommendation {
  id: number;
  name: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface MedicalInterview {
  interview_id: number;
  patient_id: number;
  questions_and_answers: QuestionAnswer[];
  started_at: string;
  symptoms: Symptom[];
  diagnoses: Diagnosis[];
  doctor_recommendation: DoctorRecommendation;
  triage: string | null;
}

export interface RiskFactorResponse {
  id: number;
  patient_id: number;
  factor_name: string;
}

export interface RiskFactors {
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
}

export interface PatientProfile {
  patientId: string;
  patientName: string;
  interviews: MedicalInterview[];
  riskFactors: RiskFactors;
}


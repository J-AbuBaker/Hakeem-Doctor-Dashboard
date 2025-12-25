import api from '@infrastructure/api/client';
import { MedicalInterview, RiskFactorResponse } from '../../../types/medicalRecords';
import { API_ENDPOINTS } from '@shared/constants/apiEndpoints';
import { TypedAxiosError } from '@shared/types/common/errors';

class MedicalRecordsService {
  async getPatientInterviews(userId: string): Promise<MedicalInterview[]> {
    try {
      if (!userId || userId === '0') {
        throw new Error('Invalid user ID: user ID is required and must be a valid patient ID');
      }

      const response = await api.get<MedicalInterview[]>(
        API_ENDPOINTS.MEDICAL_RECORDS.INTERVIEWS(userId)
      );

      if (!response.data) {
        return [];
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [response.data];
    } catch (error: unknown) {
      const typedError = error as TypedAxiosError;
      
      if (import.meta.env.DEV) {
        console.error('Error fetching patient interviews:', typedError);
      }

      throw typedError;
    }
  }

  async getPatientRiskFactors(patientId: string): Promise<RiskFactorResponse[]> {
    try {
      if (!patientId || patientId === '0') {
        throw new Error('Invalid patient ID: patient ID is required and must be a valid patient ID');
      }

      const response = await api.get<RiskFactorResponse[]>(
        API_ENDPOINTS.MEDICAL_RECORDS.RISK_FACTORS(patientId)
      );

      if (!response.data) {
        return [];
      }

      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [response.data];
    } catch (error: unknown) {
      const typedError = error as TypedAxiosError;
      
      if (import.meta.env.DEV) {
        console.error('Error fetching patient risk factors:', typedError);
      }

      throw typedError;
    }
  }
}

export default new MedicalRecordsService();


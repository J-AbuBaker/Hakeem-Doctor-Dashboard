import api from '../infrastructure/api/client';
import { Doctor } from '../types';
import { API_ENDPOINTS } from '../shared/constants/apiEndpoints';
import { IDoctorService } from '../shared/services/interfaces/IDoctorService';

class DoctorService implements IDoctorService {
  async getDoctorById(id: string): Promise<Doctor> {
    const response = await api.get<Doctor>(API_ENDPOINTS.DOCTOR.BY_ID(id));
    return response.data;
  }

  async searchDoctors(params?: {
    specialization?: string;
    name?: string;
  }): Promise<Doctor[]> {
    const response = await api.get<Doctor[]>(API_ENDPOINTS.DOCTOR.SEARCH, { params });
    return response.data;
  }
}

export default new DoctorService();


import api from '../utils/api';
import { Doctor } from '../types';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

class DoctorService {
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


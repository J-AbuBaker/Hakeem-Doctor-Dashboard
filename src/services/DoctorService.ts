import api from '../utils/api';
import { Doctor } from '../types';

class DoctorService {
  async getDoctorById(id: string): Promise<Doctor> {
    const response = await api.get<Doctor>(`/doctors/${id}`);
    return response.data;
  }

  async searchDoctors(params?: {
    specialization?: string;
    name?: string;
  }): Promise<Doctor[]> {
    const response = await api.get<Doctor[]>('/doctors', { params });
    return response.data;
  }
}

export default new DoctorService();


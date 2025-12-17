import { Doctor } from '../../../types';

/**
 * Doctor service interface
 * Defines the contract for doctor-related operations
 */
export interface IDoctorService {
  /**
   * Get doctor by ID
   */
  getDoctorById(id: string): Promise<Doctor>;

  /**
   * Search doctors with optional filters
   */
  searchDoctors(params?: {
    specialization?: string;
    name?: string;
  }): Promise<Doctor[]>;
}

import api from '../utils/api';
import {
  Appointment,
  ScheduledAppointmentResponse,
  OpenSlotRequest,
} from '../types';
import { mapBackendStatusToFrontend } from '../utils/statusUtils';
import {
  parseDateTimeString,
  formatDateToString,
  formatTimeToString,
  isValidDateTime,
} from '../utils/dateParsing';
import { formatAppointmentType } from '../utils/stringUtils';
import { API_ENDPOINTS } from '../constants/apiEndpoints';
import { APP_CONFIG } from '../constants/appConfig';
import { TypedAxiosError } from '../types/errors';

class AppointmentService {

  private mapScheduledAppointmentToAppointment(apiAppointment: ScheduledAppointmentResponse): Appointment {
    if (!apiAppointment) {
      throw new Error('Invalid appointment data: appointment is null or undefined');
    }

    const appointmentDate = parseDateTimeString(apiAppointment.appointmentDate);
    if (!appointmentDate) {
      console.error('Error parsing appointment date:', apiAppointment);
      throw new Error(`Failed to parse appointment date: ${apiAppointment.appointmentDate}`);
    }

    const dateStr = formatDateToString(appointmentDate);
    const timeStr = formatTimeToString(appointmentDate);

    let status = mapBackendStatusToFrontend(apiAppointment.appointmentStatus);

    const appointmentType = apiAppointment.appointmentType || '';
    const formattedType = formatAppointmentType(appointmentType);

    const notesParts: string[] = [];
    if (formattedType) {
      notesParts.push(`Type: ${formattedType}`);
    }

    const duration = APP_CONFIG.DEFAULT_APPOINTMENT_DURATION;

    const patientId = (apiAppointment.patientId != null) ? apiAppointment.patientId.toString() : '0';
    
    let patientName: string;
    
    if (apiAppointment.patientName != null && 
        typeof apiAppointment.patientName === 'string' && 
        apiAppointment.patientName.trim() !== '') {
      patientName = apiAppointment.patientName.trim();
    } 
    else if (apiAppointment.patientId != null && apiAppointment.patientId !== 0) {
      patientName = `Patient #${apiAppointment.patientId}`;
    } 
    else {
      patientName = 'Available Slot';
    }

    const validStatuses: Array<'Scheduled' | 'Completed' | 'Cancelled'> = ['Scheduled', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      console.error(`Invalid status after mapping: "${status}". Defaulting to "Scheduled".`, {
        originalStatus: apiAppointment.appointmentStatus,
        appointmentId: apiAppointment.id,
      });
      status = 'Scheduled';
    }

    const mappedAppointment: Appointment = {
      id: (apiAppointment.id != null) ? apiAppointment.id.toString() : '0',
      doctorId: (apiAppointment.doctorId != null) ? apiAppointment.doctorId.toString() : '0',
      patientId: patientId,
      patientName: patientName,
      date: dateStr,
      time: timeStr,
      status: status,
      appointmentType: formattedType || undefined,
      duration: duration,
      notes: notesParts.length > 0 ? notesParts.join(' • ') : undefined,
      createdAt: apiAppointment.appointmentDate,
      updatedAt: apiAppointment.appointmentDate,
    };

    return mappedAppointment;
  }

  /**
   * Fetches scheduled appointments for the authenticated doctor
   */
  async getScheduledAppointments(): Promise<Appointment[]> {
    try {
      const response = await api.get<ScheduledAppointmentResponse[] | ScheduledAppointmentResponse>(
        API_ENDPOINTS.APPOINTMENT.DOCTOR_SCHEDULED
      );

      if (!response.data) {
        return [];
      }

      let data: ScheduledAppointmentResponse[];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (typeof response.data === 'object') {
        data = [response.data];
      } else {
        return [];
      }

      const appointments: Appointment[] = [];
      for (const item of data) {
        if (item) {
          try {
            const mapped = this.mapScheduledAppointmentToAppointment(item);
            appointments.push(mapped);
          } catch (error: unknown) {
            if (import.meta.env.DEV) {
              console.error('Error mapping appointment:', error);
            }
          }
        }
      }

      return appointments;
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error('Error fetching scheduled appointments:', error);
      }
      // Re-throw to let the context handle it
      throw error;
    }
  }

  /**
   * Opens a new appointment slot for the authenticated doctor
   * @param appointmentDate - LocalDateTime format: "YYYY-MM-DDTHH:mm:ss"
   */
  async openSlot(appointmentDate: string): Promise<void> {
    if (!appointmentDate || typeof appointmentDate !== 'string') {
      throw new Error('Invalid appointment date: date is required and must be a string');
    }

    if (!isValidDateTime(appointmentDate)) {
      throw new Error(`Invalid datetime format. Expected "YYYY-MM-DDTHH:mm:ss", got: ${appointmentDate}`);
    }

    const request: OpenSlotRequest = {
      appointment_date: appointmentDate,
    };

    try {
      await api.post<OpenSlotRequest>(API_ENDPOINTS.APPOINTMENT.DOCTOR_SCHEDULE, request);
    } catch (error: unknown) {
      const axiosError = error as TypedAxiosError;
      const errorMessage = 
        (typeof axiosError.response?.data === 'object' && axiosError.response.data && 'message' in axiosError.response.data)
          ? (axiosError.response.data as { message?: string }).message
          : typeof axiosError.response?.data === 'string'
          ? axiosError.response.data
          : axiosError.message || 'Failed to open slot';
      throw new Error(`Failed to schedule slot at ${appointmentDate}: ${errorMessage}`);
    }
  }

  /**
   * Marks an appointment as completed
   * @param id - Appointment identifier
   */
  async completeAppointment(id: string): Promise<Appointment> {
    try {
      const appointmentId = parseInt(id, 10);
      if (isNaN(appointmentId) || appointmentId <= 0) {
        throw new Error(`Invalid appointment ID: ${id}. ID must be a positive number.`);
      }

      const url = `${API_ENDPOINTS.APPOINTMENT.DOCTOR_COMPLETE}?appointmentId=${appointmentId}`;
      const response = await api.put<ScheduledAppointmentResponse>(url, null);

      if (!response || !response.data) {
        throw new Error('Invalid response from server: No data received');
      }

      if (!response.data.patientId || response.data.patientId === null) {
        throw new Error('Cannot complete an available slot. Only appointments with patients can be marked as completed.');
      }

      try {
        const mappedAppointment = this.mapScheduledAppointmentToAppointment(response.data);

        if (mappedAppointment.status !== 'Completed') {
          mappedAppointment.status = 'Completed';
        }

        return mappedAppointment;
      } catch (mappingError: unknown) {
        const error = mappingError instanceof Error ? mappingError : new Error('Unknown mapping error');
        if (import.meta.env.DEV) {
          console.error('Error mapping completed appointment:', error);
        }
        throw new Error(`Failed to process completed appointment data: ${error.message || 'Unknown mapping error'}`);
      }
    } catch (error: unknown) {
      const axiosError = error as TypedAxiosError;
      if (axiosError.response) {
        const status = axiosError.response.status;
        const errorData = axiosError.response.data;
        const errorMessage = 
          (typeof errorData === 'object' && errorData && 'message' in errorData)
            ? (errorData as { message?: string }).message
            : typeof errorData === 'string'
            ? errorData
            : undefined;

        switch (status) {
          case 400:
            throw new Error(`Invalid request: ${errorMessage || 'Invalid appointment ID or request format'}`);
          case 401:
            throw new Error('Unauthorized: Please log in again to complete this appointment');
          case 403:
            throw new Error('Forbidden: You do not have permission to complete this appointment');
          case 404:
            throw new Error(`Appointment not found: The appointment with ID ${id} does not exist`);
          case 500:
            throw new Error('Server error: Please try again later or contact support');
          default:
            throw new Error(errorMessage || `Failed to complete appointment (Status: ${status})`);
        }
      } else if (axiosError.request) {
        throw new Error('Network error: Unable to reach the server. Please check your connection and try again.');
      } else {
        // Re-throw our custom errors
        throw error instanceof Error ? error : new Error('Unknown error occurred');
      }
    }
  }
}

export default new AppointmentService();


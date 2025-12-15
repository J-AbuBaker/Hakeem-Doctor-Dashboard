import api from '../utils/api';
import {
  Appointment,
  ScheduledAppointmentResponse,
  OpenSlotRequest,
} from '../types';
import { mapBackendStatusToFrontend } from '../utils/statusUtils';

class AppointmentService {
  /**
   * Capitalizes the first letter of a string
   */
  private capitalizeFirst(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Formats appointment type for display
   */
  private formatAppointmentType(appointmentType: string): string {
    if (!appointmentType) return '';
    return appointmentType
      .split(/[\s_-]+/)
      .map(word => this.capitalizeFirst(word))
      .join(' ');
  }

  private mapScheduledAppointmentToAppointment(apiAppointment: ScheduledAppointmentResponse): Appointment {
    if (!apiAppointment) {
      throw new Error('Invalid appointment data: appointment is null or undefined');
    }

    let appointmentDate: Date;
    try {
      const dateStr = apiAppointment.appointmentDate;
      if (!dateStr) {
        throw new Error('appointmentDate is missing');
      }

      if (dateStr.includes('T')) {
        const [datePart, timePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes, seconds] = (timePart || '00:00:00').split(':').map(part => parseInt(part, 10));
        appointmentDate = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
      } else {
        appointmentDate = new Date(dateStr);
      }

      if (isNaN(appointmentDate.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}`);
      }
    } catch (error) {
      console.error('Error parsing appointment date:', error, apiAppointment);
      throw new Error(`Failed to parse appointment date: ${apiAppointment.appointmentDate}`);
    }

    const year = appointmentDate.getFullYear();
    const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
    const day = String(appointmentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const hours = String(appointmentDate.getHours()).padStart(2, '0');
    const minutes = String(appointmentDate.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    let status = mapBackendStatusToFrontend(apiAppointment.appointmentStatus);

    const appointmentType = apiAppointment.appointmentType || '';
    const formattedType = this.formatAppointmentType(appointmentType);

    const notesParts: string[] = [];
    if (formattedType) {
      notesParts.push(`Type: ${formattedType}`);
    }

    const duration = 30;

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
      const response = await api.get<ScheduledAppointmentResponse[] | ScheduledAppointmentResponse>('/appointment/doctor/scheduled');

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
          } catch (error: any) {
            console.error('Error mapping appointment:', error);
          }
        }
      }

      return appointments;
    } catch (error: any) {
      console.error('Error fetching scheduled appointments:', error);
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

    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    if (!dateTimeRegex.test(appointmentDate)) {
      throw new Error(`Invalid datetime format. Expected "YYYY-MM-DDTHH:mm:ss", got: ${appointmentDate}`);
    }

    const [datePart, timePart] = appointmentDate.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error(`Invalid date components: ${appointmentDate}`);
    }
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
      throw new Error(`Invalid time components: ${appointmentDate}`);
    }

    const testDate = new Date(year, month - 1, day, hours, minutes, seconds);
    if (
      testDate.getFullYear() !== year ||
      testDate.getMonth() !== month - 1 ||
      testDate.getDate() !== day ||
      testDate.getHours() !== hours ||
      testDate.getMinutes() !== minutes ||
      testDate.getSeconds() !== seconds
    ) {
      throw new Error(`Invalid date: ${appointmentDate}`);
    }

    const request: OpenSlotRequest = {
      appointment_date: appointmentDate,
    };

    try {
      await api.post<OpenSlotRequest>('/appointment/doctor/schedule', request);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to open slot';
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

      const url = `/appointment/doctor/complete?appointmentId=${appointmentId}`;
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
      } catch (mappingError: any) {
        console.error('Error mapping completed appointment:', mappingError);
        throw new Error(`Failed to process completed appointment data: ${mappingError.message || 'Unknown mapping error'}`);
      }
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        switch (status) {
          case 400:
            throw new Error(`Invalid request: ${errorData?.message || 'Invalid appointment ID or request format'}`);
          case 401:
            throw new Error('Unauthorized: Please log in again to complete this appointment');
          case 403:
            throw new Error('Forbidden: You do not have permission to complete this appointment');
          case 404:
            throw new Error(`Appointment not found: The appointment with ID ${id} does not exist`);
          case 500:
            throw new Error('Server error: Please try again later or contact support');
          default:
            throw new Error(errorData?.message || `Failed to complete appointment (Status: ${status})`);
        }
      } else if (error.request) {
        throw new Error('Network error: Unable to reach the server. Please check your connection and try again.');
      } else {
        // Re-throw our custom errors
        throw error;
      }
    }
  }
}

export default new AppointmentService();


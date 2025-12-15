import React, { createContext, useContext, useState, ReactNode } from 'react';
import AppointmentService from '../services/AppointmentService';
import { Appointment } from '../types';
import { hasStatus } from '../utils/statusUtils';
import { getStoredToken, decodeToken } from '../utils/jwtUtils';

interface AppointmentContextType {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  fetchAppointments: (params?: { status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'All'; date?: string }) => Promise<void>;
  openSlot: (appointmentDate: string) => Promise<void>;
  openSlotWithoutRefresh: (appointmentDate: string) => Promise<void>;
  completeAppointment: (id: string) => Promise<Appointment>;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};

interface AppointmentProviderProps {
  children: ReactNode;
}

export const AppointmentProvider: React.FC<AppointmentProviderProps> = ({ children }) => {
  // Initialize with empty array - will be populated from API
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async (params?: { status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'All'; date?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching appointments from API...');

      // Check token before making request
      const token = getStoredToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Decode token to check role
      const payload = decodeToken(token);
      if (payload) {
        console.log('🔍 Current user info from token:', {
          username: payload.sub || payload.username,
          role: payload.role,
          exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'N/A',
        });

        if (payload.role && payload.role.toUpperCase() !== 'DOCTOR') {
          console.warn(`⚠️ Warning: User role in token is "${payload.role}", but DOCTOR role is required.`);
        }
      }

      // Fetch appointments from API
      const data = await AppointmentService.getScheduledAppointments();
      console.log(`Fetched ${data.length} appointments from API`);

      // Apply filters if needed
      let filtered = data;
      if (params?.status && params.status !== 'All') {
        filtered = data.filter(apt => hasStatus(apt.status, params.status as 'Scheduled' | 'Completed' | 'Cancelled'));
        console.log(`Filtered to ${filtered.length} appointments with status: ${params.status}`);
      }
      if (params?.date) {
        filtered = filtered.filter(apt => apt.date === params.date);
        console.log(`Filtered to ${filtered.length} appointments for date: ${params.date}`);
      }

      // Set appointments (even if empty array)
      setAppointments(filtered);
      console.log(`Set ${filtered.length} appointments in state`);

      if (filtered.length === 0 && data.length === 0) {
        console.warn('No appointments found in API response. Check if there are appointments in the database.');
      }
    } catch (err: any) {
      console.error('Failed to fetch appointments from API:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
      });

      // Provide more helpful error message for 403
      if (err.response?.status === 403) {
        const token = getStoredToken();
        const payload = token ? decodeToken(token) : null;
        const roleInfo = payload?.role || 'Not found in token';
        setError(
          `Access Denied (403): Your account does not have the DOCTOR role required to access appointments. ` +
            `Current role: ${roleInfo}. ` +
            `Please contact your administrator to update your account role, or log in with a doctor account.`
        );
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load appointments. Please try again.');
      }
      // Set empty array on error
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openSlot = async (appointmentDate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Convert date and time to ISO format for backend
      // appointmentDate should be in format: "YYYY-MM-DDTHH:mm:ss" (ISO 8601)
      await AppointmentService.openSlot(appointmentDate);
      // Refresh appointments after opening slot
      await fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to open slot');
      throw err; // Re-throw to allow UI to handle error
    } finally {
      setIsLoading(false);
    }
  };

  // Version without automatic refresh - for batch operations
  const openSlotWithoutRefresh = async (appointmentDate: string) => {
    await AppointmentService.openSlot(appointmentDate);
  };

  const completeAppointment = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Validate ID before making the call
      if (!id || id.trim() === '') {
        throw new Error('Appointment ID is required');
      }

      const completed = await AppointmentService.completeAppointment(id);

      // Validate the completed appointment
      if (!completed || !completed.id) {
        throw new Error('Invalid response: Completed appointment data is missing');
      }

      setAppointments((prev) => {
        const appointmentExists = prev.some(apt => apt.id === id);
        if (!appointmentExists) {
          return [...prev, completed];
        }

        return prev.map((apt) => {
          if (apt.id === id) {
            return {
              ...completed,
              status: 'Completed' as const,
            };
          }
          return apt;
        });
      });

      // Return success indicator
      return completed;
    } catch (err: any) {
      console.error('Failed to complete appointment:', {
        id,
        error: err,
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      // Set user-friendly error message
      const errorMessage = err.message || err.response?.data?.message || 'Failed to complete appointment. Please try again.';
      setError(errorMessage);

      // Re-throw to allow UI to handle error
      throw err;
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        isLoading,
        error,
        fetchAppointments,
        openSlot,
        openSlotWithoutRefresh,
        completeAppointment,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};


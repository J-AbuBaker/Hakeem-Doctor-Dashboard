import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AppointmentService from '../services/AppointmentService';
import { Appointment } from '../types';
import { hasStatus } from '../utils/statusUtils';
import { getStoredToken, decodeToken } from '../utils/jwtUtils';
import { TypedAxiosError } from '../types/errors';

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

// eslint-disable-next-line react-refresh/only-export-components
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

  const fetchAppointments = useCallback(async (params?: { status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'All'; date?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      // Check token before making request
      const token = getStoredToken();
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Decode token to check role
      const payload = decodeToken(token);
      if (payload && payload.role && payload.role.toUpperCase() !== 'DOCTOR') {
        if (import.meta.env.DEV) {
          console.warn(`⚠️ Warning: User role in token is "${payload.role}", but DOCTOR role is required.`);
        }
      }

      // Fetch appointments from API
      const data = await AppointmentService.getScheduledAppointments();

      // Apply filters if needed
      let filtered = data;
      if (params?.status && params.status !== 'All') {
        filtered = data.filter(apt => hasStatus(apt.status, params.status as 'Scheduled' | 'Completed' | 'Cancelled'));
      }
      if (params?.date) {
        filtered = filtered.filter(apt => apt.date === params.date);
      }

      // Set appointments (even if empty array)
      setAppointments(filtered);
    } catch (err: unknown) {
      const error = err as TypedAxiosError;
      if (import.meta.env.DEV) {
        console.error('Failed to fetch appointments from API:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
      }

      // Provide more helpful error message for 403
      if (error.response?.status === 403) {
        const token = getStoredToken();
        const payload = token ? decodeToken(token) : null;
        const roleInfo = payload?.role || 'Not found in token';
        setError(
          `Access Denied (403): Your account does not have the DOCTOR role required to access appointments. ` +
            `Current role: ${roleInfo}. ` +
            `Please contact your administrator to update your account role, or log in with a doctor account.`
        );
      } else {
        const errorMessage = 
          (typeof error.response?.data === 'object' && error.response.data && 'message' in error.response.data)
            ? (error.response.data as { message?: string }).message
            : typeof error.response?.data === 'string'
            ? error.response.data
            : error.message || 'Failed to load appointments. Please try again.';
        setError(errorMessage || null);
      }
      // Set empty array on error
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openSlot = useCallback(async (appointmentDate: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Convert date and time to ISO format for backend
      // appointmentDate should be in format: "YYYY-MM-DDTHH:mm:ss" (ISO 8601)
      await AppointmentService.openSlot(appointmentDate);
      // Refresh appointments after opening slot
      await fetchAppointments();
    } catch (err: unknown) {
      const error = err as TypedAxiosError;
      const errorMessage = 
        (typeof error.response?.data === 'object' && error.response.data && 'message' in error.response.data)
          ? (error.response.data as { message?: string }).message
          : typeof error.response?.data === 'string'
          ? error.response.data
          : 'Failed to open slot';
      setError(errorMessage || null);
      throw error; // Re-throw to allow UI to handle error
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments]);

  // Version without automatic refresh - for batch operations
  const openSlotWithoutRefresh = useCallback(async (appointmentDate: string) => {
    await AppointmentService.openSlot(appointmentDate);
  }, []);

  const completeAppointment = useCallback(async (id: string) => {
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
    } catch (err: unknown) {
      const error = err as TypedAxiosError;
      if (import.meta.env.DEV) {
        console.error('Failed to complete appointment:', {
          id,
          error,
          message: error.message,
          response: error.response ? error.response.data : undefined,
          status: error.response ? error.response.status : undefined,
        });
      }

      // Set user-friendly error message
      let errorMessage = error.message || 'Failed to complete appointment. Please try again.';
      if (error.response) {
        if (typeof error.response.data === 'object' && error.response.data && 'message' in error.response.data) {
          errorMessage = (error.response.data as { message?: string }).message || errorMessage;
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      setError(errorMessage || null);

      // Re-throw to allow UI to handle error
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);


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


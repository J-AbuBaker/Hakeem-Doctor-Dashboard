import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import AppointmentService from '../services/AppointmentService';
import { Appointment } from '../types';
import { hasStatus } from '../utils/statusUtils';
import { getStoredToken, decodeToken } from '../utils/jwtUtils';
import { TypedAxiosError } from '../types/errors';
import { getAppointmentsToAutoComplete } from '../utils/appointmentAutoComplete';
import { APP_CONFIG } from '../constants/appConfig';

interface LoadingState {
  fetching: boolean;
  openingSlot: boolean;
  completing: boolean;
}

interface AppointmentContextType {
  appointments: Appointment[];
  isLoading: boolean;
  loadingState: LoadingState;
  error: string | null;
  lastFetchTime: number | null;
  fetchAppointments: (params?: { status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'All'; date?: string }) => Promise<void>;
  openSlot: (appointmentDate: string) => Promise<void>;
  openSlotWithoutRefresh: (appointmentDate: string) => Promise<void>;
  completeAppointment: (id: string) => Promise<Appointment>;
  refreshAppointments: () => Promise<void>;
  clearError: () => void;
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
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    fetching: false,
    openingSlot: false,
    completing: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Store previous state for rollback on error
  const previousStateRef = useRef<Appointment[]>([]);
  const optimisticUpdateRef = useRef<{ id: string; appointment: Appointment } | null>(null);

  // Track appointments currently being processed for auto-completion to prevent duplicates
  const processingAppointmentsRef = useRef<Set<string>>(new Set());

  // Helper function to extract error message
  const extractErrorMessage = useCallback((err: unknown): string => {
    const error = err as TypedAxiosError;
    if (error.response?.data) {
      if (typeof error.response.data === 'object' && 'message' in error.response.data) {
        return (error.response.data as { message?: string }).message || 'An error occurred';
      }
      if (typeof error.response.data === 'string') {
        return error.response.data;
      }
    }
    return error.message || 'An unexpected error occurred';
  }, []);

  // Fetch appointments with proper state tracking
  const fetchAppointments = useCallback(async (params?: { status?: 'Scheduled' | 'Completed' | 'Cancelled' | 'All'; date?: string }) => {
    setLoadingState(prev => ({ ...prev, fetching: true }));
    setError(null);

    // Store previous state for potential rollback using functional update
    setAppointments((prev) => {
      previousStateRef.current = [...prev];
      return prev;
    });

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

      // Fetch appointments from API - this is the source of truth
      const apiData = await AppointmentService.getScheduledAppointments();

      // Apply filters if needed (client-side filtering after API response)
      let filtered = apiData;
      if (params?.status && params.status !== 'All') {
        filtered = apiData.filter(apt => hasStatus(apt.status, params.status as 'Scheduled' | 'Completed' | 'Cancelled'));
      }
      if (params?.date) {
        filtered = filtered.filter(apt => apt.date === params.date);
      }

      // Update state with API response - this ensures state matches API exactly
      setAppointments(filtered);
      setLastFetchTime(Date.now());

      // Clear any optimistic updates since we have fresh data
      optimisticUpdateRef.current = null;
    } catch (err: unknown) {
      const error = err as TypedAxiosError;

      // Rollback to previous state on error
      setAppointments(previousStateRef.current);

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
        const errorMessage = extractErrorMessage(error);
        setError(errorMessage || 'Failed to load appointments. Please try again.');
      }
    } finally {
      setLoadingState(prev => ({ ...prev, fetching: false }));
    }
  }, [extractErrorMessage]);

  // Open slot with proper state tracking
  const openSlot = useCallback(async (appointmentDate: string) => {
    setLoadingState(prev => ({ ...prev, openingSlot: true }));
    setError(null);

    // Store previous state for rollback using functional update
    setAppointments((prev) => {
      previousStateRef.current = [...prev];
      return prev;
    });

    try {
      // Call API to open slot
      await AppointmentService.openSlot(appointmentDate);

      // Refresh appointments from API to get the actual state
      // This ensures state matches API response exactly
      await fetchAppointments();
    } catch (err: unknown) {
      const error = err as TypedAxiosError;

      // Rollback to previous state on error
      setAppointments(previousStateRef.current);

      const errorMessage = extractErrorMessage(error);
      setError(errorMessage || 'Failed to open slot. Please try again.');
      throw error; // Re-throw to allow UI to handle error
    } finally {
      setLoadingState(prev => ({ ...prev, openingSlot: false }));
    }
  }, [fetchAppointments, extractErrorMessage]);

  // Version without automatic refresh - for batch operations
  const openSlotWithoutRefresh = useCallback(async (appointmentDate: string) => {
    await AppointmentService.openSlot(appointmentDate);
  }, []);

  // Complete appointment with optimistic update and proper API response tracking
  const completeAppointment = useCallback(async (id: string) => {
    setLoadingState(prev => ({ ...prev, completing: true }));
    setError(null);

    // Validate ID before making the call
    if (!id || id.trim() === '') {
      setLoadingState(prev => ({ ...prev, completing: false }));
      throw new Error('Appointment ID is required');
    }

    // Store previous state and perform optimistic update using functional update
    let appointmentToUpdate: Appointment | undefined;
    setAppointments((prev) => {
      previousStateRef.current = [...prev];
      appointmentToUpdate = prev.find(apt => apt.id === id);

      // Optimistic update - update UI immediately for better UX
      if (appointmentToUpdate) {
        optimisticUpdateRef.current = { id, appointment: { ...appointmentToUpdate, status: 'Completed' as const } };
        return prev.map((apt) =>
          apt.id === id
            ? { ...apt, status: 'Completed' as const }
            : apt
        );
      }
      return prev;
    });

    try {
      // Call API to complete appointment - this is the source of truth
      const apiResponse = await AppointmentService.completeAppointment(id);

      // Validate the API response
      if (!apiResponse || !apiResponse.id) {
        throw new Error('Invalid response: Completed appointment data is missing');
      }

      // Update state with actual API response - ensures state matches API exactly
      setAppointments((prev) => {
        const appointmentExists = prev.some(apt => apt.id === id);
        if (!appointmentExists) {
          return [...prev, apiResponse];
        }

        return prev.map((apt) => {
          if (apt.id === id) {
            // Use API response as source of truth
            return {
              ...apiResponse,
              status: 'Completed' as const,
            };
          }
          return apt;
        });
      });

      // Clear optimistic update since we have confirmed API response
      optimisticUpdateRef.current = null;

      // Update last fetch time
      setLastFetchTime(Date.now());

      // Return API response
      return apiResponse;
    } catch (err: unknown) {
      const error = err as TypedAxiosError;

      // Rollback optimistic update on error
      setAppointments(previousStateRef.current);
      optimisticUpdateRef.current = null;

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
      const errorMessage = extractErrorMessage(error);
      setError(errorMessage || 'Failed to complete appointment. Please try again.');

      // Re-throw to allow UI to handle error
      throw error;
    } finally {
      setLoadingState(prev => ({ ...prev, completing: false }));
    }
  }, [extractErrorMessage]);


  // Refresh appointments - force fetch from API
  const refreshAppointments = useCallback(async () => {
    await fetchAppointments();
  }, [fetchAppointments]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Computed isLoading - true if any operation is loading
  const isLoading = loadingState.fetching || loadingState.openingSlot || loadingState.completing;

  // Auto-complete appointments that have passed their end time + grace period
  useEffect(() => {
    // Only run if user is authenticated and appointments are loaded
    const token = getStoredToken();
    if (!token || appointments.length === 0) {
      return;
    }

    // Function to check and auto-complete eligible appointments
    const checkAndAutoComplete = async () => {
      try {
        // Get appointments that should be auto-completed
        const appointmentsToComplete = getAppointmentsToAutoComplete(appointments);

        // Filter out appointments already being processed
        const eligibleAppointments = appointmentsToComplete.filter(
          apt => !processingAppointmentsRef.current.has(apt.id)
        );

        if (eligibleAppointments.length === 0) {
          return;
        }

        // Process each eligible appointment
        let hasSuccessfulCompletions = false;

        for (const appointment of eligibleAppointments) {
          // Mark as processing to prevent duplicate calls
          processingAppointmentsRef.current.add(appointment.id);

          try {
            // Call the completion API
            await completeAppointment(appointment.id);

            // Remove from processing set after successful completion
            processingAppointmentsRef.current.delete(appointment.id);
            hasSuccessfulCompletions = true;

            if (import.meta.env.DEV) {
              console.log(`✅ Auto-completed appointment ${appointment.id} (${appointment.patientName})`);
            }
          } catch (error) {
            // Log error in dev mode but don't disrupt the app
            if (import.meta.env.DEV) {
              console.error(`❌ Failed to auto-complete appointment ${appointment.id}:`, error);
            }
            // Remove from processing set on error so it can be retried next interval
            processingAppointmentsRef.current.delete(appointment.id);
          }
        }

        // Refresh appointments after processing to get updated statuses
        // Only refresh if we successfully processed at least one appointment
        if (hasSuccessfulCompletions) {
          // Small delay to allow API to update before refreshing
          setTimeout(() => {
            fetchAppointments().catch((err) => {
              if (import.meta.env.DEV) {
                console.error('Failed to refresh appointments after auto-completion:', err);
              }
            });
          }, 1000);
        }
      } catch (error) {
        // Log unexpected errors in dev mode
        if (import.meta.env.DEV) {
          console.error('Error in auto-completion check:', error);
        }
      }
    };

    // Run initial check
    checkAndAutoComplete();

    // Set up interval to check every minute
    const intervalId = setInterval(() => {
      checkAndAutoComplete();
    }, APP_CONFIG.AUTO_COMPLETE.CHECK_INTERVAL_MS);

    // Cleanup interval on unmount or when dependencies change
    return () => {
      clearInterval(intervalId);
    };
  }, [appointments, completeAppointment, fetchAppointments]);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        isLoading,
        loadingState,
        error,
        lastFetchTime,
        fetchAppointments,
        openSlot,
        openSlotWithoutRefresh,
        completeAppointment,
        refreshAppointments,
        clearError,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};


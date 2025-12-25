import { useMemo } from 'react';
import { Appointment } from '../../../types';
import { getTodayAppointments, isAppointmentInFuture } from '../../../shared/utils/date/utils';
import { hasStatus } from '../utils/status';

export interface DashboardStats {
  totalAppointments: number;
  todayAppointmentsCount: number;
  todayScheduledCount: number;
  completedCount: number;
  bookedCount: number;
  expiredCount: number;
  completedPercentage: number;
  expiredPercentage: number;
}

/**
 * Custom hook for calculating dashboard statistics
 * Extracts business logic from DashboardStats component
 */
export function useDashboardStats(appointments: Appointment[]): DashboardStats {
  return useMemo(() => {
    // Use robust date comparison utility that uses the original appointmentDate from API
    const todayAppointments = getTodayAppointments(appointments);

    // Calculate stats with proper status filtering using status utility
    const totalAppointments = appointments.length;
    const todayAppointmentsCount = todayAppointments.length;
    const todayScheduledCount = todayAppointments.filter(a => hasStatus(a.status, 'Scheduled')).length;
    const completedCount = appointments.filter(a => hasStatus(a.status, 'Completed')).length;

    // Booked count: future scheduled appointments WITH real patients assigned (exclude unbooked slots and past appointments)
    const bookedCount = appointments.filter(a => {
      // Must be scheduled (not completed, cancelled, or expired)
      if (!hasStatus(a.status, 'Scheduled')) {
        return false;
      }

      // Must have a real patient assigned (exclude unbooked slots)
      if (!a.patientId || a.patientId === '0') {
        return false;
      }

      // Must be in the future (exclude past appointments)
      return isAppointmentInFuture(a);
    }).length;

    // Expired count: past appointments that were never booked
    const expiredCount = appointments.filter(a => hasStatus(a.status, 'Expired')).length;

    const completedPercentage = totalAppointments > 0
      ? Math.round((completedCount / totalAppointments) * 100)
      : 0;

    // Calculate expired percentage (expired slots vs total slots)
    const totalSlots = appointments.filter(a =>
      !a.patientId || a.patientId === '0' || a.patientName === 'Available Slot'
    ).length;
    const expiredPercentage = totalSlots > 0
      ? Math.round((expiredCount / totalSlots) * 100)
      : 0;

    return {
      totalAppointments,
      todayAppointmentsCount,
      todayScheduledCount,
      completedCount,
      bookedCount,
      expiredCount,
      completedPercentage,
      expiredPercentage,
    };
  }, [appointments]);
}

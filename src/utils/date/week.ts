import { startOfWeek, endOfWeek, format, addWeeks, isSameWeek, startOfDay } from 'date-fns';
import { Appointment } from '../../types';
import { parseAppointmentDate } from './utils';

export interface Week {
  start: Date;
  end: Date;
  weekNumber: number;
  appointments: Appointment[];
}

/**
 * Get the start of the week (Monday) for a given date
 * Uses ISO week standard (Monday as first day)
 */
export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
}

/**
 * Get the end of the week (Sunday) for a given date
 * Uses ISO week standard (Monday as first day)
 */
export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
}

/**
 * Get the week range (start and end dates) for a given date
 */
export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: getWeekStart(date),
    end: getWeekEnd(date),
  };
}

/**
 * Format a week range as a readable string (e.g., "Dec 16–22, 2025")
 */
export function formatWeekRange(start: Date, end: Date): string {
  const startFormatted = format(start, 'MMM d');
  const endFormatted = format(end, 'MMM d, yyyy');

  // If same year, only show year at the end
  if (start.getFullYear() === end.getFullYear()) {
    return `${startFormatted}–${endFormatted}`;
  }

  // Different years
  return `${format(start, 'MMM d, yyyy')}–${endFormatted}`;
}

/**
 * Get all weeks that contain appointments
 * Returns an array of Week objects sorted chronologically
 */
export function getWeeksWithAppointments(appointments: Appointment[]): Week[] {
  const weekMap = new Map<string, Week>();

  appointments.forEach((appointment) => {
    const appointmentDate = parseAppointmentDate(appointment);
    if (!appointmentDate) return;

    const weekStart = getWeekStart(appointmentDate);
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        start: weekStart,
        end: getWeekEnd(appointmentDate),
        weekNumber: 0, // Will be calculated later
        appointments: [],
      });
    }

    weekMap.get(weekKey)!.appointments.push(appointment);
  });

  // Convert map to array and sort by start date
  const weeks = Array.from(weekMap.values()).sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  // Assign week numbers (0-indexed)
  weeks.forEach((week, index) => {
    week.weekNumber = index;
  });

  return weeks;
}

/**
 * Get appointments for a specific week
 */
export function getAppointmentsForWeek(
  appointments: Appointment[],
  weekStart: Date
): Appointment[] {
  const weekEnd = getWeekEnd(weekStart);
  const weekStartDay = startOfDay(weekStart);
  const weekEndDay = startOfDay(weekEnd);

  return appointments.filter((appointment) => {
    const appointmentDate = parseAppointmentDate(appointment);
    if (!appointmentDate) return false;

    const appointmentDay = startOfDay(appointmentDate);
    return appointmentDay >= weekStartDay && appointmentDay <= weekEndDay;
  });
}

/**
 * Group appointments by day within a week
 * Returns a Map where keys are date strings (YYYY-MM-DD) and values are arrays of appointments
 * Only includes days that have appointments
 */
export function groupAppointmentsByDay(
  appointments: Appointment[]
): Map<string, Appointment[]> {
  const dayMap = new Map<string, Appointment[]>();

  appointments.forEach((appointment) => {
    const appointmentDate = parseAppointmentDate(appointment);
    if (!appointmentDate) return;

    const dateKey = format(startOfDay(appointmentDate), 'yyyy-MM-dd');

    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, []);
    }

    dayMap.get(dateKey)!.push(appointment);
  });

  return dayMap;
}

/**
 * Check if a date falls within a specific week
 */
export function isDateInWeek(date: Date, weekStart: Date): boolean {
  return isSameWeek(date, weekStart, { weekStartsOn: 1 });
}

/**
 * Get the next week start date
 */
export function getNextWeekStart(currentWeekStart: Date): Date {
  return addWeeks(currentWeekStart, 1);
}

/**
 * Get the previous week start date
 */
export function getPreviousWeekStart(currentWeekStart: Date): Date {
  return addWeeks(currentWeekStart, -1);
}

/**
 * Find the week index for a given date in an array of weeks
 * Returns -1 if not found
 */
export function findWeekIndex(weeks: Week[], date: Date): number {
  return weeks.findIndex((week) => isDateInWeek(date, week.start));
}

/**
 * Get the current week start date
 */
export function getCurrentWeekStart(): Date {
  return getWeekStart(new Date());
}

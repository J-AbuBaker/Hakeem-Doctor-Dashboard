/**
 * Appointment conflict detection utilities
 * Provides functions to detect overlapping appointments and prevent scheduling conflicts
 */

import { Appointment } from '../types';
import { parseDateTimeString } from './dateParsing';
import { getDuration } from './durationCache';
import { APP_CONFIG } from '../constants/appConfig';

export interface CalculatedSlot {
  datetime: string;
  displayTime: string;
  index: number;
  duration: number;
}

export interface SlotConflict {
  slot: CalculatedSlot;
  conflictingAppointments: Appointment[];
}

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflictingSlots: SlotConflict[];
  totalConflicts: number;
}

export interface BlockedTimeRange {
  start: Date;
  end: Date;
  appointments: Appointment[];
}

export interface TimeSlotAvailability {
  time: string;
  isBlocked: boolean;
  maxDuration?: number; // Maximum duration allowed before next appointment (in minutes)
  reason?: string;
}

/**
 * Checks if two time ranges overlap
 * Two ranges overlap if they share any common time
 * Overlap occurs when: start1 < end2 && start2 < end1
 * Note: Ranges that touch exactly (end1 === start2) are NOT considered overlapping
 * @param start1 - Start time of first range
 * @param end1 - End time of first range
 * @param start2 - Start time of second range
 * @param end2 - End time of second range
 * @returns true if the ranges overlap
 */
export function checkTimeOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  // Two time ranges overlap if they share any common time
  // Overlap: start1 < end2 && start2 < end1
  // Note: If end1 === start2 (touching), they don't overlap
  return start1.getTime() < end2.getTime() && start2.getTime() < end1.getTime();
}

/**
 * Converts an Appointment to start and end Date objects
 * Uses cached duration if available, otherwise falls back to default
 * Prefers createdAt (full datetime from API) over reconstructing from date+time
 * @param appointment - Appointment object
 * @returns Object with start and end Date objects, or null if parsing fails
 */
export function getAppointmentTimeRange(
  appointment: Appointment
): { start: Date; end: Date } | null {
  try {
    let start: Date | null = null;
    let datetimeStr: string | null = null;

    // Prefer using createdAt (full datetime from API) if available - more accurate
    if (appointment.createdAt && appointment.createdAt.includes('T')) {
      start = parseDateTimeString(appointment.createdAt);
      if (start) {
        datetimeStr = appointment.createdAt;
      }
    }

    // Fallback to reconstructing from date + time if createdAt is not available or invalid
    if (!start) {
      const dateStr = appointment.date;
      const timeStr = appointment.time;

      if (!dateStr || !timeStr) {
        return null;
      }

      // Parse date components
      const [year, month, day] = dateStr.split('-').map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
      }

      // Parse time components
      const [hours, minutes] = timeStr.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        return null;
      }

      // Create start date using local time
      start = new Date(year, month - 1, day, hours, minutes, 0, 0);

      // Construct datetime string for cache lookup
      datetimeStr = `${dateStr}T${timeStr}:00`;
    }

    // Validate the date was created correctly
    if (!start || isNaN(start.getTime())) {
      return null;
    }

    // Get duration from cache or use default
    // Use the datetime string (either from createdAt or constructed) for cache lookup
    const duration = datetimeStr
      ? getDuration(datetimeStr, appointment.duration || APP_CONFIG.DEFAULT_APPOINTMENT_DURATION)
      : (appointment.duration || APP_CONFIG.DEFAULT_APPOINTMENT_DURATION);

    // Calculate end time
    const end = new Date(start.getTime() + duration * 60 * 1000);

    return { start, end };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error parsing appointment time range:', error, appointment);
    }
    return null;
  }
}

/**
 * Checks if a new slot conflicts with existing appointments
 * @param slotDateTime - Slot datetime string (YYYY-MM-DDTHH:mm:ss)
 * @param slotDuration - Slot duration in minutes
 * @param existingAppointments - Array of existing appointments to check against
 * @param excludeCancelled - Whether to exclude cancelled appointments from conflict checks (default: true)
 * @returns Array of conflicting appointments
 */
export function checkSlotConflicts(
  slotDateTime: string,
  slotDuration: number,
  existingAppointments: Appointment[],
  excludeCancelled: boolean = true
): Appointment[] {
  try {
    // Parse slot datetime
    const slotStart = parseDateTimeString(slotDateTime);
    if (!slotStart) {
      return [];
    }

    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

    const conflicts: Appointment[] = [];

    for (const appointment of existingAppointments) {
      // Skip cancelled appointments if excludeCancelled is true
      if (excludeCancelled && appointment.status === 'Cancelled') {
        continue;
      }

      // Skip "Available Slot" appointments - these are open slots that can be replaced/overlapped
      // when creating new slots. Only actual booked appointments should cause conflicts.
      if (appointment.patientName === 'Available Slot' ||
        (appointment.patientId && (appointment.patientId === '0' || appointment.patientId === ''))) {
        continue;
      }

      // Get appointment time range
      const appointmentRange = getAppointmentTimeRange(appointment);
      if (!appointmentRange) {
        continue;
      }

      // Check for overlap
      if (checkTimeOverlap(slotStart, slotEnd, appointmentRange.start, appointmentRange.end)) {
        conflicts.push(appointment);
      }
    }

    return conflicts;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error checking slot conflicts:', error);
    }
    return [];
  }
}

/**
 * Checks multiple slots for conflicts with existing appointments
 * Filters appointments by date first for performance
 * @param slots - Array of CalculatedSlot objects
 * @param existingAppointments - Array of existing appointments to check against
 * @param excludeCancelled - Whether to exclude cancelled appointments from conflict checks (default: true)
 * @returns ConflictCheckResult with conflict information
 */
export function checkMultipleSlotsConflicts(
  slots: CalculatedSlot[],
  existingAppointments: Appointment[],
  excludeCancelled: boolean = true
): ConflictCheckResult {
  if (slots.length === 0) {
    return {
      hasConflicts: false,
      conflictingSlots: [],
      totalConflicts: 0,
    };
  }

  // Extract unique dates from slots for filtering
  const slotDates = new Set<string>();
  for (const slot of slots) {
    const slotDate = parseDateTimeString(slot.datetime);
    if (slotDate) {
      const dateStr = `${slotDate.getFullYear()}-${String(slotDate.getMonth() + 1).padStart(2, '0')}-${String(slotDate.getDate()).padStart(2, '0')}`;
      slotDates.add(dateStr);
    }
  }

  // Filter appointments to only those on the same dates as slots (performance optimization)
  const relevantAppointments = existingAppointments.filter((apt) => {
    return slotDates.has(apt.date);
  });

  const conflictingSlots: SlotConflict[] = [];
  let totalConflicts = 0;

  // Check each slot for conflicts
  for (const slot of slots) {
    const conflicts = checkSlotConflicts(
      slot.datetime,
      slot.duration,
      relevantAppointments,
      excludeCancelled
    );

    if (conflicts.length > 0) {
      conflictingSlots.push({
        slot,
        conflictingAppointments: conflicts,
      });
      totalConflicts += conflicts.length;
    }
  }

  return {
    hasConflicts: conflictingSlots.length > 0,
    conflictingSlots,
    totalConflicts,
  };
}

/**
 * Groups consecutive appointments into ranges
 * Appointments are considered consecutive if they overlap or are adjacent (within 5 minutes)
 * @param appointments - Array of appointments for a specific date
 * @returns Array of blocked time ranges
 */
export function getBlockedTimeRanges(
  appointments: Appointment[],
  excludeCancelled: boolean = true
): BlockedTimeRange[] {
  if (appointments.length === 0) {
    return [];
  }

  // Filter and get time ranges
  const ranges: Array<{ start: Date; end: Date; appointment: Appointment }> = [];

  for (const appointment of appointments) {
    if (excludeCancelled && appointment.status === 'Cancelled') {
      continue;
    }

    const range = getAppointmentTimeRange(appointment);
    if (range) {
      ranges.push({
        start: range.start,
        end: range.end,
        appointment,
      });
    }
  }

  if (ranges.length === 0) {
    return [];
  }

  // Sort by start time
  ranges.sort((a, b) => a.start.getTime() - b.start.getTime());

  // Group consecutive ranges
  const blockedRanges: BlockedTimeRange[] = [];
  let currentRange: BlockedTimeRange | null = null;

  for (const range of ranges) {
    if (!currentRange) {
      // Start new range
      currentRange = {
        start: range.start,
        end: range.end,
        appointments: [range.appointment],
      };
    } else {
      // Check if this range is consecutive (overlaps or within 5 minutes)
      const gapMinutes = (range.start.getTime() - currentRange.end.getTime()) / (1000 * 60);

      if (gapMinutes <= 5) {
        // Extend current range
        currentRange.end = range.end.getTime() > currentRange.end.getTime()
          ? range.end
          : currentRange.end;
        currentRange.appointments.push(range.appointment);
      } else {
        // Save current range and start new one
        blockedRanges.push(currentRange);
        currentRange = {
          start: range.start,
          end: range.end,
          appointments: [range.appointment],
        };
      }
    }
  }

  // Don't forget the last range
  if (currentRange) {
    blockedRanges.push(currentRange);
  }

  return blockedRanges;
}

/**
 * Checks if a time slot falls within any blocked time range
 * @param timeSlot - Time string (HH:mm)
 * @param date - Date string (YYYY-MM-DD)
 * @param slotDuration - Duration of the slot in minutes
 * @param blockedRanges - Array of blocked time ranges
 * @returns Object with isBlocked flag and reason
 */
export function isTimeSlotBlocked(
  timeSlot: string,
  date: string,
  slotDuration: number,
  blockedRanges: BlockedTimeRange[]
): { isBlocked: boolean; reason?: string } {
  const slotDateTime = `${date}T${timeSlot}:00`;
  const slotStart = parseDateTimeString(slotDateTime);

  if (!slotStart) {
    return { isBlocked: false };
  }

  const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

  for (const range of blockedRanges) {
    // Check if slot overlaps with blocked range
    if (checkTimeOverlap(slotStart, slotEnd, range.start, range.end)) {
      const appointmentCount = range.appointments.length;
      const reason = appointmentCount === 1
        ? `Conflicts with existing appointment`
        : `Conflicts with ${appointmentCount} consecutive appointments`;

      return { isBlocked: true, reason };
    }
  }

  return { isBlocked: false };
}

/**
 * Calculates maximum allowed duration for a time slot before it hits the next appointment
 * Ensures the slot doesn't overlap with the next appointment
 * @param timeSlot - Time string (HH:mm)
 * @param date - Date string (YYYY-MM-DD)
 * @param blockedRanges - Array of blocked time ranges
 * @returns Maximum duration in minutes, or undefined if no limit
 */
export function getMaxDurationBeforeNextAppointment(
  timeSlot: string,
  date: string,
  blockedRanges: BlockedTimeRange[]
): number | undefined {
  const slotDateTime = `${date}T${timeSlot}:00`;
  const slotStart = parseDateTimeString(slotDateTime);

  if (!slotStart) {
    return undefined;
  }

  // Find the next appointment after this time slot
  let nextAppointmentStart: Date | null = null;

  for (const range of blockedRanges) {
    // Check if this range starts after the slot start time
    if (range.start.getTime() > slotStart.getTime()) {
      if (!nextAppointmentStart || range.start.getTime() < nextAppointmentStart.getTime()) {
        nextAppointmentStart = range.start;
      }
    }
  }

  if (!nextAppointmentStart) {
    return undefined; // No next appointment, no limit
  }

  // Calculate available time in minutes
  // The slot can end exactly at nextAppointmentStart (no overlap)
  // So max duration = time until next appointment start
  const availableMinutes = (nextAppointmentStart.getTime() - slotStart.getTime()) / (1000 * 60);

  // Return maximum duration (ensure it's positive and at least minimum duration)
  if (availableMinutes <= 0) {
    return undefined;
  }

  // Return floor of available minutes (ensures no overlap)
  return Math.floor(availableMinutes);
}

/**
 * Gets availability information for all time slots
 * @param date - Date string (YYYY-MM-DD)
 * @param appointments - Array of appointments for the date
 * @param slotDuration - Default slot duration to check
 * @returns Array of time slot availability information
 */
export function getTimeSlotAvailability(
  date: string,
  appointments: Appointment[],
  slotDuration: number = 30
): TimeSlotAvailability[] {
  const blockedRanges = getBlockedTimeRanges(appointments, true);

  // Generate time slots (8 AM to 6 PM, 30-minute intervals)
  const timeSlots: string[] = [];
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }
  }

  return timeSlots.map((time) => {
    const blocked = isTimeSlotBlocked(time, date, slotDuration, blockedRanges);
    const maxDuration = getMaxDurationBeforeNextAppointment(time, date, blockedRanges);

    return {
      time,
      isBlocked: blocked.isBlocked,
      maxDuration,
      reason: blocked.reason,
    };
  });
}

import React, { useState, useMemo, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppointments } from '../../context/AppointmentContext';
import { X, Loader2, Calendar, Clock, AlertCircle, Plus, Minus, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import TimeSlotPicker from './TimeSlotPicker';
import SlotDatePicker from './SlotDatePicker';
import { format } from 'date-fns';
import { getErrorMessage, getErrorStatus } from '../../utils/errorUtils';
import { storeDurations } from '../../utils/durationCache';
import { checkMultipleSlotsConflicts, getBlockedTimeRanges, getMaxDurationBeforeNextAppointment } from '../../utils/appointmentConflict';
import { parseDateTimeString } from '../../utils/dateParsing';
import { APP_CONFIG } from '../../constants/appConfig';

interface OpenSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalculatedSlot {
  datetime: string;
  displayTime: string;
  index: number;
  duration: number; // Duration in minutes for this slot
}

// Slot duration options in minutes (controlled selection)
const SLOT_DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
] as const;

// Break duration options in minutes (controlled selection)
const BREAK_DURATION_OPTIONS = [
  { value: 0, label: 'No break' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
] as const;

// Maximum number of slots to prevent excessive API calls
const MAX_SLOTS = 50;

const OpenSlotModal: React.FC<OpenSlotModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { openSlotWithoutRefresh, fetchAppointments, appointments } = useAppointments();
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [failedSlots, setFailedSlots] = useState<CalculatedSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{ count: number; date: string; startTime: string } | null>(null);

  const validationSchema = Yup.object({
    date: Yup.string()
      .required('Date is required')
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
      .test('not-past', 'Date cannot be in the past', function (value) {
        if (!value) return false;
        const [year, month, day] = value.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      }),
    startTime: Yup.string()
      .required('Start time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please select a valid time slot'),
    numberOfSlots: Yup.number()
      .required('Number of slots is required')
      .min(1, 'At least 1 slot is required')
      .max(MAX_SLOTS, `Maximum ${MAX_SLOTS} slots allowed`)
      .integer('Must be a whole number'),
    slotDuration: Yup.number()
      .required('Slot duration is required')
      .min(30, 'Minimum duration is 30 minutes')
      .max(240, 'Maximum duration is 4 hours')
      .test('max-duration-before-next', 'Duration exceeds available time before next appointment', function () {
        // This will be validated dynamically in the component, but we keep basic validation here
        return true; // Dynamic validation handled in component via disabled state
      }),
    breakDuration: Yup.number()
      .required('Break duration is required')
      .min(0, 'Break cannot be negative')
      .max(60, 'Maximum break is 60 minutes'),
  });

  const [constrainToSameDay] = useState(true);

  const formik = useFormik({
    initialValues: {
      date: '',
      startTime: '',
      numberOfSlots: 1,
      slotDuration: 30,
      breakDuration: 0,
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setError(null);
      setSuccessCount(0);
      setFailedSlots([]);
      setIsSubmitting(true);

      try {
        // Ensure values are correctly converted to numbers from UI
        const slotDuration = Number(values.slotDuration);
        const breakDuration = Number(values.breakDuration);
        const numberOfSlots = Number(values.numberOfSlots);

        // Validate numeric values
        if (isNaN(slotDuration) || isNaN(breakDuration) || isNaN(numberOfSlots)) {
          throw new Error('Invalid form values. Please check your inputs.');
        }

        // Calculate all slot datetimes (sequential with proper spacing)
        const calculatedSlots = calculateSlots(
          values.date,
          values.startTime,
          numberOfSlots,
          slotDuration,
          breakDuration,
          constrainToSameDay
        );

        if (calculatedSlots.length === 0) {
          throw new Error('No slots could be calculated. Please check your inputs.');
        }

        // Store durations for all calculated slots
        storeDurations(
          calculatedSlots.map(slot => ({
            datetime: slot.datetime,
            duration: slot.duration,
          }))
        );

        const results = await createSlotsBatch(calculatedSlots);

        setSuccessCount(results.successCount);
        setFailedSlots(results.failedSlots);
        if (results.failedSlots.length === 0) {
          setTimeout(() => {
            onClose();
            formik.resetForm();
            setSuccessCount(0);
            setFailedSlots([]);
          }, 1500);
        } else if (results.successCount === 0) {
          // All failed
          setError(`Failed to create all ${calculatedSlots.length} slots. Please try again.`);
        } else {
          // Partial success
          setError(
            `Successfully created ${results.successCount} of ${calculatedSlots.length} slots. ` +
            `${results.failedSlots.length} slot(s) failed.`
          );
        }
      } catch (err: unknown) {
        let errorMessage = getErrorMessage(err);
        const status = getErrorStatus(err);

        if (errorMessage.includes('Network Error') || errorMessage.includes('ERR_NETWORK')) {
          errorMessage = 'Unable to open slots. Please check your connection and try again.';
        } else if (status === 409 || errorMessage.includes('409') || errorMessage.includes('Conflict')) {
          errorMessage = 'One or more time slots are already open or booked. Please select different times.';
        } else if (status === 400 || errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          errorMessage = 'Please check all fields and ensure the information is correct.';
        } else if (status === 500 || errorMessage.includes('500')) {
          errorMessage = 'A server error occurred. Please try again in a few moments.';
        }

        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  /**
   * Creates a Date object from date string (YYYY-MM-DD) and time components
   * Uses local time explicitly to avoid timezone conversion issues
   */
  const createLocalDateTime = (dateStr: string, hours: number, minutes: number, seconds: number = 0): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    // Create date in local timezone (month is 0-indexed in Date constructor)
    return new Date(year, month - 1, day, hours, minutes, seconds);
  };

  /**
   * Formats a Date object to ISO 8601 LocalDateTime format (YYYY-MM-DDTHH:mm:ss)
   * Uses local time components to ensure no timezone conversion
   */
  const formatToLocalDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  /**
   * Validates that a datetime string is in the correct format for the API
   */
  const validateDateTimeFormat = (dateTimeStr: string): boolean => {
    // Format: YYYY-MM-DDTHH:mm:ss
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    if (!regex.test(dateTimeStr)) {
      return false;
    }

    // Validate date components
    const [datePart, timePart] = dateTimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Basic range validation
    if (month < 1 || month > 12 || day < 1 || day > 31) return false;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) return false;

    // Validate actual date (handles invalid dates like Feb 30)
    const testDate = new Date(year, month - 1, day, hours, minutes, seconds);
    return (
      testDate.getFullYear() === year &&
      testDate.getMonth() === month - 1 &&
      testDate.getDate() === day &&
      testDate.getHours() === hours &&
      testDate.getMinutes() === minutes &&
      testDate.getSeconds() === seconds
    );
  };

  /**
   * Calculates sequential appointment slot datetimes based on user inputs
   * Slots are created sequentially with proper spacing (slot duration + break duration)
   * Ensures all slots stay on the same day by default
   * Uses local time explicitly to avoid timezone conversion issues
   */
  const calculateSlots = (
    date: string,
    startTime: string,
    numberOfSlots: number,
    slotDurationMinutes: number,
    breakDurationMinutes: number,
    constrainToSameDay: boolean = true
  ): CalculatedSlot[] => {
    if (!date || !startTime) {
      return [];
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return [];
    }

    const slots: CalculatedSlot[] = [];

    // Parse start time (HH:mm)
    const timeParts = startTime.split(':');
    const startHours = parseInt(timeParts[0] || '0', 10);
    const startMinutes = parseInt(timeParts[1] || '0', 10);

    // Validate time values
    if (isNaN(startHours) || isNaN(startMinutes) || startHours < 0 || startHours > 23 || startMinutes < 0 || startMinutes > 59) {
      return [];
    }

    // Validate slot duration and break duration
    if (slotDurationMinutes < 1 || breakDurationMinutes < 0 || numberOfSlots < 1) {
      return [];
    }

    // Create base date from selected date and start time using local time
    // This avoids timezone conversion issues
    let currentSlotDate = createLocalDateTime(date, startHours, startMinutes, 0);

    // Validate base date is not in the past
    const now = new Date();
    if (currentSlotDate < now) {
      return [];
    }

    // Calculate end time (6 PM / 18:00) for slot constraint
    const [year, month, day] = date.split('-').map(Number);
    const slotEndTimeLimit = new Date(year, month - 1, day, APP_CONFIG.SLOT_END_TIME.HOUR, APP_CONFIG.SLOT_END_TIME.MINUTE, 0);

    // Create sequential slots
    for (let i = 0; i < numberOfSlots; i++) {
      // Check if slot would exceed 6 PM limit
      if (constrainToSameDay) {
        // Check if slot start time + duration would exceed 6 PM
        const slotEndTime = new Date(currentSlotDate.getTime() + slotDurationMinutes * 60 * 1000);
        if (slotEndTime > slotEndTimeLimit) {
          // Stop creating slots if this slot would exceed 6 PM
          break;
        }
      }

      // Format as ISO 8601 LocalDateTime for backend: "YYYY-MM-DDTHH:mm:ss"
      const isoDateTime = formatToLocalDateTime(currentSlotDate);

      // Validate the formatted datetime
      if (!validateDateTimeFormat(isoDateTime)) {
        break;
      }

      // Format display time for preview
      const displayTime = formatTimeForDisplay(currentSlotDate);

      slots.push({
        datetime: isoDateTime,
        displayTime,
        index: i + 1,
        duration: slotDurationMinutes, // Store duration for each slot
      });

      // Calculate next slot start time
      // Next slot starts after current slot duration + break duration
      const minutesToAdd = slotDurationMinutes + breakDurationMinutes;
      currentSlotDate = new Date(currentSlotDate.getTime() + minutesToAdd * 60 * 1000);
    }

    return slots;
  };

  /**
   * Formats time for display in preview
   */
  const formatTimeForDisplay = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours % 12 || 12;
    return `${String(displayHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  /**
   * Creates multiple slots via batch API calls
   * Handles partial failures gracefully
   * Validates datetime format before sending to API
   */
  const createSlotsBatch = async (
    slots: CalculatedSlot[]
  ): Promise<{ successCount: number; failedSlots: CalculatedSlot[] }> => {
    const failedSlots: CalculatedSlot[] = [];
    let successCount = 0;

    // Validate and filter out invalid slots before processing
    const validSlots = slots.filter(slot => {
      if (!validateDateTimeFormat(slot.datetime)) {
        failedSlots.push(slot);
        return false;
      }
      return true;
    });

    // Execute API calls sequentially to avoid overwhelming the backend
    // and to maintain order
    for (const slot of validSlots) {
      try {
        // Double-check datetime format before API call
        if (!validateDateTimeFormat(slot.datetime)) {
          throw new Error(`Invalid datetime format: ${slot.datetime}`);
        }

        await openSlotWithoutRefresh(slot.datetime);
        successCount++;
      } catch (err: unknown) {
        // Log failure with detailed information
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (import.meta.env.DEV) {
          console.warn(`Failed to create slot ${slot.index} at ${slot.displayTime} (${slot.datetime}):`, {
            error: errorMessage,
            errorObject: err,
          });
        }
        failedSlots.push(slot);
      }
    }

    // Refresh appointments once after all slots are processed
    if (successCount > 0) {
      try {
        await fetchAppointments();
      } catch (err) {
        console.warn('Failed to refresh appointments after batch creation:', err);
      }
    }

    return { successCount, failedSlots };
  };

  // Calculate preview slots based on current form values
  // Ensure values are correctly converted to numbers from UI
  const previewSlots = useMemo(() => {
    if (!formik.values.date || !formik.values.startTime || formik.values.numberOfSlots < 1) {
      return [];
    }
    const slotDuration = Number(formik.values.slotDuration);
    const breakDuration = Number(formik.values.breakDuration);
    const numberOfSlots = Number(formik.values.numberOfSlots);

    // Validate numeric values
    if (isNaN(slotDuration) || isNaN(breakDuration) || isNaN(numberOfSlots)) {
      return [];
    }

    return calculateSlots(
      formik.values.date,
      formik.values.startTime,
      numberOfSlots,
      slotDuration,
      breakDuration,
      constrainToSameDay
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    formik.values.date,
    formik.values.startTime,
    formik.values.numberOfSlots,
    formik.values.slotDuration,
    formik.values.breakDuration,
    constrainToSameDay,
  ]);

  // Calculate if slots would overflow to next day
  const wouldOverflowToNextDay = useMemo(() => {
    if (previewSlots.length === 0) return false;
    if (!constrainToSameDay) return false;

    const lastSlot = previewSlots[previewSlots.length - 1];
    const slotDate = new Date(lastSlot.datetime);
    const selectedDate = formik.values.date ? new Date(formik.values.date) : null;

    if (!selectedDate) return false;

    // Check if last slot is on a different day
    return slotDate.toDateString() !== selectedDate.toDateString();
  }, [previewSlots, constrainToSameDay, formik.values.date]);

  // Check for conflicts with existing appointments
  const conflictCheckResult = useMemo(() => {
    if (previewSlots.length === 0 || appointments.length === 0) {
      return {
        hasConflicts: false,
        conflictingSlots: [],
        totalConflicts: 0,
      };
    }

    return checkMultipleSlotsConflicts(previewSlots, appointments, true);
  }, [previewSlots, appointments]);

  // Create a Set of conflicting slot indices for quick lookup
  const conflictingSlotIndices = useMemo(() => {
    return new Set(conflictCheckResult.conflictingSlots.map(cs => cs.slot.index));
  }, [conflictCheckResult]);

  // Calculate max duration before next appointment AND 6 PM limit for selected time
  // Note: This calculates max duration for a SINGLE slot, not accounting for breaks
  // Break duration is considered separately in maxSlotsInFreeTime calculation
  const maxDurationBeforeNext = useMemo(() => {
    if (!formik.values.date || !formik.values.startTime) {
      return undefined;
    }

    // Parse start time to calculate time until 6 PM
    const [startHours, startMinutes] = formik.values.startTime.split(':').map(Number);
    const [year, month, day] = formik.values.date.split('-').map(Number);
    const startDateTime = new Date(year, month - 1, day, startHours, startMinutes, 0);
    const endTimeLimit = new Date(year, month - 1, day, APP_CONFIG.SLOT_END_TIME.HOUR, APP_CONFIG.SLOT_END_TIME.MINUTE, 0);

    // Calculate time until 6 PM in minutes
    const timeUntil6PM = (endTimeLimit.getTime() - startDateTime.getTime()) / (1000 * 60);

    // If start time is at or after 6 PM, no duration allowed
    if (timeUntil6PM <= 0) {
      return 0;
    }

    const appointmentsForDate = appointments.filter(
      (apt) => apt.date === formik.values.date && apt.status !== 'Cancelled'
    );

    // If no appointments, max duration is limited only by 6 PM
    if (appointmentsForDate.length === 0) {
      return Math.floor(timeUntil6PM);
    }

    const blockedRanges = getBlockedTimeRanges(appointmentsForDate, true);
    const maxDurationBeforeAppointment = getMaxDurationBeforeNextAppointment(formik.values.startTime, formik.values.date, blockedRanges);

    // Return the minimum of: time until next appointment OR time until 6 PM
    if (maxDurationBeforeAppointment === undefined) {
      return Math.floor(timeUntil6PM);
    }

    return Math.min(maxDurationBeforeAppointment, Math.floor(timeUntil6PM));
  }, [formik.values.date, formik.values.startTime, appointments]);

  // Calculate maximum number of slots that fit in available free time (considering both next appointment and 6 PM limit)
  // Properly accounts for break duration between slots
  const maxSlotsInFreeTime = useMemo(() => {
    if (!formik.values.date || !formik.values.startTime) {
      return MAX_SLOTS; // No limit if no date/time selected
    }

    // Parse start time to calculate time until 6 PM
    const [startHours, startMinutes] = formik.values.startTime.split(':').map(Number);
    const [year, month, day] = formik.values.date.split('-').map(Number);
    const startDateTime = new Date(year, month - 1, day, startHours, startMinutes, 0);
    const endTimeLimit = new Date(year, month - 1, day, APP_CONFIG.SLOT_END_TIME.HOUR, APP_CONFIG.SLOT_END_TIME.MINUTE, 0);

    // Calculate time until 6 PM in minutes
    const timeUntil6PM = (endTimeLimit.getTime() - startDateTime.getTime()) / (1000 * 60);

    // If start time is at or after 6 PM, no slots allowed
    if (timeUntil6PM <= 0) {
      return 0;
    }

    const slotDuration = Number(formik.values.slotDuration);
    const breakDuration = Number(formik.values.breakDuration);

    if (slotDuration <= 0) {
      return MAX_SLOTS;
    }

    // Calculate available time considering both next appointment and 6 PM limit
    let availableTime = timeUntil6PM;

    if (maxDurationBeforeNext !== undefined) {
      // Use the minimum of time until next appointment or time until 6 PM
      availableTime = Math.min(maxDurationBeforeNext, timeUntil6PM);
    }

    // Calculate how many slots fit considering break duration
    // Formula: For N slots, total time needed = N * slotDuration + (N-1) * breakDuration
    // We need: N * slotDuration + (N-1) * breakDuration <= availableTime
    // Rearranging: N * (slotDuration + breakDuration) - breakDuration <= availableTime
    // N * (slotDuration + breakDuration) <= availableTime + breakDuration
    // N <= (availableTime + breakDuration) / (slotDuration + breakDuration)
    const totalTimePerSlot = slotDuration + breakDuration;

    // Handle edge case: if breakDuration is 0, simpler calculation
    let maxSlots: number;
    if (breakDuration === 0) {
      // No breaks: N <= availableTime / slotDuration
      maxSlots = Math.floor(availableTime / slotDuration);
    } else {
      // With breaks: N <= (availableTime + breakDuration) / (slotDuration + breakDuration)
      maxSlots = Math.floor((availableTime + breakDuration) / totalTimePerSlot);
    }

    // Ensure at least 1 slot is allowed if there's enough time for at least one slot
    // Also ensure we don't exceed MAX_SLOTS
    return Math.max(availableTime >= slotDuration ? 1 : 0, Math.min(maxSlots, MAX_SLOTS));
  }, [formik.values.date, formik.values.startTime, formik.values.slotDuration, formik.values.breakDuration, maxDurationBeforeNext]);

  // Auto-adjust duration and number of slots when they exceed max allowed for selected time
  // This effect runs when start time, duration, break duration, or max limits change
  useEffect(() => {
    if (maxDurationBeforeNext !== undefined && formik.values.startTime) {
      // Auto-adjust duration if it exceeds max
      // Find the largest valid duration option that doesn't exceed maxDurationBeforeNext
      if (formik.values.slotDuration > maxDurationBeforeNext) {
        // Find the largest duration option that fits within maxDurationBeforeNext
        const validDurations = SLOT_DURATION_OPTIONS
          .map(opt => opt.value)
          .filter(dur => dur <= maxDurationBeforeNext)
          .sort((a, b) => b - a); // Sort descending

        const adjustedDuration = validDurations.length > 0
          ? validDurations[0] // Use the largest valid duration
          : 30; // Fallback to minimum if no valid option

        if (adjustedDuration !== formik.values.slotDuration) {
          formik.setFieldValue('slotDuration', adjustedDuration, false);
        }
      }

      // Auto-adjust number of slots if it exceeds max slots in free time
      // maxSlotsInFreeTime already accounts for break duration, so this will adjust correctly
      if (formik.values.numberOfSlots > maxSlotsInFreeTime) {
        formik.setFieldValue('numberOfSlots', maxSlotsInFreeTime, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxDurationBeforeNext, formik.values.startTime, formik.values.slotDuration, formik.values.breakDuration, maxSlotsInFreeTime]); // Adjust when time, duration, break, max duration, or max slots change

  if (!isOpen) return null;

  return (
    <>
      {/* Professional Success Dialog - Rendered outside modal for proper popup display */}
      {showSuccessDialog && successDetails && (
        <div className="success-dialog-overlay" onClick={() => {
          setShowSuccessDialog(false);
          setSuccessDetails(null);
          onClose();
          formik.resetForm();
          setSuccessCount(0);
          setFailedSlots([]);
        }}>
          <div className="success-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="success-dialog-content">
              <div className="success-dialog-icon-wrapper">
                <CheckCircle2 className="success-dialog-icon" size={64} />
              </div>
              <h2 className="success-dialog-title">Slots Created Successfully</h2>
              <p className="success-dialog-message">
                {successDetails.count === 1
                  ? `Your appointment slot has been successfully created and is now available for booking.`
                  : `All ${successDetails.count} appointment slots have been successfully created and are now available for booking.`}
              </p>
              <div className="success-dialog-details">
                <div className="success-detail-item">
                  <Calendar size={18} className="success-detail-icon" />
                  <div className="success-detail-content">
                    <span className="success-detail-label">Date</span>
                    <span className="success-detail-value">
                      {(() => {
                        try {
                          const [year, month, day] = successDetails.date.split('-').map(Number);
                          const dateObj = new Date(year, month - 1, day);
                          return format(dateObj, 'EEEE, MMMM d, yyyy');
                        } catch {
                          return successDetails.date;
                        }
                      })()}
                    </span>
                  </div>
                </div>
                <div className="success-detail-item">
                  <Clock size={18} className="success-detail-icon" />
                  <div className="success-detail-content">
                    <span className="success-detail-label">Start Time</span>
                    <span className="success-detail-value">
                      {(() => {
                        const [hours, minutes] = successDetails.startTime.split(':').map(Number);
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const displayHour = hours % 12 || 12;
                        return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
                      })()}
                    </span>
                  </div>
                </div>
                <div className="success-detail-item">
                  <CheckCircle2 size={18} className="success-detail-icon" />
                  <div className="success-detail-content">
                    <span className="success-detail-label">Slots Created</span>
                    <span className="success-detail-value">{successDetails.count} slot{successDetails.count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary success-dialog-button"
                onClick={() => {
                  setShowSuccessDialog(false);
                  setSuccessDetails(null);
                  onClose();
                  formik.resetForm();
                  setSuccessCount(0);
                  setFailedSlots([]);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>Schedule Appointment Slots</h2>
              <p className="modal-subtitle">Create multiple sequential time slots for patient appointments</p>
            </div>
            <button className="modal-close" onClick={onClose}>
              <X />
            </button>
          </div>

          {error && (
            <div className={`error-message ${successCount > 0 ? 'error-partial' : ''}`}>
              <div className="error-icon-wrapper">
                <AlertCircle size={20} />
              </div>
              <div className="error-content">
                {error}
                {failedSlots.length > 0 && (
                  <div className="failed-slots-list">
                    <strong>Failed slots:</strong>
                    <ul>
                      {failedSlots.map((slot) => (
                        <li key={slot.index}>
                          Slot {slot.index}: {slot.displayTime}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}


          <form onSubmit={formik.handleSubmit} className="modal-form">
            <div className="form-section">
              <h3 className="form-section-title">
                <Calendar size={18} />
                Schedule Details
              </h3>
              <div className="form-section-content">
                <div className="form-group">
                  <label htmlFor="date">
                    <Calendar className="label-icon" />
                    Appointment Date *
                  </label>
                  <SlotDatePicker
                    value={formik.values.date}
                    onChange={(date) => {
                      formik.setFieldValue('date', date, true); // Validate immediately
                      formik.setFieldTouched('date', true, false); // Mark as touched without validation (already validated above)
                      // Clear start time if date changes to past
                      if (date && formik.values.startTime) {
                        const [year, month, day] = date.split('-').map(Number);
                        const selectedDate = new Date(year, month - 1, day);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (selectedDate.getTime() === today.getTime()) {
                          // If today, validate time is not in past
                          const [hours, minutes] = formik.values.startTime.split(':').map(Number);
                          const timeDate = new Date();
                          timeDate.setHours(hours, minutes, 0, 0);
                          if (timeDate < new Date()) {
                            formik.setFieldValue('startTime', '');
                          }
                        }
                      }
                    }}
                    onBlur={() => formik.setFieldTouched('date', true)}
                    error={formik.touched.date && formik.errors.date ? formik.errors.date : undefined}
                    disabled={isSubmitting}
                    placeholder="Select appointment date"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Clock className="label-icon" />
                    Start Time *
                  </label>
                  <TimeSlotPicker
                    selectedTime={formik.values.startTime}
                    onTimeSelect={(time) => {
                      formik.setFieldValue('startTime', time);
                      // Auto-adjust duration if current duration exceeds max for selected time
                      if (time && formik.values.date) {
                        const appointmentsForDate = appointments.filter(
                          (apt) => apt.date === formik.values.date && apt.status !== 'Cancelled'
                        );
                        if (appointmentsForDate.length > 0) {
                          const blockedRanges = getBlockedTimeRanges(appointmentsForDate, true);
                          const maxDuration = getMaxDurationBeforeNextAppointment(time, formik.values.date, blockedRanges);
                          if (maxDuration !== undefined && formik.values.slotDuration > maxDuration) {
                            // Find the largest valid duration option that fits within maxDuration
                            const validDurations = SLOT_DURATION_OPTIONS
                              .map(opt => opt.value)
                              .filter(dur => dur <= maxDuration)
                              .sort((a, b) => b - a); // Sort descending

                            const adjustedDuration = validDurations.length > 0
                              ? validDurations[0] // Use the largest valid duration
                              : 30; // Fallback to minimum if no valid option

                            formik.setFieldValue('slotDuration', adjustedDuration);
                          }
                        }
                      }
                    }}
                    date={formik.values.date}
                    error={formik.touched.startTime && formik.errors.startTime ? formik.errors.startTime : undefined}
                    existingAppointments={appointments}
                    slotDuration={formik.values.slotDuration}
                  />
                </div>

              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">
                <Clock size={18} />
                Slot Configuration
              </h3>
              <div className="form-section-content">
                <div className="form-group form-group-horizontal">
                  <label htmlFor="numberOfSlots">
                    <Plus className="label-icon" />
                    Number of Slots *
                  </label>
                  <div className="input-wrapper">
                    <div className="number-input-controls">
                      <button
                        type="button"
                        className="number-input-btn"
                        onClick={() => {
                          const newValue = Math.max(1, formik.values.numberOfSlots - 1);
                          formik.setFieldValue('numberOfSlots', newValue);
                        }}
                        disabled={formik.values.numberOfSlots <= 1 || isSubmitting}
                      >
                        <Minus size={16} />
                      </button>
                      <input
                        id="numberOfSlots"
                        name="numberOfSlots"
                        type="number"
                        min={1}
                        max={maxSlotsInFreeTime}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10) || 1;
                          const clampedValue = Math.max(1, Math.min(maxSlotsInFreeTime, value));
                          formik.setFieldValue('numberOfSlots', clampedValue);
                        }}
                        onBlur={formik.handleBlur}
                        value={formik.values.numberOfSlots}
                        className={formik.touched.numberOfSlots && formik.errors.numberOfSlots ? 'error' : ''}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        className="number-input-btn"
                        onClick={() => {
                          const newValue = Math.min(maxSlotsInFreeTime, formik.values.numberOfSlots + 1);
                          formik.setFieldValue('numberOfSlots', newValue);
                        }}
                        disabled={formik.values.numberOfSlots >= maxSlotsInFreeTime || isSubmitting}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  {formik.touched.numberOfSlots && formik.errors.numberOfSlots && (
                    <div className="field-error">
                      <AlertCircle className="error-icon" size={14} />
                      {formik.errors.numberOfSlots}
                    </div>
                  )}
                  <div className="field-hint">
                    {formik.values.date && formik.values.startTime
                      ? (() => {
                        // Check if limit is due to 6 PM or next appointment
                        const [startHours, startMinutes] = formik.values.startTime.split(':').map(Number);
                        const [year, month, day] = formik.values.date.split('-').map(Number);
                        const startDateTime = new Date(year, month - 1, day, startHours, startMinutes, 0);
                        const endTimeLimit = new Date(year, month - 1, day, APP_CONFIG.SLOT_END_TIME.HOUR, APP_CONFIG.SLOT_END_TIME.MINUTE, 0);
                        const timeUntil6PM = (endTimeLimit.getTime() - startDateTime.getTime()) / (1000 * 60);

                        const appointmentsForDate = appointments.filter(
                          (apt) => apt.date === formik.values.date && apt.status !== 'Cancelled'
                        );

                        // Calculate available time (considering both 6 PM and next appointment)
                        let availableTime = Math.floor(timeUntil6PM);
                        if (appointmentsForDate.length > 0) {
                          const blockedRanges = getBlockedTimeRanges(appointmentsForDate, true);
                          const maxDurationBeforeAppointment = getMaxDurationBeforeNextAppointment(formik.values.startTime, formik.values.date, blockedRanges);
                          if (maxDurationBeforeAppointment !== undefined) {
                            availableTime = Math.min(maxDurationBeforeAppointment, Math.floor(timeUntil6PM));
                          }
                        }

                        let limitText = '';
                        if (appointmentsForDate.length === 0) {
                          limitText = `until 6 PM`;
                        } else {
                          const blockedRanges = getBlockedTimeRanges(appointmentsForDate, true);
                          const maxDurationBeforeAppointment = getMaxDurationBeforeNextAppointment(formik.values.startTime, formik.values.date, blockedRanges);

                          if (maxDurationBeforeAppointment === undefined || maxDurationBeforeAppointment >= Math.floor(timeUntil6PM)) {
                            limitText = `until 6 PM`;
                          } else {
                            limitText = `before next appointment`;
                          }
                        }

                        return `Maximum ${maxSlotsInFreeTime} slot${maxSlotsInFreeTime !== 1 ? 's' : ''} fit in available time (${availableTime} min ${limitText})`;
                      })()
                      : ''}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="slotDuration">
                    <Clock className="label-icon" />
                    Slot Duration *
                  </label>
                  <div className="duration-boxes-container">
                    {SLOT_DURATION_OPTIONS.map((option) => {
                      const isSelected = formik.values.slotDuration === option.value;
                      // Check if this duration option exceeds max allowed for selected time (considering both next appointment and 6 PM)
                      // Note: Break duration doesn't affect single slot duration validation, only affects max slots calculation
                      const exceedsMax = maxDurationBeforeNext !== undefined &&
                        formik.values.startTime &&
                        option.value > maxDurationBeforeNext;
                      const isDisabled = isSubmitting || exceedsMax;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            if (!isDisabled) {
                              formik.setFieldValue('slotDuration', option.value);
                              formik.setFieldTouched('slotDuration', true);
                            }
                          }}
                          className={`duration-box ${isSelected ? 'selected' : ''} ${formik.touched.slotDuration && formik.errors.slotDuration ? 'error' : ''} ${exceedsMax ? 'duration-exceeds-max' : ''}`}
                          disabled={isDisabled}
                          data-max-duration={exceedsMax ? `Max: ${maxDurationBeforeNext}m` : ''}
                          title={exceedsMax ? (() => {
                            // Check if limit is due to 6 PM or next appointment
                            const [startHours, startMinutes] = formik.values.startTime.split(':').map(Number);
                            const [year, month, day] = formik.values.date.split('-').map(Number);
                            const startDateTime = new Date(year, month - 1, day, startHours, startMinutes, 0);
                            const endTimeLimit = new Date(year, month - 1, day, APP_CONFIG.SLOT_END_TIME.HOUR, APP_CONFIG.SLOT_END_TIME.MINUTE, 0);
                            const timeUntil6PM = (endTimeLimit.getTime() - startDateTime.getTime()) / (1000 * 60);

                            const appointmentsForDate = appointments.filter(
                              (apt) => apt.date === formik.values.date && apt.status !== 'Cancelled'
                            );

                            if (appointmentsForDate.length === 0) {
                              return `Maximum duration: ${maxDurationBeforeNext} min (until 6 PM)`;
                            }

                            const blockedRanges = getBlockedTimeRanges(appointmentsForDate, true);
                            const maxDurationBeforeAppointment = getMaxDurationBeforeNextAppointment(formik.values.startTime, formik.values.date, blockedRanges);

                            if (maxDurationBeforeAppointment === undefined || maxDurationBeforeAppointment >= Math.floor(timeUntil6PM)) {
                              return `Maximum duration: ${maxDurationBeforeNext} min (until 6 PM)`;
                            }

                            return `Maximum duration: ${maxDurationBeforeNext} min (next appointment too close)`;
                          })() : option.label}
                        >
                          <span className="duration-box-label">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {formik.touched.slotDuration && formik.errors.slotDuration && (
                    <div className="field-error">
                      <AlertCircle className="error-icon" size={14} />
                      {formik.errors.slotDuration}
                    </div>
                  )}
                  {maxDurationBeforeNext !== undefined && formik.values.startTime && (
                    <div className="field-hint">
                      <Info size={14} />
                      Maximum duration: {maxDurationBeforeNext} min {(() => {
                        // Check if limit is due to 6 PM or next appointment
                        const [startHours, startMinutes] = formik.values.startTime.split(':').map(Number);
                        const [year, month, day] = formik.values.date.split('-').map(Number);
                        const startDateTime = new Date(year, month - 1, day, startHours, startMinutes, 0);
                        const endTimeLimit = new Date(year, month - 1, day, APP_CONFIG.SLOT_END_TIME.HOUR, APP_CONFIG.SLOT_END_TIME.MINUTE, 0);
                        const timeUntil6PM = (endTimeLimit.getTime() - startDateTime.getTime()) / (1000 * 60);

                        const appointmentsForDate = appointments.filter(
                          (apt) => apt.date === formik.values.date && apt.status !== 'Cancelled'
                        );

                        if (appointmentsForDate.length === 0) {
                          return '(until 6 PM)';
                        }

                        const blockedRanges = getBlockedTimeRanges(appointmentsForDate, true);
                        const maxDurationBeforeAppointment = getMaxDurationBeforeNextAppointment(formik.values.startTime, formik.values.date, blockedRanges);

                        if (maxDurationBeforeAppointment === undefined || maxDurationBeforeAppointment >= Math.floor(timeUntil6PM)) {
                          return '(until 6 PM)';
                        }

                        // Find next appointment time for display
                        const slotDateTime = `${formik.values.date}T${formik.values.startTime}:00`;
                        const slotStart = parseDateTimeString(slotDateTime);
                        if (!slotStart) return '';

                        let nextStart: Date | null = null;
                        for (const range of blockedRanges) {
                          if (range.start.getTime() > slotStart.getTime()) {
                            if (!nextStart || range.start.getTime() < nextStart.getTime()) {
                              nextStart = range.start;
                            }
                          }
                        }

                        if (nextStart) {
                          const hours = nextStart.getHours();
                          const minutes = nextStart.getMinutes();
                          const ampm = hours >= 12 ? 'PM' : 'AM';
                          const displayHour = hours % 12 || 12;
                          return `(next appointment at ${displayHour}:${String(minutes).padStart(2, '0')} ${ampm})`;
                        }
                        return '';
                      })()}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="breakDuration">
                    <Clock className="label-icon" />
                    Break Between Slots *
                  </label>
                  <div className="duration-boxes-container">
                    {BREAK_DURATION_OPTIONS.map((option) => {
                      const isSelected = formik.values.breakDuration === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            formik.setFieldValue('breakDuration', option.value);
                            formik.setFieldTouched('breakDuration', true);
                          }}
                          className={`duration-box ${isSelected ? 'selected' : ''} ${formik.touched.breakDuration && formik.errors.breakDuration ? 'error' : ''}`}
                          disabled={isSubmitting}
                        >
                          <span className="duration-box-label">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {formik.touched.breakDuration && formik.errors.breakDuration && (
                    <div className="field-error">
                      <AlertCircle className="error-icon" size={14} />
                      {formik.errors.breakDuration}
                    </div>
                  )}
                  <div className="field-hint">
                    Time between consecutive slots (for preparation/cleanup)
                  </div>
                </div>

              </div>
            </div>

            {/* Preview Section */}
            {previewSlots.length > 0 && (
              <div className="slots-preview">
                <div className="preview-header">
                  <div className="preview-title-wrapper">
                    <h3 className="preview-title">
                      <Calendar size={18} />
                      Preview ({previewSlots.length} slot{previewSlots.length !== 1 ? 's' : ''})
                    </h3>
                    {formik.values.date && (
                      <span className="preview-date">
                        {(() => {
                          try {
                            const [year, month, day] = formik.values.date.split('-').map(Number);
                            const dateObj = new Date(year, month - 1, day);
                            if (isNaN(dateObj.getTime())) {
                              return formik.values.date;
                            }
                            return format(dateObj, 'EEEE, MMMM d, yyyy');
                          } catch (error) {
                            console.error('Error formatting preview date:', error);
                            return formik.values.date;
                          }
                        })()}
                      </span>
                    )}
                  </div>
                </div>

                {conflictCheckResult.hasConflicts && (
                  <div className="preview-warning preview-warning-error">
                    <AlertTriangle size={16} />
                    <div className="conflict-warning-content">
                      <span>
                        <strong>{conflictCheckResult.conflictingSlots.length}</strong> slot{conflictCheckResult.conflictingSlots.length !== 1 ? 's' : ''} conflict{conflictCheckResult.conflictingSlots.length !== 1 ? '' : 's'} with existing appointments. Please adjust your schedule.
                      </span>
                      <div className="conflicting-appointments-list">
                        {conflictCheckResult.conflictingSlots.map((conflictSlot) => (
                          <div key={conflictSlot.slot.index} className="conflict-item">
                            <span className="conflict-slot-info">
                              Slot #{conflictSlot.slot.index} ({conflictSlot.slot.displayTime}) conflicts with:
                            </span>
                            <ul className="conflict-appointments">
                              {conflictSlot.conflictingAppointments.map((apt, idx) => (
                                <li key={`${apt.id}-${idx}`}>
                                  {apt.patientName} - {apt.date} at {apt.time}
                                  {apt.duration && ` (${apt.duration} min)`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {wouldOverflowToNextDay && constrainToSameDay && (
                  <div className="preview-warning">
                    <AlertTriangle size={16} />
                    <span>
                      Some slots would overflow to the next day and have been excluded.
                      Consider reducing the number of slots or adjusting the start time.
                    </span>
                  </div>
                )}

                {previewSlots.length < formik.values.numberOfSlots && (
                  <div className="preview-info">
                    <Info size={16} />
                    <span>
                      Only {previewSlots.length} of {formik.values.numberOfSlots} requested slots fit within the day.
                    </span>
                  </div>
                )}

                <div className="slots-preview-grid">
                  {previewSlots.map((slot, idx) => {
                    const slotDate = new Date(slot.datetime);
                    const isNextDay = formik.values.date &&
                      slotDate.toDateString() !== new Date(formik.values.date).toDateString();
                    const hasConflict = conflictingSlotIndices.has(slot.index);

                    return (
                      <div
                        key={slot.index}
                        className={`slot-preview-item ${isNextDay ? 'next-day' : ''} ${hasConflict ? 'slot-conflict' : ''}`}
                        title={hasConflict ? 'This slot conflicts with an existing appointment' : ''}
                      >
                        <div className="slot-preview-header">
                          <span className="slot-index">#{slot.index}</span>
                          {hasConflict && (
                            <AlertTriangle className="conflict-icon" size={14} />
                          )}
                          {isNextDay && (
                            <span className="next-day-badge">Next Day</span>
                          )}
                        </div>
                        <span className="slot-time">{slot.displayTime}</span>
                        {idx < previewSlots.length - 1 && (
                          <span className="slot-arrow">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="preview-summary">
                  <div className="summary-row">
                    <span className="summary-label">Start:</span>
                    <span className="summary-value">{previewSlots[0]?.displayTime}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">End:</span>
                    <span className="summary-value">
                      {(() => {
                        if (previewSlots.length === 0) return 'N/A';
                        const lastSlot = previewSlots[previewSlots.length - 1];
                        const slotDate = new Date(lastSlot.datetime);
                        const endTime = new Date(slotDate.getTime() + Number(formik.values.slotDuration) * 60 * 1000);
                        return formatTimeForDisplay(endTime);
                      })()}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Duration:</span>
                    <span className="summary-value">{formik.values.slotDuration} min</span>
                  </div>
                  {formik.values.breakDuration > 0 && (
                    <div className="summary-row">
                      <span className="summary-label">Break:</span>
                      <span className="summary-value">{formik.values.breakDuration} min</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {formik.values.date && formik.values.startTime && formik.values.numberOfSlots > 0 && previewSlots.length === 0 && (
              <div className="preview-empty">
                <AlertTriangle size={20} />
                <p>No valid slots could be calculated. Please check your inputs.</p>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || previewSlots.length === 0 || conflictCheckResult.hasConflicts}
                title={conflictCheckResult.hasConflicts ? `Cannot create slots: ${conflictCheckResult.totalConflicts} conflict(s) detected` : ''}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="spinner" />
                    {formik.values.numberOfSlots === 1 ? (
                      'Creating Appointment...'
                    ) : (
                      `Creating Slots... (${successCount}/${previewSlots.length})`
                    )}
                  </>
                ) : conflictCheckResult.hasConflicts ? (
                  <>
                    <AlertTriangle size={16} />
                    Cannot Create ({conflictCheckResult.totalConflicts} conflict{conflictCheckResult.totalConflicts !== 1 ? 's' : ''})
                  </>
                ) : formik.values.numberOfSlots === 1 ? (
                  'Create Single Appointment'
                ) : (
                  `Create ${formik.values.numberOfSlots} Slot${formik.values.numberOfSlots !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default OpenSlotModal;

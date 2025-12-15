import React, { useState, useMemo } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAppointments } from '../../context/AppointmentContext';
import { X, Loader2, Calendar, Clock, AlertCircle, Plus, Minus, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import TimeSlotPicker from './TimeSlotPicker';
import SlotDatePicker from './SlotDatePicker';
import { format } from 'date-fns';

interface OpenSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CalculatedSlot {
  datetime: string;
  displayTime: string;
  index: number;
}

// Slot duration options in minutes (controlled selection)
const SLOT_DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
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
  const { openSlotWithoutRefresh, fetchAppointments } = useAppointments();
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [failedSlots, setFailedSlots] = useState<CalculatedSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationSchema = Yup.object({
    date: Yup.string()
      .required('Date is required')
      .matches(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date')
      .test('not-past', 'Date cannot be in the past', function(value) {
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
      .min(15, 'Minimum duration is 15 minutes')
      .max(240, 'Maximum duration is 4 hours'),
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
      } catch (err: any) {
        let errorMessage = err.response?.data?.message || err.message || 'Failed to open slots';

        if (errorMessage.includes('Network Error') || errorMessage.includes('ERR_NETWORK')) {
          errorMessage = 'Unable to open slots. Please check your connection and try again.';
        } else if (errorMessage.includes('409') || errorMessage.includes('Conflict')) {
          errorMessage = 'One or more time slots are already open or booked. Please select different times.';
        } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          errorMessage = 'Please check all fields and ensure the information is correct.';
        } else if (errorMessage.includes('500')) {
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

    // Calculate end of day (23:59:59) for same-day constraint
    const [year, month, day] = date.split('-').map(Number);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59);

    // Create sequential slots
    for (let i = 0; i < numberOfSlots; i++) {
      // Check if slot would exceed end of day (if constrained to same day)
      if (constrainToSameDay) {
        // Check if slot start time + duration would exceed end of day
        const slotEndTime = new Date(currentSlotDate.getTime() + slotDurationMinutes * 60 * 1000);
        if (slotEndTime > endOfDay) {
          // Stop creating slots if this slot would exceed the day
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
    return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
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
      } catch (err: any) {
        // Log failure with detailed information
        console.warn(`Failed to create slot ${slot.index} at ${slot.displayTime} (${slot.datetime}):`, {
          error: err.message || err,
          response: err.response?.data,
          status: err.response?.status,
        });
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

  if (!isOpen) return null;

  return (
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

        {successCount > 0 && failedSlots.length === 0 && (
          <div className="success-message">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={20} />
            </div>
            <div>
              Successfully created {successCount} slot{successCount !== 1 ? 's' : ''}!
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
                  onTimeSelect={(time) => formik.setFieldValue('startTime', time)}
                  date={formik.values.date}
                  error={formik.touched.startTime && formik.errors.startTime ? formik.errors.startTime : undefined}
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
                      max={MAX_SLOTS}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10) || 1;
                        const clampedValue = Math.max(1, Math.min(MAX_SLOTS, value));
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
                        const newValue = Math.min(MAX_SLOTS, formik.values.numberOfSlots + 1);
                        formik.setFieldValue('numberOfSlots', newValue);
                      }}
                      disabled={formik.values.numberOfSlots >= MAX_SLOTS || isSubmitting}
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
                  Maximum {MAX_SLOTS} slots per session
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
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          formik.setFieldValue('slotDuration', option.value);
                          formik.setFieldTouched('slotDuration', true);
                        }}
                        className={`duration-box ${isSelected ? 'selected' : ''} ${formik.touched.slotDuration && formik.errors.slotDuration ? 'error' : ''}`}
                        disabled={isSubmitting}
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

                  return (
                    <div
                      key={slot.index}
                      className={`slot-preview-item ${isNextDay ? 'next-day' : ''}`}
                    >
                      <div className="slot-preview-header">
                        <span className="slot-index">#{slot.index}</span>
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
              disabled={isSubmitting || previewSlots.length === 0}
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
  );
};

export default OpenSlotModal;

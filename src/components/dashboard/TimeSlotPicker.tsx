import React, { useState, useMemo } from 'react';
import { Clock, Lock, Timer } from 'lucide-react';
import { Appointment } from '../../types';
import { getBlockedTimeRanges, getMaxDurationBeforeNextAppointment } from '../../utils/appointmentConflict';
import { parseDateTimeString } from '../../utils/dateParsing';
import { APP_CONFIG } from '../../constants/appConfig';

interface TimeSlotPickerProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  date?: string;
  disabled?: boolean;
  error?: string;
  existingAppointments?: Appointment[];
  slotDuration?: number; // Duration in minutes for conflict checking
}

// Generate time slots from 8 AM to 6 PM in 30-minute intervals
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
};

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  selectedTime,
  onTimeSelect,
  date,
  disabled = false,
  error,
  existingAppointments = [],
  slotDuration = 30, // Default 30 minutes
}) => {
  const [customTime, setCustomTime] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const timeSlots = generateTimeSlots();

  // Get time slot availability with improved conflict detection
  // CRITICAL: Slots BEFORE blocked ranges MUST be selectable (with duration limits)
  // Only slots WITHIN blocked ranges should be disabled
  // This allows slots before appointments to be selectable, then duration is limited dynamically
  const timeSlotAvailability = useMemo(() => {
    // If no date, all slots are available
    if (!date) {
      return new Map<string, { isBlocked: boolean; reason?: string; maxDuration?: number }>();
    }

    // Filter appointments for the selected date
    const appointmentsForDate = existingAppointments.filter(
      (apt) => apt.date === date && apt.status !== 'Cancelled'
    );

    // If no appointments for this date, all slots are available
    if (appointmentsForDate.length === 0) {
      return new Map<string, { isBlocked: boolean; reason?: string; maxDuration?: number }>();
    }

    // Get blocked time ranges (handles consecutive appointments)
    const blockedRanges = getBlockedTimeRanges(appointmentsForDate, true);

    // Check each time slot
    // IMPORTANT: Slots BEFORE blocked ranges are ALWAYS selectable (with duration limits)
    // Only slots WITHIN blocked ranges are disabled
    const MIN_DURATION = 15;
    const availabilityMap = new Map<string, { isBlocked: boolean; reason?: string; maxDuration?: number }>();

    for (const time of timeSlots) {
      const slotDateTime = `${date}T${time}:00`;
      const slotStart = parseDateTimeString(slotDateTime);

      if (!slotStart) {
        // If we can't parse the slot time, mark it as available (better to allow than block)
        availabilityMap.set(time, { isBlocked: false });
        continue;
      }

      // CRITICAL CHECK: Is the slot start time WITHIN any blocked range?
      // Slot is ONLY blocked if: range.start <= slotStart < range.end
      // Slots BEFORE the range (slotStart < range.start) are SELECTABLE
      let isWithinBlockedRange = false;
      let blockingReason: string | undefined;

      for (const range of blockedRanges) {
        const slotTime = slotStart.getTime();
        const rangeStartTime = range.start.getTime();
        const rangeEndTime = range.end.getTime();

        // Only block if slot start is WITHIN the range (not before, not after)
        // This ensures slots BEFORE 9:30 are always selectable
        if (slotTime >= rangeStartTime && slotTime < rangeEndTime) {
          isWithinBlockedRange = true;
          const appointmentCount = range.appointments.length;
          blockingReason = appointmentCount === 1
            ? `Conflicts with existing appointment`
            : `Conflicts with ${appointmentCount} consecutive appointments`;
          break;
        }
      }

      if (isWithinBlockedRange) {
        // Slot is WITHIN a blocked range, disable it
        availabilityMap.set(time, {
          isBlocked: true,
          reason: blockingReason,
        });
        continue;
      }

      // Slot is BEFORE all blocked ranges or AFTER them - it's SELECTABLE
      // Calculate max duration before next appointment (if any)
      let maxDuration = getMaxDurationBeforeNextAppointment(time, date, blockedRanges);

      // Also consider 6 PM limit (reuse existing slotStart from above)
      if (slotStart) {
        const [year, month, day] = date.split('-').map(Number);
        const endTimeLimit = new Date(year, month - 1, day, APP_CONFIG.SLOT_END_TIME.HOUR, APP_CONFIG.SLOT_END_TIME.MINUTE, 0);
        const timeUntil6PM = (endTimeLimit.getTime() - slotStart.getTime()) / (1000 * 60);

        if (timeUntil6PM <= 0) {
          // Slot is at or after 6 PM, should be blocked
          availabilityMap.set(time, {
            isBlocked: true,
            reason: 'Time slot is at or after 6 PM',
          });
          continue;
        }

        // Use the minimum of time until next appointment OR time until 6 PM
        if (maxDuration === undefined) {
          maxDuration = Math.floor(timeUntil6PM);
        } else {
          maxDuration = Math.min(maxDuration, Math.floor(timeUntil6PM));
        }
      }

      // Only block if maxDuration is too small (< 15 min) - this handles edge cases
      // where there's literally no time (e.g., slot at 9:29 with appointment at 9:30)
      if (maxDuration !== undefined && maxDuration < MIN_DURATION) {
        // Check if this is because the slot is too close to the next appointment
        // If slot ends before or at the next appointment start, it's still selectable
        let nextAppointmentStart: Date | null = null;
        for (const range of blockedRanges) {
          if (range.start.getTime() > slotStart.getTime()) {
            if (!nextAppointmentStart || range.start.getTime() < nextAppointmentStart.getTime()) {
              nextAppointmentStart = range.start;
            }
          }
        }

        // If there's a next appointment and slot + min duration would overlap, block it
        if (nextAppointmentStart) {
          const slotEndWithMinDuration = new Date(slotStart.getTime() + MIN_DURATION * 60 * 1000);
          if (slotEndWithMinDuration.getTime() > nextAppointmentStart.getTime()) {
            availabilityMap.set(time, {
              isBlocked: true,
              reason: `Insufficient time before next appointment (${maxDuration} min available, minimum ${MIN_DURATION} min required)`,
              maxDuration,
            });
            continue;
          }
        }
      }

      // Slot is SELECTABLE - it's before all blocked ranges or has enough time
      // Set maxDuration if there's a next appointment (for UI hints)
      availabilityMap.set(time, {
        isBlocked: false,
        maxDuration, // This will be undefined if no next appointment
      });
    }

    return availabilityMap;
  }, [date, existingAppointments, timeSlots]);

  const handleCustomTimeSubmit = () => {
    if (customTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(customTime)) {
      // Validate that time is before 6 PM (18:00)
      const [hours, minutes] = customTime.split(':').map(Number);
      if (hours > 17 || (hours === 17 && minutes > 0)) {
        // Time is at or after 6 PM, reject it
        return;
      }
      onTimeSelect(customTime);
      setShowCustomInput(false);
      setCustomTime('');
    }
  };

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = String(hour % 12 || 12).padStart(2, '0');
    const displayMinutes = String(minutes).padStart(2, '0');
    return `${displayHour}:${displayMinutes} ${ampm}`;
  };

  return (
    <div className="time-slot-picker">
      <div className="time-slot-picker-header">
        <Clock className="time-slot-icon" />
        <span className="time-slot-label">Select Time Slot</span>
        {selectedTime && (
          <span className="selected-time-display">
            Selected: {formatTime(selectedTime)}
          </span>
        )}
      </div>

      {error && (
        <div className="time-slot-error">
          <span className="error-icon">⚠</span>
          {error}
        </div>
      )}

      <div className="time-slots-grid">
        {timeSlots.map((time) => {
          const isSelected = selectedTime === time;

          // Check if slot is in the past - use proper date parsing
          let isPast = false;
          if (date) {
            const slotDateTime = `${date}T${time}:00`;
            const slotStart = parseDateTimeString(slotDateTime);
            if (slotStart) {
              const now = new Date();
              // Compare dates properly - slot is past if it's before now
              isPast = slotStart.getTime() < now.getTime();
            }
          }

          const availability = timeSlotAvailability.get(time);
          // Only block slots that actually conflict - slots with maxDuration are still selectable
          const hasConflict = availability?.isBlocked || false;
          const maxDuration = availability?.maxDuration;

          // CRITICAL: Slots are ONLY disabled if:
          // 1. Parent component disabled them
          // 2. They are in the past
          // 3. They have a conflict (WITHIN blocked range)
          // Slots with maxDuration (BEFORE appointments) are SELECTABLE
          const isDisabled = disabled || isPast || hasConflict;

          let tooltipText = formatTime(time);
          if (isPast) {
            tooltipText = 'This time slot is in the past';
          } else if (hasConflict) {
            tooltipText = availability?.reason || 'This time slot conflicts with an existing appointment';
          } else if (maxDuration !== undefined) {
            // Show max duration hint for slots before appointments or 6 PM
            // Check if limit is due to 6 PM or next appointment
            let limitReason = '';
            if (date) {
              const slotDateTime = `${date}T${time}:00`;
              const slotStartForCheck = parseDateTimeString(slotDateTime);
              if (slotStartForCheck) {
                const [year, month, day] = date.split('-').map(Number);
                const endTimeLimit = new Date(year, month - 1, day, APP_CONFIG.SLOT_END_TIME.HOUR, APP_CONFIG.SLOT_END_TIME.MINUTE, 0);
                const timeUntil6PM = (endTimeLimit.getTime() - slotStartForCheck.getTime()) / (1000 * 60);

                // Check if there are appointments
                const appointmentsForDate = existingAppointments.filter(
                  (apt) => apt.date === date && apt.status !== 'Cancelled'
                );

                if (appointmentsForDate.length === 0) {
                  limitReason = ' (until 6 PM)';
                } else {
                  const blockedRanges = getBlockedTimeRanges(appointmentsForDate, true);
                  const maxDurationBeforeAppointment = getMaxDurationBeforeNextAppointment(time, date, blockedRanges);

                  if (maxDurationBeforeAppointment === undefined || maxDurationBeforeAppointment >= Math.floor(timeUntil6PM)) {
                    limitReason = ' (until 6 PM)';
                  } else {
                    limitReason = ' (limited by next appointment)';
                  }
                }
              }
            }

            if (maxDuration < slotDuration) {
              tooltipText = `Maximum duration: ${maxDuration} min${limitReason} (selected duration ${slotDuration} min exceeds limit)`;
            } else {
              tooltipText = `Maximum duration: ${maxDuration} min${limitReason}`;
            }
          }

          return (
            <button
              key={time}
              type="button"
              className={`time-slot-btn ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''} ${hasConflict ? 'time-slot-conflict' : ''} ${maxDuration !== undefined && !hasConflict ? 'time-slot-limited' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // CRITICAL: Only call onTimeSelect if button is NOT disabled
                // Slots BEFORE blocked ranges (with maxDuration) are SELECTABLE
                if (!isDisabled) {
                  onTimeSelect(time);
                }
              }}
              disabled={isDisabled}
              title={tooltipText}
              aria-disabled={isDisabled}
            >
              <span className="time-slot-text">{formatTime(time)}</span>
              {hasConflict && (
                <Lock className="time-slot-lock-icon" size={14} />
              )}
              {maxDuration !== undefined && !hasConflict && (
                <span className="time-slot-duration-hint">
                  <Timer className="time-slot-duration-icon" size={10} />
                  <span className="time-slot-duration-text">{maxDuration}m</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="custom-time-section">
        {!showCustomInput ? (
          <button
            type="button"
            className="custom-time-toggle"
            onClick={() => setShowCustomInput(true)}
            disabled={disabled}
          >
            + Add Custom Time
          </button>
        ) : (
          <div className="custom-time-input">
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              className="custom-time-field"
              placeholder="HH:MM"
              max="17:59"
            />
            {customTime && (() => {
              const [hours, minutes] = customTime.split(':').map(Number);
              if (hours > 17 || (hours === 17 && minutes > 0)) {
                return (
                  <div className="custom-time-error" style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Time must be before 6 PM
                  </div>
                );
              }
              return null;
            })()}
            <button
              type="button"
              className="custom-time-submit"
              onClick={handleCustomTimeSubmit}
              disabled={!customTime || (() => {
                if (!customTime) return true;
                const [hours, minutes] = customTime.split(':').map(Number);
                return hours > 17 || (hours === 17 && minutes > 0);
              })()}
            >
              Add
            </button>
            <button
              type="button"
              className="custom-time-cancel"
              onClick={() => {
                setShowCustomInput(false);
                setCustomTime('');
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotPicker;

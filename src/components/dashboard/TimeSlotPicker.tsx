import React, { useState } from 'react';
import { Clock, Check } from 'lucide-react';

interface TimeSlotPickerProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  date?: string;
  disabled?: boolean;
  error?: string;
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
}) => {
  const [customTime, setCustomTime] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const timeSlots = generateTimeSlots();

  const handleCustomTimeSubmit = () => {
    if (customTime && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(customTime)) {
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
          const isPast = date && new Date(`${date}T${time}`) < new Date();

          return (
            <button
              key={time}
              type="button"
              className={`time-slot-btn ${isSelected ? 'selected' : ''} ${isPast ? 'disabled' : ''}`}
              onClick={() => !isPast && !disabled && onTimeSelect(time)}
              disabled={!!disabled || !!isPast}
              title={isPast ? 'This time slot is in the past' : formatTime(time)}
            >
              {isSelected && <Check className="time-slot-check" />}
              <span className="time-slot-text">{formatTime(time)}</span>
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
            />
            <button
              type="button"
              className="custom-time-submit"
              onClick={handleCustomTimeSubmit}
              disabled={!customTime}
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

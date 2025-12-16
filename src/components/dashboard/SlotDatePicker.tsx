import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, startOfDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown, AlertCircle } from 'lucide-react';
// Styles are in App.css - using date-picker classes

interface SlotDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const SlotDatePicker: React.FC<SlotDatePickerProps> = ({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  placeholder = 'Select appointment date',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(); // Start with current month
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      setCurrentMonth(new Date(year, month - 1, day));
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dateOnly = startOfDay(date);
    const today = startOfDay(new Date());
    
    if (dateOnly < today) {
      return;
    }

    onChange(dateStr);
    setIsOpen(false);
    if (onBlur) onBlur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1);
      // Don't allow navigating to past months
      const today = startOfMonth(new Date());
      const newMonthStart = startOfMonth(newMonth);
      if (newMonthStart < today) {
        return prev; // Stay on current month
      }
      return newMonth;
    });
  };

  // Get calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const selectedDate = value ? (() => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  })() : null;

  const today = startOfDay(new Date());

  const isDateDisabled = (date: Date): boolean => {
    // Disable past dates
    const dateOnly = startOfDay(date);
    return dateOnly < today;
  };

  const displayValue = value ? (() => {
    try {
      const [year, month, day] = value.split('-').map(Number);
      // Validate date components
      if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
        return value;
      }
      const date = new Date(year, month - 1, day);
      // Validate the date is valid
      if (isNaN(date.getTime()) ||
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day) {
        return value;
      }
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date display value:', error);
      return value;
    }
  })() : '';

  // Check if we can navigate to previous month
  const canNavigatePrev = () => {
    const prevMonth = subMonths(currentMonth, 1);
    const prevMonthStart = startOfMonth(prevMonth);
    return prevMonthStart >= startOfMonth(today);
  };

  return (
    <div className="date-picker-wrapper" ref={pickerRef}>
      <div className="input-wrapper">
        <Calendar className="input-icon" size={18} />
        <input
          type="text"
          readOnly
          value={displayValue}
          placeholder={placeholder}
          disabled={disabled}
          className={`date-picker-input ${error ? 'error' : ''} ${disabled ? 'disabled' : ''} ${isOpen ? 'active' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setIsOpen(!isOpen);
            }
          }}
          aria-label="Select appointment date"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          tabIndex={disabled ? -1 : 0}
        />
        {value && !disabled && (
          <button
            type="button"
            className="date-picker-clear"
            onClick={handleClear}
            title="Clear date"
            aria-label="Clear selected date"
          >
            <X size={14} />
          </button>
        )}
        <ChevronDown className={`date-picker-chevron ${isOpen ? 'open' : ''}`} size={18} />
      </div>

      {isOpen && !disabled && (
        <div className="date-picker-calendar slot-date-picker-calendar" role="dialog" aria-label="Appointment date picker calendar" aria-modal="true">
          {/* Calendar View - Direct */}
          <div className="date-picker-header">
            <button
              type="button"
              className="date-picker-nav-btn"
              onClick={() => navigateMonth('prev')}
              title="Previous month"
              aria-label="Previous month"
              disabled={!canNavigatePrev()}
            >
              <ChevronLeft size={15} />
            </button>
            <div className="date-picker-month-year-display">
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button
              type="button"
              className="date-picker-nav-btn"
              onClick={() => navigateMonth('next')}
              title="Next month"
              aria-label="Next month"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="date-picker-weekdays" role="row">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="date-picker-weekday" role="columnheader" aria-label={day}>
                {day}
              </div>
            ))}
          </div>

          <div className="date-picker-days">
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const isDisabled = isDateDisabled(day);

              return (
                <button
                  key={idx}
                  type="button"
                  className={`date-picker-day ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isDisabled) {
                      handleDateSelect(day);
                    }
                  }}
                  disabled={isDisabled}
                  title={isDisabled ? 'Past dates cannot be selected' : format(day, 'MMM dd, yyyy')}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="field-error">
          <AlertCircle className="error-icon" size={16} />
          {error}
        </div>
      )}
    </div>
  );
};

export default SlotDatePicker;


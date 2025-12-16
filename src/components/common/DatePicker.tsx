import React, { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, X, ChevronDown, AlertCircle } from 'lucide-react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  onBlur?: () => void;
  minDate?: string; // YYYY-MM-DD format
  maxDate?: string; // YYYY-MM-DD format
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  onBlur,
  minDate,
  maxDate,
  error,
  disabled = false,
  placeholder = 'Select a date',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'year' | 'month' | 'calendar'>('year'); // Start with year view
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [yearPage, setYearPage] = useState(0); // Current page for year pagination
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('year');
        setSelectedYear(null);
        setSelectedMonth(null);
        setYearPage(0);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Reset view mode and pagination when opening
  useEffect(() => {
    if (isOpen) {
      setViewMode('year');
      setSelectedYear(null);
      setSelectedMonth(null);
      setYearPage(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      setCurrentMonth(new Date(year, month - 1, day));
      setSelectedYear(year);
      setSelectedMonth(month - 1);
    }
  }, [value]);

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (maxDateObj) {
      const maxDateOnly = new Date(maxDateObj.getFullYear(), maxDateObj.getMonth(), maxDateObj.getDate());
      if (dateOnly > maxDateOnly) {
        return;
      }
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
    setCurrentMonth(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  // Parse min/max dates first (before they're used in functions)
  const minDateObj = minDate ? (() => {
    const [year, month, day] = minDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  })() : null;

  const maxDateObj = maxDate ? (() => {
    const [year, month, day] = maxDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  })() : null;

  // Generate year list - show years from minDate year (2000) down to 1961
  // Years above 2000 should NOT be displayed (users must be 25+)
  // Years 1960 and below are NOT displayed for better UX
  // Dates before 2000 are valid (they guarantee age >= 25)
  const getAvailableYears = (): number[] => {
    const currentYear = new Date().getFullYear();
    // Get the maximum selectable year from minDate (e.g., 2000)
    // This is the latest year that makes someone 25+ years old
    const maxSelectableYear = minDateObj ? minDateObj.getFullYear() : currentYear - 25;
    const minSelectableYear = 1961; // Don't show years 1960 and below
    const years: number[] = [];
    // Start from maxSelectableYear (2000) and go down to 1961
    // This ensures years above 2000 and years 1960/below are NOT displayed
    for (let year = maxSelectableYear; year >= minSelectableYear; year--) {
      years.push(year);
    }
    return years;
  };

  // Get paginated years (8 years per page)
  const YEARS_PER_PAGE = 8;
  const allYears = getAvailableYears();
  const totalPages = Math.ceil(allYears.length / YEARS_PER_PAGE);
  const getPaginatedYears = (): number[] => {
    const startIndex = yearPage * YEARS_PER_PAGE;
    const endIndex = startIndex + YEARS_PER_PAGE;
    return allYears.slice(startIndex, endIndex);
  };

  const goToNextYearPage = () => {
    if (yearPage < totalPages - 1) {
      setYearPage(yearPage + 1);
    }
  };

  const goToPrevYearPage = () => {
    if (yearPage > 0) {
      setYearPage(yearPage - 1);
    }
  };

  // Generate month list
  const getAvailableMonths = (): { value: number; label: string }[] => {
    return [
      { value: 0, label: 'January' },
      { value: 1, label: 'February' },
      { value: 2, label: 'March' },
      { value: 3, label: 'April' },
      { value: 4, label: 'May' },
      { value: 5, label: 'June' },
      { value: 6, label: 'July' },
      { value: 7, label: 'August' },
      { value: 8, label: 'September' },
      { value: 9, label: 'October' },
      { value: 10, label: 'November' },
      { value: 11, label: 'December' },
    ];
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(year);
      return newDate;
    });
    // Move to month selection view
    setViewMode('month');
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(month);
      return newDate;
    });
    // Move to calendar view
    setViewMode('calendar');
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

  const isDateDisabled = (date: Date): boolean => {
    // Compare dates without time component
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // For DOB: 
    // - Dates BEFORE minDate are VALID (they guarantee age >= 25, e.g., dates before 2000)
    // - Only disable dates AFTER maxDate (future dates)
    // - Dates after minDate will be validated for age in form validation
    if (maxDateObj) {
      const maxDateOnly = new Date(maxDateObj.getFullYear(), maxDateObj.getMonth(), maxDateObj.getDate());
      // Disable future dates only
      if (dateOnly > maxDateOnly) {
        return true;
      }
    }
    // Dates before minDate are NOT disabled - they're valid (age >= 25 guaranteed)
    return false;
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
          aria-label="Select date"
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
        <div className="date-picker-calendar" role="dialog" aria-label="Date picker calendar" aria-modal="true">
          {/* Year Selection View */}
          {viewMode === 'year' && (
            <>
              <div className="date-picker-header">
                <button
                  type="button"
                  className="date-picker-nav-btn"
                  onClick={goToPrevYearPage}
                  disabled={yearPage === 0}
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="date-picker-view-title">
                  Select Year
                  <span className="date-picker-page-info">({yearPage + 1} / {totalPages})</span>
                </div>
                <button
                  type="button"
                  className="date-picker-nav-btn"
                  onClick={goToNextYearPage}
                  disabled={yearPage >= totalPages - 1}
                  title="Next page"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div className="date-picker-year-grid">
                {getPaginatedYears().map((year) => (
                  <button
                    key={year}
                    type="button"
                    className={`date-picker-year-item ${selectedYear === year ? 'selected' : ''}`}
                    onClick={() => handleYearSelect(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Month Selection View */}
          {viewMode === 'month' && (
            <>
              <div className="date-picker-header">
                <button
                  type="button"
                  className="date-picker-back-btn"
                  onClick={() => {
                    setViewMode('year');
                    setSelectedYear(null);
                  }}
                  aria-label="Back to year selection"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="date-picker-view-title">Select Month</div>
                <div style={{ width: '32px' }}></div>
              </div>
              <div className="date-picker-month-grid">
                {getAvailableMonths().map((month) => (
                  <button
                    key={month.value}
                    type="button"
                    className={`date-picker-month-item ${selectedMonth === month.value ? 'selected' : ''}`}
                    onClick={() => handleMonthSelect(month.value)}
                  >
                    {month.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <>
              <div className="date-picker-header">
                <button
                  type="button"
                  className="date-picker-nav-btn"
                  onClick={() => navigateMonth('prev')}
                  title="Previous month"
                  aria-label="Previous month"
                  disabled={(() => {
                    const prevMonth = subMonths(currentMonth, 1);
                    return minDateObj ? prevMonth < startOfMonth(minDateObj) : false;
                  })()}
                >
                  <ChevronLeft size={18} />
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
                  disabled={(() => {
                    const nextMonth = addMonths(currentMonth, 1);
                    return maxDateObj ? nextMonth > startOfMonth(maxDateObj) : false;
                  })()}
                >
                  <ChevronRight size={18} />
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
                      title={isDisabled ? 'This date is not available' : format(day, 'MMM dd, yyyy')}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>

            </>
          )}
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

export default DatePicker;

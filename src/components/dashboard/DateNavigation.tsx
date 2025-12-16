import React, { useMemo } from 'react';
import { format, addDays, isToday, isSameDay, startOfDay } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppointments } from '../../context/AppointmentContext';
import { getAppointmentsForDate, parseAppointmentDate } from '../../utils/dateUtils';
import './DateNavigation.css';

interface DateNavigationProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

const DateNavigation: React.FC<DateNavigationProps> = ({
  selectedDate,
  onDateSelect
}) => {
  const { appointments } = useAppointments();
  const today = startOfDay(new Date());
  const activeDate = selectedDate ? startOfDay(selectedDate) : today;

  // Generate 7 days: Today + next 6 days
  const dateRange = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(today, i));
  }, [today]);

  // Get appointment counts for each date
  const getAppointmentCount = (date: Date): number => {
    return getAppointmentsForDate(appointments, date).length;
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const formatDayLabel = (date: Date): string => {
    if (isToday(date)) {
      return 'Today';
    }
    return format(date, 'EEE');
  };

  const formatDateNumber = (date: Date): string => {
    return format(date, 'd');
  };

  const formatMonth = (date: Date): string => {
    return format(date, 'MMM');
  };

  return (
    <div className="date-navigation-container">
      <div className="date-navigation-header">
        <div className="date-navigation-title">
          <Calendar className="date-nav-icon" size={20} />
          <span>Schedule Overview</span>
        </div>
        <div className="date-navigation-quick-actions">
          <button
            className="date-nav-quick-btn"
            onClick={() => handleDateClick(today)}
            aria-label="Go to today"
          >
            Today
          </button>
        </div>
      </div>
      <div className="date-navigation-scroll">
        <div className="date-navigation-days">
          {dateRange.map((date) => {
            const isActive = isSameDay(date, activeDate);
            const isTodayDate = isToday(date);
            const appointmentCount = getAppointmentCount(date);
            const isCurrentMonth = date.getMonth() === today.getMonth();

            return (
              <button
                key={date.toISOString()}
                className={`date-nav-pill ${isActive ? 'active' : ''} ${isTodayDate ? 'today' : ''}`}
                onClick={() => handleDateClick(date)}
                aria-label={`Select ${format(date, 'EEEE, MMMM d, yyyy')}`}
                aria-pressed={isActive}
              >
                <div className="date-pill-content">
                  <div className="date-pill-day">{formatDayLabel(date)}</div>
                  <div className={`date-pill-number ${isTodayDate ? 'today-number' : ''}`}>
                    {formatDateNumber(date)}
                  </div>
                  {!isCurrentMonth && (
                    <div className="date-pill-month">{formatMonth(date)}</div>
                  )}
                  {appointmentCount > 0 && (
                    <div className="date-pill-badge">{appointmentCount}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DateNavigation;

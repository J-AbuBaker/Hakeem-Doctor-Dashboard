import React, { useState, useMemo, useEffect } from 'react';
import { format, isBefore, startOfDay, isSameDay } from 'date-fns';
import { History, Clock } from 'lucide-react';
import { useAppointments } from '../../app/providers';
import { parseAppointmentDate } from '../../shared/utils/date/utils';
import { hasStatus } from '../../utils/appointment/status';
import { sortAppointmentsByDateTime } from '../../utils/appointment/sorting';
import {
  getWeeksWithAppointments,
  groupAppointmentsByDay,
} from '../../shared/utils/date/week';
import AppointmentCard from './AppointmentCard';
import WeekNavigation from './WeekNavigation';
import SectionModule from './SectionModule';
import './ExpiredAppointments.css';

const ExpiredAppointments: React.FC = () => {
  const { appointments } = useAppointments();
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const today = startOfDay(new Date());

  // Get all weeks with past appointments (expired + past due)
  const weeksWithAppointments = useMemo(() => {
    // Filter to only past appointments (expired status or past dates)
    const pastAppointments = appointments.filter((apt) => {
      const aptDate = parseAppointmentDate(apt);
      if (!aptDate) return false;

      // Include expired status
      if (hasStatus(apt.status, 'Expired')) return true;

      // Include past due: scheduled appointments that are past their date
      const aptStartOfDay = startOfDay(aptDate);
      if (isBefore(aptStartOfDay, today)) {
        // Only include if it's scheduled and has a patient (not just an unbooked slot)
        if (hasStatus(apt.status, 'Scheduled') && apt.patientId && apt.patientId !== '0' && apt.patientName !== 'Available Slot') {
          return true;
        }
        // Or if it's completed/cancelled and in the past
        if (hasStatus(apt.status, 'Completed') || hasStatus(apt.status, 'Cancelled')) {
          return true;
        }
      }

      return false;
    });

    // Sort weeks in reverse chronological order (most recent first)
    const weeks = getWeeksWithAppointments(pastAppointments);
    return weeks.sort((a, b) => b.start.getTime() - a.start.getTime());
  }, [appointments, today]);

  // Get current week's appointments
  const currentWeek = useMemo(() => {
    if (weeksWithAppointments.length === 0) return null;
    const week = weeksWithAppointments[currentWeekIndex];
    return {
      ...week,
      appointments: sortAppointmentsByDateTime(week.appointments),
    };
  }, [weeksWithAppointments, currentWeekIndex]);

  // Group appointments by day for current week
  const appointmentsByDay = useMemo(() => {
    if (!currentWeek) return new Map<string, typeof appointments>();
    return groupAppointmentsByDay(currentWeek.appointments);
  }, [currentWeek]);

  // Initialize to most recent week (index 0 after reverse sort)
  useEffect(() => {
    if (weeksWithAppointments.length === 0) return;
    // Always start with the most recent week (index 0)
    setCurrentWeekIndex(0);
  }, [weeksWithAppointments]);

  const handlePreviousWeek = () => {
    if (currentWeekIndex < weeksWithAppointments.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    }
  };

  const handleNextWeek = () => {
    // Not used for past appointments - always disabled
  };

  const handleGoToCurrentWeek = () => {
    // Go to most recent week (index 0)
    setCurrentWeekIndex(0);
  };

  const formatTime = (timeString: string): string => {
    try {
      if (!timeString || !timeString.includes(':')) {
        return timeString;
      }
      const [hours, minutes] = timeString.split(':').map(Number);
      const hour12 = hours % 12 || 12;
      const period = hours >= 12 ? 'PM' : 'AM';
      return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch {
      return timeString;
    }
  };

  // Check if appointment is in progress (happening now or within next 2 hours)
  const isInProgress = (appointment: typeof appointments[0]): boolean => {
    if (!hasStatus(appointment.status, 'Scheduled')) {
      return false;
    }
    const aptDate = parseAppointmentDate(appointment);
    if (!aptDate) return false;
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return aptDate > now && aptDate <= twoHoursFromNow;
  };

  const formatDayLabel = (date: Date): { label: string; subtitle: string } => {
    const todayDate = startOfDay(new Date());
    const yesterday = startOfDay(new Date(todayDate.getTime() - 24 * 60 * 60 * 1000));

    if (isSameDay(date, todayDate)) {
      return {
        label: 'Today',
        subtitle: format(date, 'EEEE, MMMM d'),
      };
    }

    if (isSameDay(date, yesterday)) {
      return {
        label: 'Yesterday',
        subtitle: format(date, 'EEEE, MMMM d'),
      };
    }

    return {
      label: format(date, 'EEEE'),
      subtitle: format(date, 'MMMM d'),
    };
  };

  // Separate completed vs missed/expired
  const categorizeAppointments = (apts: typeof appointments) => {
    return {
      expired: apts.filter(a => hasStatus(a.status, 'Expired')),
      completed: apts.filter(a => hasStatus(a.status, 'Completed')),
      missed: apts.filter(a => !hasStatus(a.status, 'Completed') && !hasStatus(a.status, 'Expired')),
    };
  };

  if (weeksWithAppointments.length === 0) {
    return (
      <SectionModule
        title="Previous Appointments"
        subtitle="Weekly view"
        icon={History}
        empty={true}
        emptyTitle="No previous appointments"
        emptySubtitle="You have no past appointments."
        emptyIcon={History}
        aria-label="Previous Appointments"
      >
        <></>
      </SectionModule>
    );
  }

  // Sort days chronologically (oldest to newest within week)
  const sortedDays = Array.from(appointmentsByDay.entries())
    .map(([dateKey, apts]) => ({
      date: new Date(dateKey),
      dateKey,
      appointments: sortAppointmentsByDateTime(apts),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first within week

  return (
    <SectionModule
      title="Previous Appointments"
      subtitle="Weekly view"
      icon={History}
      aria-label="Previous Appointments"
    >
      <WeekNavigation
        weekStart={currentWeek!.start}
        weekEnd={currentWeek!.end}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        canGoPrevious={currentWeekIndex < weeksWithAppointments.length - 1}
        canGoNext={false}
        onGoToCurrentWeek={handleGoToCurrentWeek}
        showCurrentWeekButton={currentWeekIndex !== 0}
        isCurrentWeek={false}
      />

      <div className="upcoming-appointments-week-view">
        {sortedDays.length === 0 ? (
          <div className="upcoming-week-empty">
            <p className="empty-message">No appointments scheduled for this week.</p>
          </div>
        ) : (
          <div className="upcoming-days-list">
            {sortedDays.map(({ date, dateKey, appointments: dayAppointments }) => {
              const dayLabel = formatDayLabel(date);
              const dayCategorized = categorizeAppointments(dayAppointments);

              return (
                <div key={dateKey} className="upcoming-day-group">
                  <div className="upcoming-day-header-group">
                    <div className="upcoming-day-header-info">
                      <h3 className="upcoming-day-label">{dayLabel.label}</h3>
                      <p className="upcoming-day-date">{dayLabel.subtitle}</p>
                    </div>
                    <div className="upcoming-day-header-badges">
                      <span className="upcoming-day-count-badge">
                        {dayAppointments.length}{' '}
                        {dayAppointments.length === 1 ? 'appointment' : 'appointments'}
                      </span>
                      {dayCategorized.completed.length > 0 && (
                        <span className="upcoming-day-scheduled-badge">
                          {dayCategorized.completed.length} completed
                        </span>
                      )}
                      {dayCategorized.expired.length > 0 && (
                        <span className="expired-badge expired">
                          {dayCategorized.expired.length} expired
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="upcoming-day-appointments">
                    {dayAppointments.map((appointment) => {
                      const inProgress = isInProgress(appointment);
                      const statusClass = hasStatus(appointment.status, 'Expired')
                        ? 'status-expired'
                        : hasStatus(appointment.status, 'Completed')
                          ? 'status-completed'
                          : hasStatus(appointment.status, 'Cancelled')
                            ? 'status-cancelled'
                            : 'status-scheduled';
                      return (
                        <div key={appointment.id} className={`upcoming-appointment-item ${inProgress ? 'in-progress' : ''}`}>
                          <div className={`upcoming-appointment-time ${statusClass} ${inProgress ? 'in-progress' : ''}`}>
                            <div className="time-display-wrapper">
                              <Clock className="time-icon" size={18} aria-hidden="true" />
                              <span className="time-text">{formatTime(appointment.time)}</span>
                            </div>
                          </div>
                          <div className="upcoming-appointment-card">
                            <AppointmentCard
                              appointment={appointment}
                              hideTime={true}
                              compact={true}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionModule>
  );
};

export default ExpiredAppointments;

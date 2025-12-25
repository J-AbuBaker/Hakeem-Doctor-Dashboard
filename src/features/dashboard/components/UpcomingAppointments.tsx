import React, { useState, useMemo, useEffect } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { useAppointments } from '@app/providers';
import { parseAppointmentDate } from '@shared/utils/date/utils';
import { hasStatus } from '@features/appointments/utils/status';
import { sortAppointmentsByDateTime } from '@features/appointments/utils/sorting';
import {
  getWeeksWithAppointments,
  groupAppointmentsByDay,
  getCurrentWeekStart,
  isDateInWeek,
  findWeekIndex,
} from '@shared/utils/date/week';
import AppointmentCard from './AppointmentCard';
import WeekNavigation from './WeekNavigation';
import SectionModule from './SectionModule';
import './UpcomingAppointments.css';

const UpcomingAppointments: React.FC = () => {
  const { appointments } = useAppointments();
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  // Get all weeks with appointments (only weeks that have appointments)
  const weeksWithAppointments = useMemo(() => {
    // Filter to only future appointments
    const futureAppointments = appointments.filter((apt) => {
      const aptDate = parseAppointmentDate(apt);
      if (!aptDate) return false;
      return aptDate > startOfDay(new Date());
    });
    return getWeeksWithAppointments(futureAppointments);
  }, [appointments]);

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

  // Initialize to current week or first available week
  useEffect(() => {
    if (weeksWithAppointments.length === 0) return;

    const currentWeekStart = getCurrentWeekStart();
    const currentWeekIdx = findWeekIndex(weeksWithAppointments, currentWeekStart);

    if (currentWeekIdx >= 0) {
      setCurrentWeekIndex(currentWeekIdx);
    } else {
      // If current week has no appointments, go to first available week
      setCurrentWeekIndex(0);
    }
  }, [weeksWithAppointments]);

  const handlePreviousWeek = () => {
    if (currentWeekIndex > 0) {
      setCurrentWeekIndex(currentWeekIndex - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIndex < weeksWithAppointments.length - 1) {
      setCurrentWeekIndex(currentWeekIndex + 1);
    }
  };

  const handleGoToCurrentWeek = () => {
    const currentWeekStart = getCurrentWeekStart();
    const currentWeekIdx = findWeekIndex(weeksWithAppointments, currentWeekStart);
    if (currentWeekIdx >= 0) {
      setCurrentWeekIndex(currentWeekIdx);
    }
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
    const today = startOfDay(new Date());
    const tomorrow = startOfDay(new Date(today.getTime() + 24 * 60 * 60 * 1000));

    if (isSameDay(date, today)) {
      return {
        label: 'Today',
        subtitle: format(date, 'EEEE, MMMM d'),
      };
    }

    if (isSameDay(date, tomorrow)) {
      return {
        label: 'Tomorrow',
        subtitle: format(date, 'EEEE, MMMM d'),
      };
    }

    return {
      label: format(date, 'EEEE'),
      subtitle: format(date, 'MMMM d'),
    };
  };

  if (weeksWithAppointments.length === 0) {
    return (
      <SectionModule
        title="Upcoming Appointments"
        subtitle="Weekly view"
        icon={Calendar}
        empty={true}
        emptyTitle="No upcoming appointments"
        emptySubtitle="You have no appointments scheduled for upcoming weeks."
        emptyIcon={Calendar}
        aria-label="Upcoming Appointments"
      >
        {null}
      </SectionModule>
    );
  }

  const isCurrentWeek = currentWeek
    ? isDateInWeek(new Date(), currentWeek.start)
    : false;

  // Sort days chronologically
  const sortedDays = Array.from(appointmentsByDay.entries())
    .map(([dateKey, apts]) => ({
      date: new Date(dateKey),
      dateKey,
      appointments: sortAppointmentsByDateTime(apts),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <SectionModule
      title="Upcoming Appointments"
      subtitle="Weekly view"
      icon={Calendar}
      aria-label="Upcoming Appointments"
    >
      <WeekNavigation
        weekStart={currentWeek!.start}
        weekEnd={currentWeek!.end}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        canGoPrevious={currentWeekIndex > 0}
        canGoNext={currentWeekIndex < weeksWithAppointments.length - 1}
        onGoToCurrentWeek={handleGoToCurrentWeek}
        showCurrentWeekButton={!isCurrentWeek}
        isCurrentWeek={isCurrentWeek}
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
              const scheduledCount = dayAppointments.filter((a) =>
                hasStatus(a.status, 'Scheduled')
              ).length;

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
                      {scheduledCount > 0 && (
                        <span className="upcoming-day-scheduled-badge">
                          {scheduledCount} scheduled
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

export default UpcomingAppointments;

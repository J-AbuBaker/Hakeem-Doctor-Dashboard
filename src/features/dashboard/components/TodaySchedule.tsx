import React, { useMemo, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar } from 'lucide-react';
import { useAppointments } from '@app/providers';
import { getTodayAppointments, parseAppointmentDate } from '@shared/utils/date/utils';
import { hasStatus } from '@features/appointments/utils/status';
import { sortAppointmentsByDateTime } from '@features/appointments/utils/sorting';
import AppointmentCard from './AppointmentCard';
import SectionModule from './SectionModule';
import './TodaySchedule.css';

const TodaySchedule: React.FC = () => {
  const { appointments } = useAppointments();

  const todayAppointments = useMemo(() => {
    const today = getTodayAppointments(appointments);
    return sortAppointmentsByDateTime(today);
  }, [appointments]);

  const formatTime = (timeString: string): string => {
    try {
      if (!timeString || !timeString.includes(':')) {
        return timeString;
      }
      const [hours, minutes] = timeString.split(':').map(Number);
      const hour12 = hours % 12 || 12;
      const period = hours >= 12 ? 'PM' : 'AM';
      return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  const appointmentRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);

  const getUpcomingAppointments = () => {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return todayAppointments.filter(apt => {
      const aptDate = parseAppointmentDate(apt);
      if (!aptDate) return false;
      return aptDate > now && aptDate <= twoHoursFromNow && hasStatus(apt.status, 'Scheduled');
    });
  };

  const upcomingAppointments = getUpcomingAppointments();
  const scheduledCount = todayAppointments.filter(a => hasStatus(a.status, 'Scheduled')).length;
  const completedCount = todayAppointments.filter(a => hasStatus(a.status, 'Completed')).length;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (todayAppointments.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev === null ? 0 : Math.min(prev + 1, todayAppointments.length - 1);
          const ref = appointmentRefs.current.get(todayAppointments[next]?.id);
          ref?.focus();
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev === null ? todayAppointments.length - 1 : Math.max(prev - 1, 0);
          const ref = appointmentRefs.current.get(todayAppointments[next]?.id);
          ref?.focus();
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [todayAppointments]);

  return (
    <SectionModule
      title="Today's Schedule"
      subtitle={format(new Date(), 'EEEE, MMMM d, yyyy')}
      icon={Calendar}
      actions={
        <div className="today-schedule-stats">
          <div className="today-stat-item">
            <span className="today-stat-label">Scheduled</span>
            <span className="today-stat-value">{scheduledCount}</span>
          </div>
          <div className="today-stat-item">
            <span className="today-stat-label">Completed</span>
            <span className="today-stat-value completed">{completedCount}</span>
          </div>
        </div>
      }
      empty={todayAppointments.length === 0}
      emptyTitle="No appointments scheduled for today"
      emptySubtitle="You have a free schedule. Consider opening new slots for patients."
      emptyIcon={Calendar}
      aria-label="Today's Schedule"
    >
      {upcomingAppointments.length > 0 && (
        <div className="today-upcoming-alert" role="alert" aria-live="polite">
          <Clock className="upcoming-icon" size={18} aria-hidden="true" />
          <span>
            <strong>{upcomingAppointments.length}</strong> appointment{upcomingAppointments.length !== 1 ? 's' : ''} in the next 2 hours
          </span>
        </div>
      )}

      {todayAppointments.length > 0 && (
        <div className="today-schedule-timeline" role="list" aria-label="Today's appointments">
          {todayAppointments.map((appointment, index) => {
            const appointmentDate = parseAppointmentDate(appointment);
            const isUpcoming = appointmentDate &&
              appointmentDate > new Date() &&
              appointmentDate <= new Date(Date.now() + 2 * 60 * 60 * 1000) &&
              hasStatus(appointment.status, 'Scheduled');
            const isOverdue = appointmentDate && appointmentDate < new Date() && hasStatus(appointment.status, 'Scheduled');

            return (
              <div
                key={appointment.id}
                ref={(el) => {
                  if (el) appointmentRefs.current.set(appointment.id, el);
                  else appointmentRefs.current.delete(appointment.id);
                }}
                className={`today-appointment-item ${isUpcoming ? 'upcoming' : ''} ${isOverdue ? 'overdue' : ''}`}
                role="listitem"
                tabIndex={0}
                aria-label={`Appointment at ${formatTime(appointment.time)} with ${appointment.patientName}`}
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => {
                  if (focusedIndex === index) setFocusedIndex(null);
                }}
              >
                <div className="today-appointment-time">
                  <div className="time-display-wrapper">
                    <Clock className="time-icon" size={18} aria-hidden="true" />
                    <span className="time-text">{formatTime(appointment.time)}</span>
                  </div>
                </div>
                <div className="today-appointment-content">
                  <AppointmentCard
                    appointment={appointment}
                    hideTime={true}
                    hideDate={true}
                    compact={true}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionModule>
  );
};

export default TodaySchedule;

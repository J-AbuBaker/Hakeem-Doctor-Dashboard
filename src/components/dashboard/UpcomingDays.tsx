import React, { useState, useMemo } from 'react';
import { format, addDays, startOfDay } from 'date-fns';
import { ChevronDown, ChevronRight, Calendar, Clock } from 'lucide-react';
import { useAppointments } from '../../app/providers';
import { getAppointmentsForDate } from '../../shared/utils/date/utils';
import { hasStatus } from '../../utils/appointment/status';
import { sortAppointmentsByDateTime } from '../../utils/appointment/sorting';
import AppointmentCard from './AppointmentCard';
import './UpcomingDays.css';

const UpcomingDays: React.FC = () => {
  const { appointments } = useAppointments();
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const today = startOfDay(new Date());

  // Generate next 6 days (excluding today)
  const upcomingDays = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => addDays(today, i + 1));
  }, [today]);

  const toggleDay = (dateKey: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const getDayAppointments = (date: Date) => {
    const dayApps = getAppointmentsForDate(appointments, date);
    return sortAppointmentsByDateTime(dayApps);
  };

  const formatDayLabel = (date: Date): { label: string; subtitle: string } => {
    const dayOfWeek = format(date, 'EEEE');
    const dateStr = format(date, 'MMMM d');

    if (date.getTime() === addDays(today, 1).getTime()) {
      return {
        label: 'Tomorrow',
        subtitle: `${dayOfWeek}, ${dateStr}`
      };
    }

    return {
      label: dayOfWeek,
      subtitle: dateStr
    };
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
    } catch (error) {
      return timeString;
    }
  };

  const daysWithAppointments = upcomingDays.filter(date => {
    const dayApps = getDayAppointments(date);
    return dayApps.length > 0;
  });

  if (daysWithAppointments.length === 0) {
    return (
      <div className="upcoming-days-section">
        <div className="upcoming-days-header">
          <Calendar className="upcoming-days-icon" size={24} />
          <div>
            <h2 className="upcoming-days-title">Upcoming Appointments</h2>
            <p className="upcoming-days-subtitle">Next 6 days</p>
          </div>
        </div>
        <div className="upcoming-days-empty">
          <Calendar className="empty-icon" size={48} />
          <p className="empty-title">No upcoming appointments</p>
          <p className="empty-subtitle">You have no appointments scheduled for the next 6 days.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upcoming-days-section">
      <div className="upcoming-days-header">
        <Calendar className="upcoming-days-icon" size={24} />
        <div>
          <h2 className="upcoming-days-title">Upcoming Appointments</h2>
          <p className="upcoming-days-subtitle">Next 6 days</p>
        </div>
      </div>

      <div className="upcoming-days-list">
        {daysWithAppointments.map((date) => {
          const dateKey = format(date, 'yyyy-MM-dd');
          const isExpanded = expandedDays.has(dateKey);
          const dayAppointments = getDayAppointments(date);
          const dayLabel = formatDayLabel(date);
          const scheduledCount = dayAppointments.filter(a => hasStatus(a.status, 'Scheduled')).length;
          const previewAppointments = dayAppointments.slice(0, 2);
          const hasMore = dayAppointments.length > 2;

          return (
            <div key={dateKey} className="upcoming-day-card">
              <button
                className="upcoming-day-header"
                onClick={() => toggleDay(dateKey)}
                aria-expanded={isExpanded}
              >
                <div className="upcoming-day-header-left">
                  {isExpanded ? (
                    <ChevronDown className="expand-icon" size={20} />
                  ) : (
                    <ChevronRight className="expand-icon" size={20} />
                  )}
                  <div className="upcoming-day-info">
                    <div className="upcoming-day-label">{dayLabel.label}</div>
                    <div className="upcoming-day-date">{dayLabel.subtitle}</div>
                  </div>
                </div>
                <div className="upcoming-day-header-right">
                  <div className="upcoming-day-count-badge">
                    {dayAppointments.length} {dayAppointments.length === 1 ? 'appointment' : 'appointments'}
                  </div>
                  {scheduledCount > 0 && (
                    <div className="upcoming-day-scheduled-badge">
                      {scheduledCount} scheduled
                    </div>
                  )}
                </div>
              </button>

              {isExpanded ? (
                <div className="upcoming-day-content">
                  <div className="upcoming-day-appointments">
                    {dayAppointments.map((appointment) => (
                      <div key={appointment.id} className="upcoming-appointment-item">
                        <div className="upcoming-appointment-time">
                          <Clock className="time-icon" size={14} />
                          <span>{formatTime(appointment.time)}</span>
                        </div>
                        <div className="upcoming-appointment-card">
                          <AppointmentCard
                            appointment={appointment}
                            hideTime={true}
                            compact={true}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="upcoming-day-preview">
                  {previewAppointments.map((appointment) => (
                    <div key={appointment.id} className="upcoming-preview-item">
                      <Clock className="preview-time-icon" size={14} />
                      <span className="preview-time">{formatTime(appointment.time)}</span>
                      <span className="preview-patient">{appointment.patientName}</span>
                      <span className={`preview-status ${hasStatus(appointment.status, 'Scheduled') ? 'scheduled' : ''}`}>
                        {appointment.status}
                      </span>
                    </div>
                  ))}
                  {hasMore && (
                    <div className="upcoming-preview-more">
                      +{dayAppointments.length - 2} more appointment{dayAppointments.length - 2 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingDays;

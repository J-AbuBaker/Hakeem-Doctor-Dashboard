import React, { useMemo } from 'react';
import { Appointment } from '../../types';
import { format, isToday, isTomorrow, isYesterday, startOfDay } from 'date-fns';
import {
  Calendar,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { hasStatus } from '../../utils/statusUtils';
import { parseAppointmentDate } from '../../utils/dateUtils';
import { formatAppointmentType } from '../../utils/stringUtils';
import { getAppointmentTypeLabel } from '../../utils/appointmentTypeUtils';
import './BookingList.css';

interface BookingListProps {
  appointments: Appointment[];
}

interface GroupedAppointment {
  date: Date;
  dateKey: string;
  appointments: Appointment[];
}

const BookingList: React.FC<BookingListProps> = ({ appointments }) => {
  const getStatusColor = (status: string) => {
    if (hasStatus(status, 'Cancelled')) {
      return 'status-cancelled';
    }
    if (hasStatus(status, 'Completed')) {
      return 'status-completed';
    }
    if (hasStatus(status, 'Expired')) {
      return 'status-expired';
    }
    return 'status-scheduled';
  };

  /**
   * Groups appointments by date and sorts them chronologically
   */
  const groupedAppointments = useMemo(() => {
    const groups = new Map<string, GroupedAppointment>();

    appointments.forEach((appointment) => {
      const appointmentDate = parseAppointmentDate(appointment);
      if (!appointmentDate) return;

      const dateKey = format(startOfDay(appointmentDate), 'yyyy-MM-dd');

      if (!groups.has(dateKey)) {
        groups.set(dateKey, {
          date: appointmentDate,
          dateKey,
          appointments: []
        });
      }

      groups.get(dateKey)!.appointments.push(appointment);
    });

    groups.forEach((group) => {
      group.appointments.sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
      });
    });

    return Array.from(groups.values()).sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });
  }, [appointments]);

  const formatDateHeader = (date: Date): { label: string; subtitle: string } => {
    try {
      if (isToday(date)) {
        return {
          label: 'Today',
          subtitle: format(date, 'EEEE, MMMM d, yyyy')
        };
      }
      if (isTomorrow(date)) {
        return {
          label: 'Tomorrow',
          subtitle: format(date, 'EEEE, MMMM d, yyyy')
        };
      }
      if (isYesterday(date)) {
        return {
          label: 'Yesterday',
          subtitle: format(date, 'EEEE, MMMM d, yyyy')
        };
      }

      return {
        label: format(date, 'EEEE, MMMM d'),
        subtitle: format(date, 'yyyy')
      };
    } catch (error) {
      console.error('Error formatting date header:', error);
      return {
        label: format(date, 'MMM d, yyyy'),
        subtitle: ''
      };
    }
  };

  const formatTime = (timeString: string): { time: string; period: string } => {
    try {
      if (!timeString || !timeString.includes(':')) {
        return { time: timeString, period: '' };
      }

      const [hours, minutes] = timeString.split(':').map(Number);
      const hour12 = hours % 12 || 12;
      const period = hours >= 12 ? 'PM' : 'AM';
      const formattedHour = String(hour12).padStart(2, '0');
      const formattedMinutes = String(minutes).padStart(2, '0');

      return {
        time: `${formattedHour}:${formattedMinutes}`,
        period: period
      };
    } catch (error) {
      console.error('Error formatting time:', error);
      return { time: timeString, period: '' };
    }
  };

  /**
   * Formats duration in minutes to human-readable string
   */
  const formatDuration = (minutes?: number): string => {
    if (!minutes) return 'N/A';
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${hours}h ${mins}m`;
  };



  if (appointments.length === 0) {
    return (
      <div className="booking-list-empty">
        <AlertCircle className="empty-icon" size={48} />
        <p>No appointments found</p>
      </div>
    );
  }

  return (
    <div className="booking-list-container">
      {groupedAppointments.map((group) => {
        const dateHeader = formatDateHeader(group.date);
        const isTodayDate = isToday(group.date);

        return (
          <div key={group.dateKey} className="booking-list-date-group">
            <div className={`date-group-header ${isTodayDate ? 'date-group-today' : ''}`}>
              <div className="date-group-header-content">
                <Calendar className="date-group-icon" size={18} />
                <div className="date-group-label-wrapper">
                  <span className="date-group-label">{dateHeader.label}</span>
                  {dateHeader.subtitle && (
                    <span className="date-group-subtitle">{dateHeader.subtitle}</span>
                  )}
                </div>
                <span className="date-group-count">{group.appointments.length} {group.appointments.length === 1 ? 'appointment' : 'appointments'}</span>
              </div>
            </div>

            <div className="booking-list-table-wrapper">
              <table className="booking-list-table">
                <thead>
                  <tr>
                    <th className="col-time">
                      <Clock className="header-icon" size={16} />
                      Time
                    </th>
                    <th className="col-duration">Duration</th>
                    <th className="col-patient">
                      <User className="header-icon" size={16} />
                      Patient Name
                    </th>
                    <th className="col-type">
                      Appointment Type
                    </th>
                    <th className="col-status">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {group.appointments.map((appointment) => {
                    return (
                      <tr key={appointment.id} className="booking-list-row">
                        <td className="col-time">
                          <div className="time-display">
                            {(() => {
                              const timeParts = formatTime(appointment.time);
                              return (
                                <>
                                  <span className="time-value">{timeParts.time}</span>
                                  {timeParts.period && (
                                    <span className="time-period">{timeParts.period}</span>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="col-duration">
                          <span className="duration-value">{formatDuration(appointment.duration)}</span>
                        </td>
                        <td className="col-patient">
                          <span className="patient-name-value" title={appointment.patientId}>
                            {appointment.patientName}
                          </span>
                        </td>
                        <td className="col-type">
                          <span className="type-value">{appointment.appointmentType ? getAppointmentTypeLabel(appointment.appointmentType) : '—'}</span>
                        </td>
                        <td className="col-status">
                          <span className={`status-badge ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookingList;


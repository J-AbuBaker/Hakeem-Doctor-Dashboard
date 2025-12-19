import { memo } from 'react';
import { format } from 'date-fns';
import { Appointment } from '../../types';
import {
  Calendar,
  Clock,
  User,
  FileText,
} from 'lucide-react';
import { hasStatus } from '../../utils/appointment/status';
import { formatDuration } from '../../utils/appointment/duration';
import { getAppointmentTypeIcon, getAppointmentTypeLabel, getAppointmentTypeOption } from '../../utils/appointment/type';

interface AppointmentCardProps {
  appointment: Appointment;
  hideTime?: boolean;
  hideDate?: boolean;
  compact?: boolean;
}

const AppointmentCard = memo<AppointmentCardProps>(({
  appointment,
  hideTime = false,
  hideDate = false,
  compact = false,
}) => {

  const getStatusColor = (status: string) => {
    // Use status utility for consistent comparison
    if (hasStatus(status, 'Cancelled')) {
      return 'status-cancelled';
    }
    if (hasStatus(status, 'Completed')) {
      return 'status-completed';
    }
    if (hasStatus(status, 'Expired')) {
      return 'status-expired';
    }
    // Default to scheduled for any other status
    return 'status-scheduled';
  };

  return (
    <div className={`appointment-card appointment-card-horizontal ${getStatusColor(appointment.status)}`}>
      <div className="appointment-card-content">
        <div className="appointment-status-section">
          <span className={`status-badge ${getStatusColor(appointment.status)}`}>
            {appointment.status}
          </span>
        </div>

        <div className={`appointment-info-section ${compact ? 'compact' : ''}`}>
          <div className="appointment-info-item">
            <User className="info-icon" />
            <span className="info-value" title={appointment.patientId}>{appointment.patientName}</span>
          </div>
          {!hideDate && (
            <div className="appointment-info-item">
              <Calendar className="info-icon" />
              <span className="info-value">
                {(() => {
                  try {
                    // Handle both YYYY-MM-DD format and full datetime
                    if (appointment.date.includes('T')) {
                      return format(new Date(appointment.date), 'MMM dd, yyyy');
                    }
                    const [year, month, day] = appointment.date.split('-').map(Number);
                    const dateObj = new Date(year, month - 1, day);
                    if (isNaN(dateObj.getTime())) {
                      return appointment.date;
                    }
                    return format(dateObj, 'MMM dd, yyyy');
                  } catch (error) {
                    console.error('Error formatting appointment date:', error);
                    return appointment.date;
                  }
                })()}
              </span>
            </div>
          )}
          {!hideTime && (
            <div className="appointment-info-item">
              <Clock className="info-icon" />
              <span className="info-value">
                {(() => {
                  try {
                    if (!appointment.time || !appointment.time.includes(':')) {
                      return appointment.time;
                    }
                    const [hours, minutes] = appointment.time.split(':').map(Number);
                    const hour12 = hours % 12 || 12;
                    const period = hours >= 12 ? 'PM' : 'AM';
                    const formattedHour = String(hour12).padStart(2, '0');
                    const formattedMinutes = String(minutes).padStart(2, '0');
                    return `${formattedHour}:${formattedMinutes} ${period}`;
                  } catch (error) {
                    return appointment.time;
                  }
                })()}
              </span>
            </div>
          )}
          <div
            className="appointment-info-item appointment-type-item"
            data-appointment-type={getAppointmentTypeOption(appointment.appointmentType).value}
          >
            {(() => {
              const TypeIcon = getAppointmentTypeIcon(appointment.appointmentType);
              return <TypeIcon className="info-icon" />;
            })()}
            <span className="info-value">
              {appointment.appointmentType
                ? getAppointmentTypeLabel(appointment.appointmentType)
                : getAppointmentTypeLabel(null)}
            </span>
          </div>
          <div className="appointment-info-item appointment-duration-item">
            <Clock className="info-icon" size={14} />
            <span className="info-value duration-value">
              {formatDuration(appointment.duration)}
            </span>
          </div>
          {appointment.notes && (
            <div className="appointment-notes-inline">
              <FileText className="notes-icon" size={14} />
              <span className="notes-text">{appointment.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

AppointmentCard.displayName = 'AppointmentCard';

export default AppointmentCard;


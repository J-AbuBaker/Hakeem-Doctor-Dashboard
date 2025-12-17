import { useState, memo } from 'react';
import { format } from 'date-fns';
import { useAppointments } from '../../app/providers';
import { Appointment } from '../../types';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import { hasStatus } from '../../utils/appointment/status';
import { isAppointmentOnDate } from '../../shared/utils/date/utils';
import { getErrorMessage } from '../../shared/utils/error/handlers';
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
  const { completeAppointment } = useAppointments();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  // Check if appointment can be completed (only on the appointment date)
  const canCompleteAppointment = (): boolean => {
    // CRITICAL: Cannot complete cancelled appointments
    if (hasStatus(appointment.status, 'Cancelled')) {
      return false;
    }

    // Must be scheduled (not completed, expired, etc.)
    if (!hasStatus(appointment.status, 'Scheduled')) {
      return false;
    }

    // Must have a patient (not an available slot)
    if (!appointment.patientId || appointment.patientId === '0' || appointment.patientName === 'Available Slot') {
      return false;
    }

    // Can only complete on the appointment date (today)
    const today = new Date();
    return isAppointmentOnDate(appointment, today);
  };

  const handleComplete = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Validate appointment ID
      if (!appointment.id || appointment.id.trim() === '') {
        throw new Error('Invalid appointment: Missing appointment ID');
      }

      // CRITICAL: Cannot complete cancelled appointments - this status must be preserved
      if (hasStatus(appointment.status, 'Cancelled')) {
        throw new Error('Cannot complete a cancelled appointment. Cancelled appointments cannot be marked as completed.');
      }

      // Prevent completing available slots (slots without a patient)
      if (!appointment.patientId || appointment.patientId === '0' || appointment.patientName === 'Available Slot') {
        throw new Error('Cannot complete an available slot. Only appointments with patients can be marked as completed.');
      }

      // Can only complete on the appointment date
      const today = new Date();
      if (!isAppointmentOnDate(appointment, today)) {
        const appointmentDate = appointment.date.includes('T')
          ? format(new Date(appointment.date), 'MMMM dd, yyyy')
          : (() => {
            const [year, month, day] = appointment.date.split('-').map(Number);
            return format(new Date(year, month - 1, day), 'MMMM dd, yyyy');
          })();
        throw new Error(`This appointment can only be marked as completed on ${appointmentDate} (the appointment date).`);
      }

      // Call the completion API
      await completeAppointment(appointment.id);

      setShowCompleteDialog(false);
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        console.error('Failed to complete appointment:', {
          appointmentId: appointment.id,
          error,
        });
      }

      // Extract user-friendly error message
      const errorMsg = getErrorMessage(error);

      setErrorMessage(`${errorMsg}\n\nPlease try again or contact support if the issue persists.`);
      setShowErrorDialog(true);
    } finally {
      setIsProcessing(false);
    }
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

        {canCompleteAppointment() && (
          <div className="appointment-actions-section">
            <button
              className="icon-btn success"
              onClick={() => {
                if (!isProcessing) {
                  setShowCompleteDialog(true);
                }
              }}
              disabled={isProcessing}
              title="Complete Appointment"
              aria-label="Mark appointment as completed"
            >
              {isProcessing ? (
                <Loader2 className="spinner" size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Complete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCompleteDialog}
        type="success"
        title="Complete Appointment"
        message={`Are you sure you want to mark this appointment as completed?`}
        details={(() => {
          try {
            let formattedDate = appointment.date;
            if (appointment.date.includes('T')) {
              formattedDate = format(new Date(appointment.date), 'MMMM dd, yyyy');
            } else {
              const [year, month, day] = appointment.date.split('-').map(Number);
              const dateObj = new Date(year, month - 1, day);
              if (!isNaN(dateObj.getTime())) {
                formattedDate = format(dateObj, 'MMMM dd, yyyy');
              }
            }
            return `Patient: ${appointment.patientName}\nDate: ${formattedDate}\nTime: ${appointment.time}\n\nThis will mark the appointment as completed. This action cannot be undone.`;
          } catch (error) {
            return `Patient: ${appointment.patientName}\nDate: ${appointment.date}\nTime: ${appointment.time}\n\nThis will mark the appointment as completed. This action cannot be undone.`;
          }
        })()}
        confirmText="Mark as Completed"
        cancelText="Cancel"
        onConfirm={handleComplete}
        onCancel={() => {
          if (!isProcessing) {
            setShowCompleteDialog(false);
          }
        }}
        isLoading={isProcessing}
      />

      {/* Error Dialog */}
      <ConfirmDialog
        isOpen={showErrorDialog}
        type="warning"
        title="Operation Failed"
        message={errorMessage}
        confirmText="OK"
        onConfirm={() => setShowErrorDialog(false)}
        onCancel={() => setShowErrorDialog(false)}
      />
    </div>
  );
});

AppointmentCard.displayName = 'AppointmentCard';

export default AppointmentCard;


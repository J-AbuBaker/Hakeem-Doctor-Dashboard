import React, { useState, useEffect } from 'react';
import { useAppointments } from '../../app/providers';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, isSameMonth, isToday, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Filter, Plus, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { getAppointmentsForDate, parseAppointmentDate } from '../../shared/utils/date/utils';
import { hasStatus } from '../../utils/appointment/status';
import { getAppointmentTypeLabel } from '../../utils/appointment/type';
import { sortAppointmentsByDateTime } from '../../utils/appointment/sorting';
import { formatDuration } from '../../utils/appointment/duration';
import AppointmentCard from './AppointmentCard';
import SectionModule from './SectionModule';
import './BookingList.css';
import './TodaySchedule.css';

interface AppointmentCalendarProps {
  onOpenSlot?: () => void;
}

type ViewMode = 'day' | 'week' | 'month';
type StatusFilter = 'All' | 'Scheduled' | 'Completed' | 'Cancelled' | 'Expired';

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  onOpenSlot,
}) => {
  const { appointments, fetchAppointments, isLoading, error } = useAppointments();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  // Helper functions for table formatting (matching BookingList)
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

  // formatDuration is now imported from durationUtils

  useEffect(() => {
    fetchAppointments({
      status: statusFilter !== 'All' && statusFilter !== 'Expired' ? statusFilter : undefined,
    });
  }, [statusFilter, fetchAppointments]);

  // Fetch appointments when week view is active or when week changes
  useEffect(() => {
    fetchAppointments({
      status: statusFilter !== 'All' && statusFilter !== 'Expired' ? statusFilter : undefined,
    });
  }, [selectedDate, viewMode, statusFilter, fetchAppointments]);

  // Filter appointments by status only (don't filter by date here - do it per view)
  const statusFilteredAppointments = appointments.filter((apt) => {
    if (statusFilter !== 'All' && !hasStatus(apt.status, statusFilter)) {
      return false;
    }
    return true;
  });

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
  });

  // Get appointments for a specific date - use ALL appointments from API, filter by date
  const getAppointmentsForDateLocal = (date: Date) => {
    // Use all status-filtered appointments and filter by date
    return getAppointmentsForDate(statusFilteredAppointments, date);
  };

  return (
    <div className="appointment-calendar">
      <div className="calendar-header">
        <div className="calendar-controls">
          <h2>
            <CalendarIcon className="header-icon" />
            Appointments
            {appointments.length > 0 && (
              <span className="appointment-count-badge">({appointments.length})</span>
            )}
          </h2>
          {error && (
            <div className="calendar-error-message" style={{
              padding: '0.75rem 1rem',
              background: '#fee2e2',
              color: '#991b1b',
              borderRadius: '0.5rem',
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              border: '1px solid #fecaca'
            }}>
              <strong>Error loading appointments:</strong> {error}
            </div>
          )}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>

        <div className="calendar-actions">
          <div className="filter-group">
            <Filter className="filter-icon" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="filter-select"
            >
              <option value="All">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={onOpenSlot}>
            <Plus />
            Add Appointment
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="spinner-large" />
          <p>Loading appointments...</p>
        </div>
      ) : (
        <>
          {error && error.includes('403') ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{
                background: '#fee2e2',
                border: '2px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                marginBottom: '2rem',
                color: '#991b1b'
              }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                  ⚠️ Access Denied (403 Forbidden)
                </h3>
                <p style={{ marginBottom: '0.5rem', lineHeight: 1.6 }}>
                  Your account does not have the <strong>DOCTOR</strong> role required to access appointments.
                </p>
                <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
                  <strong>To fix this:</strong>
                </p>
                <ul style={{ textAlign: 'left', marginTop: '0.5rem', paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
                  <li>Verify your account has the DOCTOR role in the database</li>
                  <li>Log out and log in with a doctor account</li>
                  <li>Contact your administrator to update your account role</li>
                </ul>
                <p style={{ marginTop: '1rem', fontSize: '0.85rem', opacity: 0.8, fontStyle: 'italic' }}>
                  Check the browser console (F12) for detailed role information from your JWT token.
                </p>
              </div>
            </div>
          ) : appointments.length === 0 && !isLoading ? (
            <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
              <CalendarIcon style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '1rem', color: 'var(--primary)' }} />
              <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text)' }}>
                No appointments scheduled
              </p>
              <p style={{ opacity: 0.7, marginBottom: '1.5rem', color: 'var(--text-light)' }}>
                Get started by creating your first appointment. Click the button below to schedule a patient visit.
              </p>
              {onOpenSlot && (
                <button
                  className="btn btn-primary"
                  onClick={onOpenSlot}
                  style={{ marginTop: '1rem' }}
                >
                  Open Your First Slot
                </button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'day' && (
                <div className="day-view">
                  <div className="day-header">
                    <div className="date-navigation">
                      <button
                        className="date-nav-btn"
                        onClick={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setDate(newDate.getDate() - 1);
                          setSelectedDate(newDate);
                        }}
                        aria-label="Previous Day"
                      >
                        <ChevronLeft size={18} className="nav-arrow-icon" />
                        <span>Previous</span>
                      </button>
                      <button
                        className="date-nav-btn today-btn"
                        onClick={() => setSelectedDate(new Date())}
                        aria-label="Go to Today"
                      >
                        Today
                      </button>
                      <button
                        className="date-nav-btn"
                        onClick={() => {
                          const newDate = new Date(selectedDate);
                          newDate.setDate(newDate.getDate() + 1);
                          setSelectedDate(newDate);
                        }}
                        aria-label="Next Day"
                      >
                        <span>Next</span>
                        <ChevronRight size={18} className="nav-arrow-icon" />
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const dayAppointments = getAppointmentsForDateLocal(selectedDate);
                    const sortedDayAppointments = sortAppointmentsByDateTime(dayAppointments);
                    const isToday = isSameDay(selectedDate, new Date());

                    // Calculate stats
                    const scheduledCount = sortedDayAppointments.filter(a => hasStatus(a.status, 'Scheduled')).length;
                    const completedCount = sortedDayAppointments.filter(a => hasStatus(a.status, 'Completed')).length;

                    // Get upcoming appointments (next 2 hours) - only for today
                    const getUpcomingAppointments = () => {
                      if (!isToday) return [];
                      const now = new Date();
                      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
                      return sortedDayAppointments.filter(apt => {
                        const aptDate = parseAppointmentDate(apt);
                        if (!aptDate) return false;
                        return aptDate > now && aptDate <= twoHoursFromNow && hasStatus(apt.status, 'Scheduled');
                      });
                    };

                    const upcomingAppointments = getUpcomingAppointments();

                    // Format time helper
                    const formatTimeDisplay = (timeString: string): string => {
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

                    return (
                      <SectionModule
                        title={isToday ? "Today's Schedule" : format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        subtitle={isToday ? format(selectedDate, 'EEEE, MMMM d, yyyy') : undefined}
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
                        empty={sortedDayAppointments.length === 0}
                        emptyTitle="No appointments scheduled for this day"
                        emptySubtitle={isToday ? "You have a free schedule. Consider opening new slots for patients." : `You have a free schedule for ${format(selectedDate, 'MMMM dd, yyyy')}. Consider adding a new appointment or checking other dates.`}
                        emptyIcon={Calendar}
                        aria-label={isToday ? "Today's Schedule" : `Schedule for ${format(selectedDate, 'MMMM dd, yyyy')}`}
                      >
                        {upcomingAppointments.length > 0 && (
                          <div className="today-upcoming-alert" role="alert" aria-live="polite">
                            <Clock className="upcoming-icon" size={18} aria-hidden="true" />
                            <span>
                              <strong>{upcomingAppointments.length}</strong> appointment{upcomingAppointments.length !== 1 ? 's' : ''} in the next 2 hours
                            </span>
                          </div>
                        )}

                        {sortedDayAppointments.length > 0 && (
                          <div className="today-schedule-timeline" role="list" aria-label={`Appointments for ${format(selectedDate, 'MMMM dd, yyyy')}`}>
                            {sortedDayAppointments.map((appointment) => {
                              const appointmentDate = parseAppointmentDate(appointment);
                              const isUpcoming = isToday &&
                                appointmentDate &&
                                appointmentDate > new Date() &&
                                appointmentDate <= new Date(Date.now() + 2 * 60 * 60 * 1000) &&
                                hasStatus(appointment.status, 'Scheduled');
                              const isOverdue = isToday &&
                                appointmentDate &&
                                appointmentDate < new Date() &&
                                hasStatus(appointment.status, 'Scheduled');

                              return (
                                <div
                                  key={appointment.id}
                                  className={`today-appointment-item ${isUpcoming ? 'upcoming' : ''} ${isOverdue ? 'overdue' : ''}`}
                                  role="listitem"
                                  tabIndex={0}
                                  aria-label={`Appointment at ${formatTimeDisplay(appointment.time)} with ${appointment.patientName}`}
                                >
                                  <div className="today-appointment-time">
                                    <div className="time-display-wrapper">
                                      <Clock className="time-icon" size={18} aria-hidden="true" />
                                      <span className="time-text">{formatTimeDisplay(appointment.time)}</span>
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
                  })()}
                </div>
              )}

              {viewMode === 'week' && (
                <div className="week-view">
                  <div className="week-header">
                    <button
                      className="week-nav-btn week-nav-prev"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setDate(newDate.getDate() - 7);
                        setSelectedDate(newDate);
                      }}
                      aria-label="Previous Week"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="week-header-center">
                      <div className="week-header-title-section">
                        <h3 className="week-title">
                          {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM dd')} -{' '}
                          {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                        </h3>
                        {(() => {
                          const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
                          const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
                          const weekAppointments = statusFilteredAppointments.filter(apt => {
                            const aptDate = parseAppointmentDate(apt);
                            if (!aptDate) return false;
                            const aptStartOfDay = startOfDay(aptDate);
                            return aptStartOfDay >= startOfDay(weekStart) && aptStartOfDay <= startOfDay(weekEnd);
                          });
                          const bookedCount = weekAppointments.filter(
                            apt => apt.patientId && apt.patientId !== '0' && apt.patientName !== 'Available Slot'
                          ).length;

                          if (bookedCount > 0) {
                            return (
                              <span className="week-appointments-summary">
                                {bookedCount} {bookedCount === 1 ? 'appointment' : 'appointments'} this week
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <button
                        className="week-today-btn"
                        onClick={() => setSelectedDate(new Date())}
                        aria-label="Go to Today"
                      >
                        <CalendarIcon size={16} />
                        Today
                      </button>
                    </div>
                    <button
                      className="week-nav-btn week-nav-next"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setDate(newDate.getDate() + 7);
                        setSelectedDate(newDate);
                      }}
                      aria-label="Next Week"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="week-loading-state">
                      <div className="spinner-large" />
                      <p>Loading appointments...</p>
                    </div>
                  ) : error ? (
                    <div className="week-error-state">
                      <AlertCircle size={24} />
                      <p>{error}</p>
                    </div>
                  ) : (
                    /* Professional Time-Based Week Grid */
                    <div className="week-calendar-container">
                      {/* Time column */}
                      <div className="week-time-column">
                        {Array.from({ length: 13 }, (_, i) => {
                          const hour = i + 8; // 8 AM to 8 PM
                          const displayHour = hour % 12 || 12;
                          const period = hour >= 12 ? 'PM' : 'AM';
                          return (
                            <div key={hour} className="time-slot-label">
                              <span className="time-label-hour">{displayHour}</span>
                              <span className="time-label-period">{period}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Days grid */}
                      <div className="week-days-grid">
                        {/* Day headers */}
                        <div className="week-days-header">
                          {weekDays.map((day) => {
                            const isTodayDate = isSameDay(day, new Date());
                            const dayAppointments = getAppointmentsForDateLocal(day);
                            const appointmentCount = dayAppointments.filter(
                              apt => apt.patientId && apt.patientId !== '0' && apt.patientName !== 'Available Slot'
                            ).length;

                            return (
                              <div key={day.toISOString()} className={`week-day-header ${isTodayDate ? 'today' : ''}`}>
                                <div className="day-header-content">
                                  <span className="day-header-name">{format(day, 'EEE').toUpperCase()}</span>
                                  <span className={`day-header-number ${isTodayDate ? 'today-number' : ''}`}>
                                    {format(day, 'd')}
                                  </span>
                                  {isTodayDate && (
                                    <span className="day-header-month">{format(day, 'MMM')}</span>
                                  )}
                                </div>
                                {appointmentCount > 0 && (
                                  <div className="day-appointment-badge">
                                    {appointmentCount}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Time slots grid */}
                        <div className="week-time-slots-grid">
                          {weekDays.map((day) => {
                            const dayAppointments = getAppointmentsForDateLocal(day);
                            const isTodayDate = isSameDay(day, new Date());

                            // Sort appointments by time for proper display
                            const sortedDayAppointments = sortAppointmentsByDateTime(dayAppointments);

                            // Separate booked appointments from available slots
                            const bookedAppointments = sortedDayAppointments.filter(
                              apt => apt.patientId && apt.patientId !== '0' && apt.patientName !== 'Available Slot'
                            );

                            // Also show available slots as visual indicators
                            const availableSlots = sortedDayAppointments.filter(
                              apt => !apt.patientId || apt.patientId === '0' || apt.patientName === 'Available Slot'
                            );

                            // Calculate appointment positions based on time (8 AM to 8 PM = 13 hours)
                            // Using pixel-perfect positioning for better alignment
                            const MINUTES_PER_HOUR = 60;
                            const PIXELS_PER_HOUR = 60; // 60px per hour for precise alignment
                            const START_HOUR = 8; // 8 AM
                            const END_HOUR = 21; // 9 PM (for display)

                            const getAppointmentPosition = (time: string): number => {
                              try {
                                const [hours, minutes] = time.split(':').map(Number);
                                const totalMinutes = hours * MINUTES_PER_HOUR + (minutes || 0);
                                const startMinutes = START_HOUR * MINUTES_PER_HOUR;
                                const endMinutes = END_HOUR * MINUTES_PER_HOUR;

                                if (totalMinutes < startMinutes) {
                                  return 0; // Before 8 AM, show at top
                                }
                                if (totalMinutes > endMinutes) {
                                  return (END_HOUR - START_HOUR) * PIXELS_PER_HOUR; // After 9 PM, show at bottom
                                }

                                // Calculate position in pixels for pixel-perfect alignment
                                const minutesFromStart = totalMinutes - startMinutes;
                                const positionPixels = (minutesFromStart / MINUTES_PER_HOUR) * PIXELS_PER_HOUR;
                                return Math.max(0, Math.min((END_HOUR - START_HOUR) * PIXELS_PER_HOUR, positionPixels));
                              } catch (error) {
                                console.error('Error calculating appointment position:', error);
                                return 0;
                              }
                            };

                            const getAppointmentHeight = (duration?: number): number => {
                              // Use actual duration for accurate height calculation
                              const actualDuration = duration || 30; // Default 30 minutes if not provided

                              // Convert duration to pixels (60px per hour = 1px per minute)
                              // This ensures perfect proportional representation
                              const heightPixels = (actualDuration / MINUTES_PER_HOUR) * PIXELS_PER_HOUR;

                              // Professional minimum height: 40px (for 15 min slots) ensures readability
                              // Maximum height: 8 hours = 480px (reasonable limit)
                              // Ensure height is at least 40px for visibility and professionalism
                              return Math.max(40, Math.min(480, Math.round(heightPixels)));
                            };

                            return (
                              <div key={day.toISOString()} className={`week-day-column ${isTodayDate ? 'today-column' : ''}`}>
                                {/* Time slot dividers */}
                                {Array.from({ length: 13 }, (_, i) => (
                                  <div key={i} className="time-slot-divider" />
                                ))}

                                {/* Appointments positioned by time */}
                                <div className="week-day-appointments">
                                  {sortedDayAppointments.length === 0 ? null : bookedAppointments.length === 0 && availableSlots.length > 0 ? (
                                    <>
                                      {/* Show available slots when no booked appointments */}
                                      {availableSlots.map((slot) => {
                                        const timeParts = formatTime(slot.time);
                                        const position = getAppointmentPosition(slot.time);
                                        const height = getAppointmentHeight(slot.duration);

                                        return (
                                          <div
                                            key={slot.id}
                                            className="week-appointment-block week-slot-indicator"
                                            style={{
                                              top: `${position}px`,
                                              height: `${height}px`,
                                            }}
                                            title={`Available Slot - ${timeParts.time} ${timeParts.period} (${formatDuration(slot.duration)})`}
                                          >
                                            <div className="week-appointment-content">
                                              <div className="week-appointment-time">
                                                {timeParts.time} {timeParts.period}
                                              </div>
                                              <div className="week-appointment-patient">
                                                Available
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </>
                                  ) : (
                                    <>
                                      {/* Show booked appointments */}
                                      {bookedAppointments.map((apt) => {
                                        const timeParts = formatTime(apt.time);
                                        const position = getAppointmentPosition(apt.time);
                                        const height = getAppointmentHeight(apt.duration);

                                        return (
                                          <div
                                            key={apt.id}
                                            className={`week-appointment-block ${getStatusColor(apt.status)}`}
                                            style={{
                                              top: `${position}px`,
                                              height: `${height}px`,
                                            }}
                                            title={`${apt.patientName} - ${timeParts.time} ${timeParts.period} (${formatDuration(apt.duration)})`}
                                          >
                                            <div className="week-appointment-content">
                                              <div className="week-appointment-header">
                                                <div className="week-appointment-time">
                                                  {timeParts.time} {timeParts.period}
                                                </div>
                                                {apt.duration && (
                                                  <div className="week-appointment-duration">
                                                    <Clock size={12} />
                                                    <span>{formatDuration(apt.duration)}</span>
                                                  </div>
                                                )}
                                              </div>
                                              <div className="week-appointment-patient">
                                                {apt.patientName}
                                              </div>
                                              {apt.appointmentType && (
                                                <div className="week-appointment-type">
                                                  {getAppointmentTypeLabel(apt.appointmentType)}
                                                </div>
                                              )}
                                              <div className={`week-appointment-status ${getStatusColor(apt.status)}`}>
                                                {apt.status}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}

                                      {/* Show available slots as subtle indicators */}
                                      {availableSlots.map((slot) => {
                                        const timeParts = formatTime(slot.time);
                                        const position = getAppointmentPosition(slot.time);
                                        const height = getAppointmentHeight(slot.duration);

                                        return (
                                          <div
                                            key={slot.id}
                                            className="week-appointment-block week-slot-indicator"
                                            style={{
                                              top: `${position}px`,
                                              height: `${height}px`,
                                            }}
                                            title={`Available Slot - ${timeParts.time} ${timeParts.period} (${formatDuration(slot.duration)})`}
                                          >
                                            <div className="week-appointment-content">
                                              <div className="week-appointment-time">
                                                {timeParts.time} {timeParts.period}
                                              </div>
                                              <div className="week-appointment-patient">
                                                Available
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewMode === 'month' && (
                <div className="month-view">
                  <div className="month-header">
                    <button
                      className="month-nav-btn month-nav-prev"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedDate(newDate);
                      }}
                      aria-label="Previous Month"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <div className="month-header-center">
                      <h3 className="month-title">{format(selectedDate, 'MMMM yyyy')}</h3>
                      <button
                        className="month-today-btn"
                        onClick={() => setSelectedDate(new Date())}
                        aria-label="Go to Today"
                      >
                        <CalendarIcon size={16} />
                        Today
                      </button>
                    </div>
                    <button
                      className="month-nav-btn month-nav-next"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedDate(newDate);
                      }}
                      aria-label="Next Month"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                  <div className="month-calendar-grid">
                    {/* Day headers */}
                    <div className="calendar-weekdays">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <div key={day} className="calendar-weekday">
                          {day}
                        </div>
                      ))}
                    </div>
                    {/* Calendar days */}
                    <div className="calendar-days-grid">
                      {(() => {
                        const monthStart = startOfMonth(selectedDate);
                        const monthEnd = endOfMonth(selectedDate);
                        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
                        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
                        const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

                        return calendarDays.map((day) => {
                          const dayAppointments = getAppointmentsForDateLocal(day);
                          const isCurrentMonth = isSameMonth(day, selectedDate);
                          const isTodayDate = isToday(day);
                          const bookedAppointments = dayAppointments.filter(
                            apt => apt.patientId && apt.patientId !== '0' && apt.patientName !== 'Available Slot'
                          );
                          const availableSlots = dayAppointments.filter(
                            apt => !apt.patientId || apt.patientId === '0' || apt.patientName === 'Available Slot'
                          );
                          const bookedCount = bookedAppointments.length;
                          const availableCount = availableSlots.length;

                          return (
                            <div
                              key={day.toISOString()}
                              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''} ${dayAppointments.length > 0 ? 'has-appointments' : ''} ${isCurrentMonth ? 'current-month' : ''}`}
                              onClick={() => {
                                if (isCurrentMonth) {
                                  setSelectedDate(day);
                                  setViewMode('day');
                                }
                              }}
                              style={{ cursor: isCurrentMonth ? 'pointer' : 'default' }}
                            >
                              <div className="calendar-day-header">
                                <div className={`calendar-day-number ${isTodayDate ? 'today-number' : ''}`}>
                                  {format(day, 'd')}
                                </div>
                                {isTodayDate && <div className="today-badge">Today</div>}
                              </div>
                              <div className="calendar-day-content">
                                {dayAppointments.length > 0 ? (
                                  <div className="calendar-day-appointments">
                                    {bookedCount > 0 && (
                                      <div
                                        className="calendar-appointment-indicator booked"
                                        title={`${bookedCount} booked appointment${bookedCount > 1 ? 's' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedDate(day);
                                          setViewMode('day');
                                        }}
                                      >
                                        <span className="indicator-dot"></span>
                                        <span className="indicator-label">Booked</span>
                                        <span className="indicator-count">{bookedCount}</span>
                                      </div>
                                    )}
                                    {availableCount > 0 && (
                                      <div
                                        className="calendar-appointment-indicator available"
                                        title={`${availableCount} available slot${availableCount > 1 ? 's' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedDate(day);
                                          setViewMode('day');
                                        }}
                                      >
                                        <span className="indicator-dot"></span>
                                        <span className="indicator-label">Available</span>
                                        <span className="indicator-count">{availableCount}</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="calendar-day-empty">
                                    <span className="empty-day-text">No appointments</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default AppointmentCalendar;


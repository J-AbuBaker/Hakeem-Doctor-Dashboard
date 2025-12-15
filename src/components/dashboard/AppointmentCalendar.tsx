import React, { useState, useEffect } from 'react';
import { useAppointments } from '../../context/AppointmentContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, isSameMonth, isToday } from 'date-fns';
import AppointmentCard from './AppointmentCard';
import { Calendar as CalendarIcon, Filter, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { isAppointmentOnDate, isAppointmentInDateRange, getAppointmentsForDate } from '../../utils/dateUtils';
import { hasStatus } from '../../utils/statusUtils';

interface AppointmentCalendarProps {
  onOpenSlot?: () => void;
}

type ViewMode = 'day' | 'week' | 'month';
type StatusFilter = 'All' | 'Scheduled' | 'Completed' | 'Cancelled';

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  onOpenSlot,
}) => {
  const { appointments, fetchAppointments, isLoading, error } = useAppointments();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  useEffect(() => {
    fetchAppointments({
      status: statusFilter !== 'All' ? statusFilter : undefined,
    });
  }, [statusFilter]);

  useEffect(() => {
    if (viewMode === 'week' || viewMode === 'month') {
      fetchAppointments({
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });
    }
  }, [selectedDate, viewMode]);

  // Debug logging
  useEffect(() => {
    console.log('AppointmentCalendar - Appointments state:', {
      total: appointments.length,
      appointments: appointments,
      isLoading,
      error,
    });
  }, [appointments, isLoading, error]);

  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter !== 'All' && !hasStatus(apt.status, statusFilter)) {
      return false;
    }
    if (viewMode === 'day' || viewMode === 'week') {
      if (viewMode === 'day') {
        // Use robust date comparison that uses original appointmentDate from API
        return isAppointmentOnDate(apt, selectedDate);
      } else if (viewMode === 'week') {
        // Use robust date range comparison
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return isAppointmentInDateRange(apt, weekStart, weekEnd);
      }
    }
    return true; // month view
  });

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: endOfWeek(selectedDate, { weekStartsOn: 1 }),
  });

  const getAppointmentsForDateLocal = (date: Date) => {
    // Use robust date comparison utility
    return getAppointmentsForDate(filteredAppointments, date);
  };

  // Get available slots from API data only (no static data)
  const getAvailableSlotsForDay = (date: Date) => {
    const dayAppointments = getAppointmentsForDateLocal(date);

    // Only return appointments that are available slots (no patient assigned)
    const availableSlots = dayAppointments.filter(
      apt => !apt.patientId || apt.patientId === '0' || apt.patientName === 'Available Slot'
    );

    // Sort by time for consistent display
    return availableSlots.sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0];
      return (timeA[1] || 0) - (timeB[1] || 0);
    });
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
                    <h3>{format(selectedDate, 'EEEE, MMMM dd, yyyy')}</h3>
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
                  <div className="appointments-list">
                    {getAppointmentsForDateLocal(selectedDate).length === 0 ? (
                      <div className="empty-state">
                        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No appointments scheduled for this day</p>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>
                          You have a free schedule for {format(selectedDate, 'MMMM dd, yyyy')}.
                          Consider adding a new appointment or checking other dates.
                        </p>
                      </div>
                    ) : (
                      getAppointmentsForDateLocal(selectedDate).map((apt) => (
                        <AppointmentCard
                          key={apt.id}
                          appointment={apt}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {viewMode === 'week' && (
                <div className="week-view">
                  <div className="week-header">
                    <button
                      className="date-nav-btn"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setDate(newDate.getDate() - 7);
                        setSelectedDate(newDate);
                      }}
                      aria-label="Previous Week"
                    >
                      <ChevronLeft size={18} className="nav-arrow-icon" />
                      <span>Previous Week</span>
                    </button>
                    <div className="week-header-center">
                      <h3>
                        {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM dd')} -{' '}
                        {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                      </h3>
                      <button
                        className="date-nav-btn today-btn"
                        onClick={() => setSelectedDate(new Date())}
                        aria-label="Go to Today"
                      >
                        Today
                      </button>
                    </div>
                    <button
                      className="date-nav-btn"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setDate(newDate.getDate() + 7);
                        setSelectedDate(newDate);
                      }}
                      aria-label="Next Week"
                    >
                      <span>Next Week</span>
                      <ChevronRight size={18} className="nav-arrow-icon" />
                    </button>
                  </div>
                  <div className="week-grid">
                    {weekDays.map((day) => {
                      const dayAppointments = getAppointmentsForDateLocal(day);
                      const isToday = isSameDay(day, new Date());

                      // Separate booked appointments from available slots (all from API)
                      const bookedAppointments = dayAppointments.filter(
                        apt => apt.patientId && apt.patientId !== '0' && apt.patientName !== 'Available Slot'
                      );

                      // Get available slots from API only (no static data)
                      const availableSlots = getAvailableSlotsForDay(day);

                      // Format time for display
                      const formatTimeDisplay = (time: string) => {
                        const [hours, minutes] = time.split(':');
                        const hour = parseInt(hours, 10);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = String(hour % 12 || 12).padStart(2, '0');
                        const displayMinutes = String(minutes || '00').padStart(2, '0');
                        return { displayHour, displayMinutes, ampm, time };
                      };

                      return (
                        <div key={day.toISOString()} className={`week-day ${isToday ? 'today' : ''}`}>
                          <div className="day-label">
                            <span className="day-name">{format(day, 'EEE').toUpperCase()}</span>
                            <span className="day-number">{format(day, 'd')}</span>
                          </div>
                          <div className="day-appointments">
                            {bookedAppointments.length === 0 && availableSlots.length === 0 ? (
                              <div className="empty-day-message">
                                <p style={{
                                  fontSize: '0.875rem',
                                  opacity: 0.6,
                                  textAlign: 'center',
                                  padding: '1rem 0',
                                  color: 'var(--text-secondary)'
                                }}>
                                  No appointments
                                </p>
                              </div>
                            ) : bookedAppointments.length === 0 ? (
                              <div className="available-slots">
                                <div className="available-slots-header">
                                  <span className="slots-count">{availableSlots.length}</span>
                                  <span className="slots-label">AVAILABLE SLOTS</span>
                                </div>
                                {availableSlots.length > 0 && (
                                  <div className="time-slots-grid-compact">
                                    {availableSlots.slice(0, 8).map((slot, index) => {
                                      const { displayHour, displayMinutes, ampm } = formatTimeDisplay(slot.time);
                                      return (
                                        <div key={`${slot.id}-${index}`} className="time-slot-item">
                                          {displayHour}:{displayMinutes} {ampm}
                                        </div>
                                      );
                                    })}
                                    {availableSlots.length > 8 && (
                                      <div className="time-slot-item more-slots">
                                        +{availableSlots.length - 8} more
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                {bookedAppointments.map((apt) => (
                                  <AppointmentCard
                                    key={apt.id}
                                    appointment={apt}
                                  />
                                ))}
                                {availableSlots.length > 0 && (
                                  <div className="available-slots compact">
                                    <div className="available-slots-header">
                                      <span className="slots-count">{availableSlots.length}</span>
                                      <span className="slots-label">More Available</span>
                                    </div>
                                    <div className="time-slots-grid-compact">
                                      {availableSlots.slice(0, 4).map((slot, index) => {
                                        const { displayHour, displayMinutes, ampm } = formatTimeDisplay(slot.time);
                                        return (
                                          <div key={`${slot.id}-${index}`} className="time-slot-item">
                                            {displayHour}:{displayMinutes} {ampm}
                                          </div>
                                        );
                                      })}
                                      {availableSlots.length > 4 && (
                                        <div className="time-slot-item more-slots">
                                          +{availableSlots.length - 4} more
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewMode === 'month' && (
                <div className="month-view">
                  <div className="month-header">
                    <button
                      className="date-nav-btn"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedDate(newDate);
                      }}
                      aria-label="Previous Month"
                    >
                      <ChevronLeft size={18} />
                      Previous Month
                    </button>
                    <div className="month-header-center">
                      <h3>{format(selectedDate, 'MMMM yyyy')}</h3>
                      <button
                        className="date-nav-btn today-btn"
                        onClick={() => setSelectedDate(new Date())}
                        aria-label="Go to Today"
                      >
                        Today
                      </button>
                    </div>
                    <button
                      className="date-nav-btn"
                      onClick={() => {
                        const newDate = new Date(selectedDate);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedDate(newDate);
                      }}
                      aria-label="Next Month"
                    >
                      Next Month
                      <ChevronRight size={18} />
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
                              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isTodayDate ? 'today' : ''} ${dayAppointments.length > 0 ? 'has-appointments' : ''}`}
                              onClick={() => {
                                if (isCurrentMonth) {
                                  setSelectedDate(day);
                                  setViewMode('day');
                                }
                              }}
                              style={{ cursor: isCurrentMonth ? 'pointer' : 'default' }}
                            >
                              <div className="calendar-day-number">
                                {format(day, 'd')}
                              </div>
                              <div className="calendar-day-content">
                                {dayAppointments.length > 0 && (
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
                                        <span className="indicator-count">{availableCount}</span>
                                      </div>
                                    )}
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


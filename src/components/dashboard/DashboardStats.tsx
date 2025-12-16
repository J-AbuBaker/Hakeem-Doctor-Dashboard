import React from 'react';
import { useAppointments } from '../../context/AppointmentContext';
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { getTodayAppointments, isAppointmentInFuture } from '../../utils/dateUtils';
import { hasStatus } from '../../utils/statusUtils';

const DashboardStats: React.FC = () => {
  const { appointments } = useAppointments();

  // Use robust date comparison utility that uses the original appointmentDate from API
  const todayAppointments = getTodayAppointments(appointments);

  // Calculate stats with proper status filtering using status utility
  const totalAppointments = appointments.length;
  const todayAppointmentsCount = todayAppointments.length;
  const todayScheduledCount = todayAppointments.filter(a => hasStatus(a.status, 'Scheduled')).length;
  const completedCount = appointments.filter(a => hasStatus(a.status, 'Completed')).length;

  // Pending count: future scheduled appointments WITH patients assigned (exclude unbooked slots and expired)
  const pendingCount = appointments.filter(a => {
    // Must be scheduled (not completed, cancelled, or expired)
    if (!hasStatus(a.status, 'Scheduled')) {
      return false;
    }

    // Must have a patient assigned (exclude unbooked slots)
    if (!a.patientId || a.patientId === '0' || a.patientName === 'Available Slot') {
      return false;
    }

    // Must be in the future (not past appointments)
    return isAppointmentInFuture(a);
  }).length;

  // Expired count: past appointments that were never booked
  const expiredCount = appointments.filter(a => hasStatus(a.status, 'Expired')).length;

  const completedPercentage = totalAppointments > 0
    ? Math.round((completedCount / totalAppointments) * 100)
    : 0;

  // Calculate expired percentage (expired slots vs total slots)
  const totalSlots = appointments.filter(a =>
    !a.patientId || a.patientId === '0' || a.patientName === 'Available Slot'
  ).length;
  const expiredPercentage = totalSlots > 0
    ? Math.round((expiredCount / totalSlots) * 100)
    : 0;

  const stats = [
    {
      label: 'Total Appointments',
      value: totalAppointments,
      icon: Calendar,
      color: 'var(--primary)',
      bgColor: 'rgba(13, 148, 136, 0.1)',
    },
    {
      label: 'Today\'s Appointments',
      value: todayAppointmentsCount,
      icon: Clock,
      color: 'var(--status-scheduled)',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      change: `${todayScheduledCount} scheduled`,
      trend: 'neutral' as const,
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: CheckCircle2,
      color: 'var(--status-completed)',
      bgColor: 'rgba(14, 116, 144, 0.1)',
      change: `${completedPercentage}%`,
      trend: 'up' as const,
    },
    {
      label: 'Pending',
      value: pendingCount,
      icon: Clock,
      color: 'var(--warning)',
      bgColor: 'rgba(217, 119, 6, 0.1)',
      change: 'Requires action',
      trend: 'neutral' as const,
    },
    {
      label: 'Expired Slots',
      value: expiredCount,
      icon: XCircle,
      color: '#9ca3af',
      bgColor: 'rgba(156, 163, 175, 0.1)',
      change: `${expiredPercentage}%`,
      trend: 'neutral' as const,
    },
  ];

  return (
    <div className="dashboard-stats">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper" style={{ backgroundColor: stat.bgColor }}>
                <Icon className="stat-icon" style={{ color: stat.color }} />
              </div>
              <div className="stat-info">
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value}</h3>
              </div>
            </div>
            {stat.change && (
              <div className="stat-footer">
                <span className={`stat-change ${stat.trend || 'neutral'}`}>
                  {stat.change}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;

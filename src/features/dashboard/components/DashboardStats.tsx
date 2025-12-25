import React from 'react';
import { useAppointments } from '@app/providers';
import { Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useDashboardStats } from '@features/appointments';

const DashboardStats: React.FC = () => {
  const { appointments } = useAppointments();
  const stats = useDashboardStats(appointments);

  const statCards = [
    {
      label: 'Total Appointments',
      value: stats.totalAppointments,
      icon: Calendar,
      color: 'var(--primary)',
      bgColor: 'rgba(13, 148, 136, 0.1)',
    },
    {
      label: 'Today\'s Appointments',
      value: stats.todayAppointmentsCount,
      icon: Clock,
      color: 'var(--status-scheduled)',
      bgColor: 'rgba(59, 130, 246, 0.1)',
      change: `${stats.todayScheduledCount} scheduled`,
      trend: 'neutral' as const,
    },
    {
      label: 'Completed',
      value: stats.completedCount,
      icon: CheckCircle2,
      color: 'var(--status-completed)',
      bgColor: 'rgba(14, 116, 144, 0.1)',
      change: `${stats.completedPercentage}%`,
      trend: 'up' as const,
    },
    {
      label: 'Booked',
      value: stats.bookedCount,
      icon: Clock,
      color: 'var(--warning)',
      bgColor: 'rgba(217, 119, 6, 0.1)',
      change: 'Requires action',
      trend: 'neutral' as const,
    },
    {
      label: 'Expired Slots',
      value: stats.expiredCount,
      icon: XCircle,
      color: '#9ca3af',
      bgColor: 'rgba(156, 163, 175, 0.1)',
      change: `${stats.expiredPercentage}%`,
      trend: 'neutral' as const,
    },
  ];

  return (
    <div className="dashboard-stats">
      {statCards.map((stat, index) => {
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

import React, { useState } from 'react';
import { Calendar, Clock, History } from 'lucide-react';
import DoctorSidebar from '../components/dashboard/DoctorSidebar';
import OpenSlotModal from '../components/dashboard/OpenSlotModal';
import DashboardStats from '../components/dashboard/DashboardStats';
import TodaySchedule from '../components/dashboard/TodaySchedule';
import UpcomingAppointments from '../components/dashboard/UpcomingAppointments';
import ExpiredAppointments from '../components/dashboard/ExpiredAppointments';
import { useAppointments } from '../context/AppointmentContext';
import './DashboardPage.css';

type DashboardTab = 'today' | 'upcoming' | 'expired';

const DashboardPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('today');
  const { fetchAppointments, isLoading } = useAppointments();

  React.useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleOpenSlot = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    fetchAppointments();
  };

  return (
    <div className="dashboard-layout">
      <DoctorSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">
                Dashboard Overview
              </h1>
              <p className="dashboard-subtitle">
                Monitor your practice performance and manage appointments efficiently
              </p>
            </div>
            <button
              className="btn btn-primary btn-icon"
              onClick={handleOpenSlot}
              title="Open New Slot"
            >
              <span>+</span>
              <span>Open Slot</span>
            </button>
          </div>
          <DashboardStats />

          {/* Tab Navigation */}
          <div className="dashboard-tabs" role="tablist" aria-label="Appointment sections">
            <button
              className={`dashboard-tab ${activeTab === 'today' ? 'active' : ''}`}
              onClick={() => setActiveTab('today')}
              role="tab"
              aria-selected={activeTab === 'today'}
              aria-controls="today-panel"
              id="today-tab"
            >
              <Calendar size={18} aria-hidden="true" />
              <span>Today's Schedule</span>
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
              role="tab"
              aria-selected={activeTab === 'upcoming'}
              aria-controls="upcoming-panel"
              id="upcoming-tab"
            >
              <Clock size={18} aria-hidden="true" />
              <span>Upcoming Appointments</span>
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'expired' ? 'active' : ''}`}
              onClick={() => setActiveTab('expired')}
              role="tab"
              aria-selected={activeTab === 'expired'}
              aria-controls="expired-panel"
              id="expired-tab"
            >
              <History size={18} aria-hidden="true" />
              <span>Previous Appointments</span>
            </button>
          </div>

          {/* Tab Panels */}
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner-large" />
              <p>Loading appointments...</p>
            </div>
          ) : (
            <div className="dashboard-tab-panels">
              {activeTab === 'today' && (
                <div
                  id="today-panel"
                  role="tabpanel"
                  aria-labelledby="today-tab"
                  className="dashboard-tab-panel"
                >
                  <TodaySchedule />
                </div>
              )}
              {activeTab === 'upcoming' && (
                <div
                  id="upcoming-panel"
                  role="tabpanel"
                  aria-labelledby="upcoming-tab"
                  className="dashboard-tab-panel"
                >
                  <UpcomingAppointments />
                </div>
              )}
              {activeTab === 'expired' && (
                <div
                  id="expired-panel"
                  role="tabpanel"
                  aria-labelledby="expired-tab"
                  className="dashboard-tab-panel"
                >
                  <ExpiredAppointments />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <OpenSlotModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default DashboardPage;


import React, { useState } from 'react';
import DoctorSidebar from '../components/dashboard/DoctorSidebar';
import OpenSlotModal from '../components/dashboard/OpenSlotModal';
import DashboardStats from '../components/dashboard/DashboardStats';
import BookingList from '../components/dashboard/BookingList';
import DateDisplay from '../components/dashboard/DateDisplay';
import { useAppointments } from '../context/AppointmentContext';
import './DashboardPage.css';

const DashboardPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { appointments, fetchAppointments, isLoading } = useAppointments();

  React.useEffect(() => {
    fetchAppointments();
  }, []);

  const handleOpenSlot = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    fetchAppointments();
  };

  // Sort appointments by date and time
  const sortedAppointments = React.useMemo(() => {
    return [...appointments].sort((a, b) => {
      // First sort by date
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      // Then by time
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
    });
  }, [appointments]);

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
          <div className="dashboard-cards-section">
            <DateDisplay />
            <DashboardStats />
          </div>
          
          <div className="booking-list-section">
            <h2 className="booking-list-title">Booking List</h2>
            {isLoading ? (
              <div className="loading-state">
                <div className="spinner-large" />
                <p>Loading appointments...</p>
              </div>
            ) : (
              <BookingList appointments={sortedAppointments} />
            )}
          </div>
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


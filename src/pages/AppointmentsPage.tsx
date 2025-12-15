import React, { useState } from 'react';
import DoctorSidebar from '../components/dashboard/DoctorSidebar';
import AppointmentCalendar from '../components/dashboard/AppointmentCalendar';
import OpenSlotModal from '../components/dashboard/OpenSlotModal';
import { useAppointments } from '../context/AppointmentContext';
import { Calendar, Plus } from 'lucide-react';
import './DashboardPage.css';

const AppointmentsPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { fetchAppointments } = useAppointments();

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

  return (
    <div className="dashboard-layout">
      <DoctorSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div>
              <h1 className="dashboard-title">
                <Calendar className="header-icon" />
                Appointments Management
              </h1>
              <p className="dashboard-subtitle">
                Manage your appointments and open available time slots for patients
              </p>
            </div>
            <button
              className="btn btn-primary btn-icon"
              onClick={handleOpenSlot}
              title="Open New Slot"
            >
              <Plus size={20} />
              <span>Open Slot</span>
            </button>
          </div>
          <AppointmentCalendar
            onOpenSlot={handleOpenSlot}
          />
        </div>
      </main>
      <OpenSlotModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default AppointmentsPage;


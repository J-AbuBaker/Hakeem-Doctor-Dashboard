import React, { useState } from 'react';
import DoctorSidebar from '../components/dashboard/DoctorSidebar';
import DoctorProfile from '../components/dashboard/DoctorProfile';
import './DashboardPage.css';

const ProfilePage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <DoctorSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <DoctorProfile />
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;


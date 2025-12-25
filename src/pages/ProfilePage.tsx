import React, { useState } from 'react';
import DoctorSidebar from '@features/dashboard/components/DoctorSidebar';
import DoctorProfile from '@features/dashboard/components/DoctorProfile';
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


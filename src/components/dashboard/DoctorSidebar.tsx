import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/providers';
import {
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  Menu,
  KeyRound,
} from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import ResetPasswordModal from './ResetPasswordModal';
import { AuthService } from '../../features/auth';

interface DoctorSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const DoctorSidebar: React.FC<DoctorSidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  // Send reset code when modal opens
  useEffect(() => {
    if (showResetPasswordModal && user?.username) {
      AuthService.forgotPassword({ username: user.username }).catch((err) => {
        console.error('Failed to send reset code:', err);
      });
    }
  }, [showResetPasswordModal, user?.username]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutDialog(false);
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/dashboard/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/dashboard/profile', icon: User, label: 'Profile' },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onToggle} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-container">
            <img
              src="/hakeem-logo.png"
              alt="HAKEEM"
              className="sidebar-logo-image"
            />
            <span className="sidebar-portal-label">Doctor Portal</span>
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase() || 'D'}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.name || 'Doctor'}</p>
            <p className="user-specialization">{user?.specialization || ''}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={onToggle}
              >
                <Icon className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item reset-password-btn"
            onClick={() => setShowResetPasswordModal(true)}
          >
            <KeyRound className="nav-icon" />
            <span>Reset Password</span>
          </button>
          <button className="nav-item logout-btn" onClick={() => setShowLogoutDialog(true)}>
            <LogOut className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <button className="sidebar-toggle" onClick={onToggle}>
        <Menu />
      </button>

      {/* Reset Password Modal */}
      {user?.username && (
        <ResetPasswordModal
          isOpen={showResetPasswordModal}
          onClose={() => setShowResetPasswordModal(false)}
          userEmail={user.username}
        />
      )}

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        type="logout"
        title="Confirm Logout"
        message={`Are you sure you want to logout from your account?`}
        details={`You will need to sign in again to access your dashboard.`}
        confirmText="Logout"
        cancelText="Stay Logged In"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutDialog(false)}
      />
    </>
  );
};

export default DoctorSidebar;


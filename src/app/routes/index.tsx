import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AppointmentProvider } from '../providers';
import ProtectedRoute from '../../shared/components/ProtectedRoute';
import ErrorBoundary from '../../shared/components/common/ErrorBoundary';
import SignupForm from '../../components/auth/SignupForm';
import LoginForm from '../../components/auth/LoginForm';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import LandingPage from '../../pages/LandingPage';
import DashboardPage from '../../pages/DashboardPage';
import AppointmentsPage from '../../pages/AppointmentsPage';
import ProfilePage from '../../pages/ProfilePage';
import '../../styles/index.css';

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppointmentProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignupForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="/forgot-password" element={<ForgotPasswordForm />} />
              <Route path="/reset-password" element={<ResetPasswordForm />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/appointments"
                element={
                  <ProtectedRoute>
                    <AppointmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AppointmentProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default AppRoutes;

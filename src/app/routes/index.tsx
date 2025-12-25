import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AppointmentProvider } from '@app/providers';
import ProtectedRoute from '@shared/components/ProtectedRoute';
import ErrorBoundary from '@shared/components/common/ErrorBoundary';
import SignupForm from '@features/auth/components/SignupForm';
import LoginForm from '@features/auth/components/LoginForm';
import ForgotPasswordForm from '@features/auth/components/ForgotPasswordForm';
import ResetPasswordForm from '@features/auth/components/ResetPasswordForm';
import LandingPage from '../../pages/LandingPage';
import DashboardPage from '../../pages/DashboardPage';
import AppointmentsPage from '../../pages/AppointmentsPage';
import MedicalHealthRecordsPage from '../../pages/MedicalHealthRecordsPage';
import ProfilePage from '../../pages/ProfilePage';
import '../../styles/index.css';

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
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
                path="/dashboard/medical-records"
                element={
                  <ProtectedRoute>
                    <MedicalHealthRecordsPage />
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

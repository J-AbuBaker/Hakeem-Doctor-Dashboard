import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Shield,
  Clock,
  ArrowRight,
  Heart,
  FileText,
  LayoutDashboard,
  User,
  LogIn,
  UserPlus,
  KeyRound,
  ChevronRight
} from 'lucide-react';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="hero-content">
            <div className="hero-logo">
              <div className="logo-container">
                <img
                  src="/hakeem-logo.png"
                  alt="HAKEEM - Professional Healthcare Management"
                  className="logo-image"
                />
              </div>
            </div>
            <h2 className="hero-title">
              Professional Healthcare Management
              <span className="hero-subtitle">for Modern Medical Practices</span>
            </h2>
            <p className="hero-description">
              Streamline your medical practice with our comprehensive doctor dashboard.
              Manage appointments, track patient records, and deliver exceptional healthcare
              with confidence and efficiency.
            </p>
            <div className="hero-actions">
              <Link to="/login" className="btn btn-primary btn-hero">
                Get Started
                <ArrowRight size={20} />
              </Link>
              <Link to="/signup" className="btn btn-secondary btn-hero">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-container">
          <div className="section-header">
            <h2 className="section-title">Why Choose HAKEEM?</h2>
            <p className="section-description">
              Everything you need to manage your medical practice efficiently
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Calendar className="icon" />
              </div>
              <h3 className="feature-title">Appointment Management</h3>
              <p className="feature-description">
                Schedule, reschedule, and manage patient appointments with our intuitive
                calendar system. Never miss an appointment with smart reminders.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Users className="icon" />
              </div>
              <h3 className="feature-title">Patient Records</h3>
              <p className="feature-description">
                Maintain comprehensive patient records with secure, HIPAA-compliant
                data storage. Access patient history instantly when you need it.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Shield className="icon" />
              </div>
              <h3 className="feature-title">Secure & Compliant</h3>
              <p className="feature-description">
                Built with healthcare security standards in mind. Your data is encrypted
                and protected with industry-leading security measures.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Clock className="icon" />
              </div>
              <h3 className="feature-title">Time Slot Management</h3>
              <p className="feature-description">
                Efficiently manage your availability with our professional time slot system.
                Optimize your schedule and reduce no-shows.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FileText className="icon" />
              </div>
              <h3 className="feature-title">Clinical Notes</h3>
              <p className="feature-description">
                Document patient visits with detailed clinical notes. Keep accurate records
                for better patient care and compliance.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Heart className="icon" />
              </div>
              <h3 className="feature-title">Patient Care Focus</h3>
              <p className="feature-description">
                Designed by healthcare professionals for healthcare professionals.
                Focus on what matters most - your patients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta">
        <div className="landing-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-description">
              Join HAKEEM today and experience the future of healthcare management.
            </p>
            <div className="cta-actions">
              <Link to="/signup" className="btn btn-primary btn-large">
                Create Free Account
                <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-main">
            <div className="footer-brand-section">
              <div className="footer-logo-wrapper">
                <div className="footer-logo-container">
                  <img
                    src="/hakeem-logo.png"
                    alt="HAKEEM"
                    className="footer-logo-image"
                  />
                </div>
              </div>
              <p className="footer-brand-description">
                Professional healthcare management platform designed for modern medical practices. Empowering doctors with advanced tools to deliver exceptional patient care.
              </p>
            </div>

            <div className="footer-navigation">
              <div className="footer-nav-group">
                <h5 className="footer-nav-title">Product</h5>
                <nav className="footer-nav-horizontal">
                  <Link to="/dashboard" className="footer-nav-item">
                    <LayoutDashboard size={18} className="footer-item-icon" />
                    <span className="footer-item-text">Dashboard</span>
                  </Link>
                  <Link to="/dashboard/appointments" className="footer-nav-item">
                    <Calendar size={18} className="footer-item-icon" />
                    <span className="footer-item-text">Appointments</span>
                  </Link>
                  <Link to="/dashboard/profile" className="footer-nav-item">
                    <User size={18} className="footer-item-icon" />
                    <span className="footer-item-text">Profile</span>
                  </Link>
                </nav>
              </div>

              <div className="footer-nav-group">
                <h5 className="footer-nav-title">Account</h5>
                <nav className="footer-nav-horizontal">
                  <Link to="/login" className="footer-nav-item">
                    <LogIn size={18} className="footer-item-icon" />
                    <span className="footer-item-text">Sign In</span>
                  </Link>
                  <Link to="/signup" className="footer-nav-item">
                    <UserPlus size={18} className="footer-item-icon" />
                    <span className="footer-item-text">Sign Up</span>
                  </Link>
                  <Link to="/forgot-password" className="footer-nav-item">
                    <KeyRound size={18} className="footer-item-icon" />
                    <span className="footer-item-text">Forgot Password</span>
                  </Link>
                </nav>
              </div>
            </div>
          </div>

          <div className="footer-divider"></div>

          <div className="footer-bottom">
            <div className="footer-bottom-left">
              <p className="footer-copyright">
                &copy; {new Date().getFullYear()} <strong>HAKEEM</strong>. All rights reserved.
              </p>
            </div>
            <div className="footer-bottom-right">
              <span className="footer-platform-badge">Healthcare Management Platform</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

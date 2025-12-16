import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Shield,
  Clock,
  ArrowRight,
  Heart,
  FileText
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
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo-container small">
                <img
                  src="/hakeem-logo.png"
                  alt="HAKEEM"
                  className="logo-image small"
                />
              </div>
              <p className="footer-tagline">
                Professional healthcare management for modern medical practices.
              </p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/dashboard/appointments">Appointments</Link>
                <Link to="/dashboard/profile">Profile</Link>
              </div>
              <div className="footer-column">
                <h4>Account</h4>
                <Link to="/login">Sign In</Link>
                <Link to="/signup">Sign Up</Link>
                <Link to="/forgot-password">Forgot Password</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} HAKEEM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

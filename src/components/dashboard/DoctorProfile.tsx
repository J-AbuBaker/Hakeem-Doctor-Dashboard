import React, { useState, useEffect } from 'react';
import { Doctor, UserInfo } from '../../types';
import { AuthService } from '../../features/auth';
import { getErrorMessage } from '../../shared/utils/error/handlers';
import {
  MapPin,
  Phone,
  Calendar,
  Stethoscope,
  BadgeCheck,
  Heart,
  Droplet,
  Weight,
  Briefcase,
  Shield,
  Loader2,
  AlertCircle,
  UserCircle,
  Users,
  GraduationCap,
  CheckCircle2
} from 'lucide-react';
import './DoctorProfile.css';

// Helper function to convert UserInfo (API response) to Doctor format
const mapUserInfoToDoctor = (userInfo: UserInfo): Doctor => {
  return {
    id: userInfo.id.toString(),
    username: userInfo.username,
    name: userInfo.name,
    dob: userInfo.dob,
    gender: userInfo.gender,
    blood_type: userInfo.bloodType,
    age: userInfo.age,
    weight: userInfo.weight,
    ph_num: userInfo.phoneNumber,
    specialization: userInfo.specialization,
    license: userInfo.license,
    description: userInfo.description || '',
    x: userInfo.longitude,
    y: userInfo.latitude,
    role: userInfo.role
  };
};

const DoctorProfile: React.FC = () => {
  const [user, setUser] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const userInfo = await AuthService.getUserInfo();

      if (userInfo) {
        const doctorData = mapUserInfoToDoctor(userInfo);
        setUser(doctorData);
      } else {
        setError('Failed to load user information. Please try again.');
      }
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error('Error fetching user profile:', err);
      }
      setError(getErrorMessage(err) || 'Failed to load user profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="doctor-profile">
        <div className="profile-loading-state">
          <div className="loading-content">
            <Loader2 className="loading-spinner" size={56} />
            <p className="loading-text">Loading profile information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="doctor-profile">
        <div className="profile-error-state">
          <div className="error-content">
            <AlertCircle className="error-icon" size={56} />
            <h3 className="error-title">Unable to Load Profile</h3>
            <p className="error-message">{error || 'Failed to load user profile'}</p>
            <button onClick={fetchUserInfo} className="error-retry-btn">
              <Loader2 size={18} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formattedCoordinates = `${Number.isFinite(user.y) ? user.y.toFixed(2) : '--'}, ${Number.isFinite(user.x) ? user.x.toFixed(2) : '--'
    }`;
  const formattedPhone = user.ph_num.toString();

  return (
    <div className="doctor-profile">
      <div className="profile-container-modern">
        {/* Profile Header Section - Single Card */}
        <div className="profile-header-card">
          <div className="profile-header-section">
            <div className="profile-header-avatar">
              <div className="profile-avatar-modern">
                <div className="avatar-initial">{user.name.charAt(0).toUpperCase()}</div>
                <div className="avatar-verified-badge">
                  <CheckCircle2 size={16} />
                </div>
              </div>
            </div>

            <div className="profile-header-info">
              <h1 className="profile-name-modern">Dr. {user.name}</h1>

              <div className="profile-badges-modern">
                <div className="profile-badge-modern badge-specialization">
                  <Stethoscope size={14} />
                  <span>{user.specialization}</span>
                </div>
                <div className="profile-badge-modern badge-license">
                  <BadgeCheck size={14} />
                  <span>License #{user.license}</span>
                </div>
                <div className="profile-badge-modern badge-verified">
                  <Shield size={14} />
                  <span>Verified</span>
                </div>
              </div>

              {user.description && (
                <p className="profile-description-modern">
                  {user.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Information Grid Section - 2x2 Layout */}
        <div className="profile-sections-modern profile-grid-layout">
          {/* Personal Information - Top Left */}
          <div className="profile-section-modern">
            <div className="section-header-modern">
              <div className="section-icon-modern section-icon-personal">
                <UserCircle size={20} />
              </div>
              <div className="section-header-text">
                <h3 className="section-title-modern">Personal Information</h3>
                <p className="section-subtitle-modern">Basic details and demographics</p>
              </div>
            </div>
            <div className="info-grid-modern">
              <div className="info-item-modern">
                <div className="info-item-icon">
                  <Users size={18} />
                </div>
                <div className="info-item-content">
                  <span className="info-item-label">Gender</span>
                  <span className="info-item-value">{user.gender ? 'Male' : 'Female'}</span>
                </div>
              </div>
              <div className="info-item-modern">
                <div className="info-item-icon">
                  <Calendar size={18} />
                </div>
                <div className="info-item-content">
                  <span className="info-item-label">Age</span>
                  <span className="info-item-value">{user.age} years</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information - Top Right */}
          <div className="profile-section-modern">
            <div className="section-header-modern">
              <div className="section-icon-modern section-icon-medical">
                <Heart size={20} />
              </div>
              <div className="section-header-text">
                <h3 className="section-title-modern">Medical Information</h3>
                <p className="section-subtitle-modern">Health and medical details</p>
              </div>
            </div>
            <div className="info-grid-modern">
              <div className="info-item-modern">
                <div className="info-item-icon">
                  <Droplet size={18} />
                </div>
                <div className="info-item-content">
                  <span className="info-item-label">Blood Type</span>
                  <span className="info-item-value value-blood-type">{user.blood_type}</span>
                </div>
              </div>
              <div className="info-item-modern">
                <div className="info-item-icon">
                  <Weight size={18} />
                </div>
                <div className="info-item-content">
                  <span className="info-item-label">Weight</span>
                  <span className="info-item-value">{user.weight} kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Details - Bottom Left */}
          <div className="profile-section-modern">
            <div className="section-header-modern">
              <div className="section-icon-modern section-icon-professional">
                <Briefcase size={20} />
              </div>
              <div className="section-header-text">
                <h3 className="section-title-modern">Professional Details</h3>
                <p className="section-subtitle-modern">Credentials and qualifications</p>
              </div>
            </div>
            <div className="info-grid-modern">
              <div className="info-item-modern">
                <div className="info-item-icon">
                  <GraduationCap size={18} />
                </div>
                <div className="info-item-content">
                  <span className="info-item-label">Specialization</span>
                  <span className="info-item-value value-specialization">{user.specialization}</span>
                </div>
              </div>
              <div className="info-item-modern">
                <div className="info-item-icon">
                  <BadgeCheck size={18} />
                </div>
                <div className="info-item-content">
                  <span className="info-item-label">Medical License</span>
                  <span className="info-item-value value-license">#{user.license}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information - Bottom Right */}
          <div className="profile-section-modern">
            <div className="section-header-modern">
              <div className="section-icon-modern section-icon-contact">
                <Phone size={20} />
              </div>
              <div className="section-header-text">
                <h3 className="section-title-modern">Contact Information</h3>
                <p className="section-subtitle-modern">Ways to reach you</p>
              </div>
            </div>
            <div className="info-grid-modern">
              <div className="info-item-modern">
                <div className="info-item-icon">
                  <Phone size={18} />
                </div>
                <div className="info-item-content">
                  <span className="info-item-label">Phone Number</span>
                  <span className="info-item-value">{formattedPhone}</span>
                </div>
              </div>
              <div className="info-item-modern">
                <div className="info-item-icon">
                  <MapPin size={18} />
                </div>
                <div className="info-item-content">
                  <span className="info-item-label">Location</span>
                  <span className="info-item-value">{formattedCoordinates}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;

import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SPECIALIZATIONS, BLOOD_TYPES } from '../../types';
import { getErrorMessage, getErrorStatus } from '../../utils/errorUtils';
import {
  UserPlus,
  Loader2,
  User,
  Mail,
  Lock,
  Calendar,
  Users,
  Droplet,
  Stethoscope,
  Weight,
  Phone,
  Award,
  FileText,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';
import DatePicker from '../common/DatePicker';
import './AuthShared.css';
import './AuthForms.css';

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Check password requirements dynamically
  const checkPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };
  };

  // Calculate minimum date (January 1st of the year that makes users 25 years old)
  // This ensures users must be at least 25 years old
  // Setting to Jan 1st ensures the entire minimum year is selectable and years after are hidden
  // Example: If today is 2025-12-15, min date is 2000-01-01
  // This means years 2001-2025 will be completely hidden in the calendar
  const getMinDate = (): string => {
    const today = new Date();
    // Calculate the year that makes someone exactly 25 years old
    const minYear = today.getFullYear() - 25;

    // Set to January 1st of that year to ensure all dates in that year are selectable
    // and years after are completely hidden
    return `${minYear}-01-01`;
  };

  // Calculate maximum date (today)
  const getMaxDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  const validationSchema = Yup.object({
    username: Yup.string()
      .email('Please enter a valid email address')
      .required('Email address is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters long')
      .matches(/[A-Z]/, 'Password must include at least one uppercase letter')
      .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must include at least one special character (!@#$%^&*...)')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords do not match. Please ensure both passwords are identical')
      .required('Please confirm your password'),
    name: Yup.string().required('Full name is required'),
    dob: Yup.string()
      .required('Date of birth is required')
      .test('valid-date', 'Please enter a valid date', function (value) {
        if (!value || value === '') return true; // Allow empty for initial state
        const date = new Date(value);
        if (isNaN(date.getTime())) return false;
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value)) return false;
        return true;
      })
      .test('not-future', 'Date of birth cannot be in the future', function (value) {
        if (!value || value === '') return true; // Allow empty for initial state
        const date = new Date(value);
        if (isNaN(date.getTime())) return true; // Let valid-date test handle invalid dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date <= today;
      })
      .test('age-min', 'You must be at least 25 years old to register', function (value) {
        if (!value || value === '') return true; // Allow empty for initial state
        const age = calculateAge(value);
        return age >= 25;
      })
      .test('age-max', 'Please enter a valid date of birth', function (value) {
        if (!value || value === '') return true; // Allow empty for initial state
        const age = calculateAge(value);
        return age < 100;
      }),
    gender: Yup.boolean().required('Please select your gender'),
    blood_type: Yup.string().oneOf(BLOOD_TYPES).required('Please select your blood type'),
    weight: Yup.string()
      .required('Weight is required')
      .test('is-number', 'Please enter a valid weight between 30 and 300 kg', (value) => {
        if (!value) return false;
        const num = parseFloat(value);
        return !isNaN(num) && num >= 30 && num <= 300;
      }),
    ph_num: Yup.string()
      .required('Phone number is required')
      .matches(/^\d{10,}$/, 'Please enter a valid phone number (at least 10 digits)'),
    specialization: Yup.string()
      .oneOf(SPECIALIZATIONS)
      .required('Please select your medical specialization'),
    license: Yup.string()
      .required('Medical license number is required')
      .matches(/^\d+$/, 'License number must contain only numbers')
      .test('min-length', 'Please enter a valid license number', (value) => {
        if (!value) return false;
        return parseInt(value) >= 1000;
      }),
    description: Yup.string()
      .min(10, 'Professional description must be at least 10 characters long')
      .required('Professional description is required'),
    x: Yup.string()
      .test('is-number', 'Longitude must be a number between -180 and 180', (value) => {
        if (!value) return true; // Optional field
        const num = parseFloat(value);
        return !isNaN(num) && num >= -180 && num <= 180;
      }),
    y: Yup.string()
      .test('is-number', 'Latitude must be a number between -90 and 90', (value) => {
        if (!value) return true; // Optional field
        const num = parseFloat(value);
        return !isNaN(num) && num >= -90 && num <= 90;
      }),
  });

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      confirmPassword: '',
      name: '',
      dob: '',
      gender: true,
      blood_type: '',
      weight: '',
      ph_num: '',
      specialization: '',
      license: '',
      description: '',
      x: '',
      y: '',
      role: 'DOCTOR', // Default role for doctor registration (uppercase to match API)
    },
    validationSchema,
    validateOnMount: false,
    validateOnChange: false,
    validateOnBlur: false,
    onSubmit: async (values: {
      username: string;
      password: string;
      confirmPassword?: string;
      name: string;
      dob: string;
      gender: boolean;
      blood_type: string;
      weight: string;
      ph_num: string;
      specialization: string;
      license: string;
      description: string;
      x: string;
      y: string;
      role: string;
    }) => {
      setIsSubmitting(true);
      setError(null);
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword, ...signupData } = values;
        const dobISO = new Date(signupData.dob).toISOString();
        const calculatedAge = calculateAge(signupData.dob);
        await signup({
          ...signupData,
          dob: dobISO,
          age: calculatedAge,
          ph_num: Number(signupData.ph_num),
          license: Number(signupData.license),
          weight: Number(signupData.weight),
          x: signupData.x ? Number(signupData.x) : 0,
          y: signupData.y ? Number(signupData.y) : 0,
          role: signupData.role || 'DOCTOR', // Ensure role is included (uppercase to match API)
        });
        navigate('/dashboard');
      } catch (err: unknown) {
        // Professional error messages for better UX
        let errorMessage = getErrorMessage(err);
        const status = getErrorStatus(err);

        // Format network errors for better readability
        if (errorMessage.includes('Network Error') || errorMessage.includes('ERR_NETWORK')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (status === 409 || errorMessage.includes('409') || errorMessage.includes('Conflict') || errorMessage.includes('already exists')) {
          errorMessage = 'An account with this username already exists. Please use a different username or sign in instead.';
        } else if (status === 400 || errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          errorMessage = 'Please check all required fields and ensure your information is correct.';
        } else if (status === 500 || errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
          errorMessage = 'A server error occurred during registration. Please try again in a few moments.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          errorMessage = 'The registration request took too long. Please check your connection and try again.';
        }

        setError(errorMessage);
        if (import.meta.env.DEV) {
          console.error('Signup Error Details:', {
            message: errorMessage,
            status,
            error: err,
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Custom submit handler that validates and shows errors
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched to show validation errors
    formik.setTouched({
      username: true,
      password: true,
      confirmPassword: true,
      name: true,
      dob: true,
      gender: true,
      blood_type: true,
      weight: true,
      ph_num: true,
      specialization: true,
      license: true,
      description: true,
      x: true,
      y: true,
    });

    // Validate the form
    const errors = await formik.validateForm();

    // If there are errors, stop here (errors will be displayed)
    if (Object.keys(errors).length > 0) {
      return;
    }

    // If validation passes, submit the form
    formik.handleSubmit(e);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <Shield className="auth-icon" />
          </div>
          <h1>Doctor Registration</h1>
          <p>Create your professional account to get started</p>
        </div>

        {error && (
          <div className="error-message">
            <div className="error-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="username">
              <Mail className="label-icon" />
              Email *
            </label>
            <div className="input-wrapper">
              <Mail className="input-icon" />
              <input
                id="username"
                name="username"
                type="email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.username}
                className={formik.touched.username && formik.errors.username ? 'error' : ''}
                placeholder="Enter your email"
                autoComplete="email"
              />
              {formik.touched.username && !formik.errors.username && formik.values.username && (
                <CheckCircle2 className="input-icon-success" />
              )}
            </div>
            {formik.touched.username && formik.errors.username && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={16} />
                {formik.errors.username}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">
                <Lock className="label-icon" />
                Password *
              </label>
              <div className="input-wrapper password-wrapper">
                <Lock className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  onChange={async (e) => {
                    formik.handleChange(e);
                    // Validate password field immediately
                    await formik.setFieldTouched('password', true, false);
                    formik.validateField('password');
                  }}
                  onBlur={formik.handleBlur}
                  value={formik.values.password}
                  className={formik.touched.password && formik.errors.password ? 'error' : ''}
                  placeholder="Enter your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {formik.touched.password && !formik.errors.password && formik.values.password && (
                  <CheckCircle2 className="input-icon-success" />
                )}
              </div>
              {formik.touched.password && formik.errors.password && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.password}
                </div>
              )}

              {/* Password Requirements */}
              {formik.values.password && (() => {
                const passwordRequirements = checkPasswordRequirements(formik.values.password);
                return (
                  <div className="password-requirements">
                    <h3 className="password-requirements-title">PASSWORD REQUIREMENTS</h3>
                    <div className="password-requirements-list">
                      <div className={`password-requirement-item ${passwordRequirements.minLength ? 'met' : ''}`}>
                        <div className="requirement-icon-wrapper">
                          {passwordRequirements.minLength ? (
                            <CheckCircle2 size={16} className="requirement-icon-check" />
                          ) : (
                            <div className="requirement-icon-empty"></div>
                          )}
                        </div>
                        <span className={`requirement-text ${passwordRequirements.minLength ? 'met' : ''}`}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className={`password-requirement-item ${passwordRequirements.hasUppercase ? 'met' : ''}`}>
                        <div className="requirement-icon-wrapper">
                          {passwordRequirements.hasUppercase ? (
                            <CheckCircle2 size={16} className="requirement-icon-check" />
                          ) : (
                            <div className="requirement-icon-empty"></div>
                          )}
                        </div>
                        <span className={`requirement-text ${passwordRequirements.hasUppercase ? 'met' : ''}`}>
                          One uppercase letter
                        </span>
                      </div>
                      <div className={`password-requirement-item ${passwordRequirements.hasSpecialChar ? 'met' : ''}`}>
                        <div className="requirement-icon-wrapper">
                          {passwordRequirements.hasSpecialChar ? (
                            <CheckCircle2 size={16} className="requirement-icon-check" />
                          ) : (
                            <div className="requirement-icon-empty"></div>
                          )}
                        </div>
                        <span className={`requirement-text ${passwordRequirements.hasSpecialChar ? 'met' : ''}`}>
                          One special character
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Lock className="label-icon" />
                Confirm Password *
              </label>
              <div className="input-wrapper password-wrapper">
                <Lock className="input-icon" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  onChange={async (e) => {
                    formik.handleChange(e);
                    // Validate confirm password field immediately
                    await formik.setFieldTouched('confirmPassword', true, false);
                    formik.validateField('confirmPassword');
                  }}
                  onBlur={formik.handleBlur}
                  value={formik.values.confirmPassword}
                  className={formik.touched.confirmPassword && formik.errors.confirmPassword ? 'error' : ''}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {formik.touched.confirmPassword && !formik.errors.confirmPassword && formik.values.confirmPassword && (
                  <CheckCircle2 className="input-icon-success" />
                )}
              </div>
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.confirmPassword}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">
              <User className="label-icon" />
              Full Name *
            </label>
            <div className="input-wrapper">
              <User className="input-icon" />
              <input
                id="name"
                name="name"
                type="text"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
                className={formik.touched.name && formik.errors.name ? 'error' : ''}
                placeholder="Enter your full name"
              />
              {formik.touched.name && !formik.errors.name && formik.values.name && (
                <CheckCircle2 className="input-icon-success" />
              )}
            </div>
            {formik.touched.name && formik.errors.name && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={16} />
                {formik.errors.name}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dob">
                <Calendar className="label-icon" />
                Date of Birth *
              </label>
              <DatePicker
                value={formik.values.dob}
                onChange={(date) => formik.setFieldValue('dob', date)}
                onBlur={() => formik.setFieldTouched('dob', true)}
                minDate={getMinDate()}
                maxDate={getMaxDate()}
                error={formik.touched.dob && formik.errors.dob ? formik.errors.dob as string : undefined}
                placeholder="Select your date of birth"
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">
                <Users className="label-icon" />
                Gender *
              </label>
              <div className="input-wrapper">
                <Users className="input-icon" />
                <select
                  id="gender"
                  name="gender"
                  onChange={(e) => formik.setFieldValue('gender', e.target.value === 'true')}
                  onBlur={formik.handleBlur}
                  value={formik.values.gender.toString()}
                  className={formik.touched.gender && formik.errors.gender ? 'error' : ''}
                >
                  <option value="true">Male</option>
                  <option value="false">Female</option>
                </select>
              </div>
              {formik.touched.gender && formik.errors.gender && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.gender}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="blood_type">
                <Droplet className="label-icon" />
                Blood Type *
              </label>
              <div className="input-wrapper">
                <Droplet className="input-icon" />
                <select
                  id="blood_type"
                  name="blood_type"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.blood_type}
                  className={formik.touched.blood_type && formik.errors.blood_type ? 'error' : ''}
                >
                  <option value="">Select Blood Type</option>
                  {BLOOD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              {formik.touched.blood_type && formik.errors.blood_type && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.blood_type}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="specialization">
                <Stethoscope className="label-icon" />
                Specialization *
              </label>
              <div className="input-wrapper">
                <Stethoscope className="input-icon" />
                <select
                  id="specialization"
                  name="specialization"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.specialization}
                  className={formik.touched.specialization && formik.errors.specialization ? 'error' : ''}
                >
                  <option value="">Select Specialization</option>
                  {SPECIALIZATIONS.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
              {formik.touched.specialization && formik.errors.specialization && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.specialization}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="weight">
                <Weight className="label-icon" />
                Weight (kg) *
              </label>
              <div className="input-wrapper">
                <Weight className="input-icon" />
                <input
                  id="weight"
                  name="weight"
                  type="text"
                  inputMode="decimal"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.weight}
                  className={formik.touched.weight && formik.errors.weight ? 'error' : ''}
                  placeholder="e.g., 70.5"
                />
                {formik.touched.weight && !formik.errors.weight && formik.values.weight && (
                  <CheckCircle2 className="input-icon-success" />
                )}
              </div>
              {formik.touched.weight && formik.errors.weight && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.weight}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="ph_num">
                <Phone className="label-icon" />
                Phone Number *
              </label>
              <div className="input-wrapper">
                <Phone className="input-icon" />
                <input
                  id="ph_num"
                  name="ph_num"
                  type="text"
                  inputMode="numeric"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.ph_num}
                  className={formik.touched.ph_num && formik.errors.ph_num ? 'error' : ''}
                  placeholder="e.g., 1234567890"
                />
                {formik.touched.ph_num && !formik.errors.ph_num && formik.values.ph_num && (
                  <CheckCircle2 className="input-icon-success" />
                )}
              </div>
              {formik.touched.ph_num && formik.errors.ph_num && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.ph_num}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="license">
              <Award className="label-icon" />
              License Number *
            </label>
            <div className="input-wrapper">
              <Award className="input-icon" />
              <input
                id="license"
                name="license"
                type="text"
                inputMode="numeric"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.license}
                className={formik.touched.license && formik.errors.license ? 'error' : ''}
                placeholder="e.g., 12345"
              />
              {formik.touched.license && !formik.errors.license && formik.values.license && (
                <CheckCircle2 className="input-icon-success" />
              )}
            </div>
            {formik.touched.license && formik.errors.license && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={16} />
                {formik.errors.license}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">
              <FileText className="label-icon" />
              Professional Description *
            </label>
            <div className="textarea-wrapper">
              <FileText className="textarea-icon" />
              <textarea
                id="description"
                name="description"
                rows={4}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.description}
                className={formik.touched.description && formik.errors.description ? 'error' : ''}
                placeholder="Describe your professional background and expertise..."
              />
            </div>
            {formik.touched.description && formik.errors.description && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={16} />
                {formik.errors.description}
              </div>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="x">
                <MapPin className="label-icon" />
                Longitude (x)
              </label>
              <div className="input-wrapper">
                <MapPin className="input-icon" />
                <input
                  id="x"
                  name="x"
                  type="text"
                  inputMode="decimal"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.x}
                  className={formik.touched.x && formik.errors.x ? 'error' : ''}
                  placeholder="e.g., -122.4194"
                />
                {formik.touched.x && !formik.errors.x && formik.values.x && (
                  <CheckCircle2 className="input-icon-success" />
                )}
              </div>
              {formik.touched.x && formik.errors.x && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.x}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="y">
                <MapPin className="label-icon" />
                Latitude (y)
              </label>
              <div className="input-wrapper">
                <MapPin className="input-icon" />
                <input
                  id="y"
                  name="y"
                  type="text"
                  inputMode="decimal"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.y}
                  className={formik.touched.y && formik.errors.y ? 'error' : ''}
                  placeholder="e.g., 37.7749"
                />
                {formik.touched.y && !formik.errors.y && formik.values.y && (
                  <CheckCircle2 className="input-icon-success" />
                )}
              </div>
              {formik.touched.y && formik.errors.y && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.y}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="spinner" />
                Creating Account...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;


import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../app/providers';
import { SPECIALIZATIONS, BLOOD_TYPES } from '../../types';
import { getErrorMessage, getErrorStatus } from '../../shared/utils/error/handlers';
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
} from 'lucide-react';
import DatePicker from '../common/DatePicker';
import ClinicLocationPickerModal from '../common/ClinicLocationPickerModal';
import SelectDropdown from '../common/SelectDropdown';
import type { SelectOption, SelectOptionGroup } from '../common/SelectDropdown';
import './AuthShared.css';
import './AuthForms.css';

const SignupForm: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = React.useState(false);
  const [bloodRhFactor, setBloodRhFactor] = React.useState<string>('');
  const [bloodTypeLetter, setBloodTypeLetter] = React.useState<string>('');

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
    gender: Yup.boolean().nullable().test('required', 'Please select your gender', (value) => value !== null && value !== undefined),
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
      .required('Longitude is required. Please select clinic location from map.')
      .test('is-number', 'Longitude must be a number between -180 and 180', (value) => {
        if (!value) return false;
        const num = parseFloat(value);
        return !isNaN(num) && num >= -180 && num <= 180;
      }),
    y: Yup.string()
      .required('Latitude is required. Please select clinic location from map.')
      .test('is-number', 'Latitude must be a number between -90 and 90', (value) => {
        if (!value) return false;
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
      gender: null as any,
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
      gender: boolean | null;
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

  // Initialize GPS location on component mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          // Only set if form values are empty (not overwriting user selections)
          if (!formik.values.y && !formik.values.x) {
            formik.setFieldValue('y', lat.toString());
            formik.setFieldValue('x', lng.toString());
          }
        },
        () => {
          // If geolocation fails, use default values (Middle East region)
          if (!formik.values.y && !formik.values.x) {
            formik.setFieldValue('y', '31.9522');
            formik.setFieldValue('x', '35.2332');
          }
        }
      );
    } else {
      // Default to Middle East region if geolocation not available
      if (!formik.values.y && !formik.values.x) {
        formik.setFieldValue('y', '31.9522');
        formik.setFieldValue('x', '35.2332');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Initialize blood type components from formik value if it exists
  React.useEffect(() => {
    if (formik.values.blood_type && formik.values.blood_type.length >= 2) {
      const rhFactor = formik.values.blood_type.slice(-1); // Get last character (+ or -)
      const letter = formik.values.blood_type.slice(0, -1); // Get everything except last character
      if ((rhFactor === '+' || rhFactor === '-') && ['A', 'B', 'AB', 'O'].includes(letter)) {
        setBloodRhFactor(rhFactor);
        setBloodTypeLetter(letter);
      }
    } else if (!formik.values.blood_type) {
      // Clear local state if formik value is cleared
      setBloodRhFactor('');
      setBloodTypeLetter('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.blood_type]); // Update when blood_type changes

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
            <Stethoscope className="auth-icon" />
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
          {/* Section 1: Account Credentials */}
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

          {/* Password Requirements - Outside form-group/form-row to span full form width */}
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

          {/* Section 2: Personal Information */}
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
              <SelectDropdown
                id="gender"
                name="gender"
                value={formik.values.gender !== undefined && formik.values.gender !== null ? String(formik.values.gender) : ''}
                onChange={(value) => {
                  formik.setFieldValue('gender', value === 'true');
                  formik.setFieldTouched('gender', true, false);
                }}
                onBlur={() => formik.setFieldTouched('gender', true)}
                options={[
                  { value: 'true', label: 'Male' },
                  { value: 'false', label: 'Female' },
                ]}
                placeholder="Select your gender"
                error={formik.touched.gender && !!formik.errors.gender}
                icon={Users}
                searchable={false}
                emptyMessage="No options available"
                showClear={false}
              />
              {formik.touched.gender && formik.errors.gender && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.gender}
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Health Information */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="blood_rh_factor">
                <Droplet className="label-icon" />
                Rh Factor *
              </label>
              <SelectDropdown
                id="blood_rh_factor"
                name="blood_rh_factor"
                value={bloodRhFactor}
                onChange={(value) => {
                  setBloodRhFactor(value);
                  // Reset blood type letter when Rh factor changes
                  setBloodTypeLetter('');
                  // Clear combined blood type if Rh changes
                  formik.setFieldValue('blood_type', '');
                  formik.setFieldTouched('blood_type', true, false);
                }}
                onBlur={() => formik.setFieldTouched('blood_type', true)}
                options={[
                  { value: '+', label: 'Rh Positive (+)' },
                  { value: '-', label: 'Rh Negative (-)' },
                ]}
                placeholder="Select Rh factor"
                error={formik.touched.blood_type && !!formik.errors.blood_type && !bloodRhFactor}
                icon={Droplet}
                searchable={false}
                emptyMessage="No options available"
                showClear={false}
              />
            </div>

            <div className="form-group">
              <label htmlFor="blood_type_letter">
                <Droplet className="label-icon" />
                Blood Type *
              </label>
              <SelectDropdown
                id="blood_type_letter"
                name="blood_type_letter"
                value={bloodTypeLetter}
                onChange={(value) => {
                  setBloodTypeLetter(value);
                  // Combine Rh factor and blood type letter
                  const combinedBloodType = `${value}${bloodRhFactor}`;
                  formik.setFieldValue('blood_type', combinedBloodType);
                  formik.setFieldTouched('blood_type', true, false);
                }}
                onBlur={() => formik.setFieldTouched('blood_type', true)}
                options={[
                  { value: 'A', label: 'A' },
                  { value: 'B', label: 'B' },
                  { value: 'AB', label: 'AB' },
                  { value: 'O', label: 'O' },
                ]}
                placeholder={bloodRhFactor ? 'Select blood type' : 'Select Rh factor first'}
                error={formik.touched.blood_type && !!formik.errors.blood_type && !bloodTypeLetter}
                icon={Droplet}
                searchable={false}
                emptyMessage="No options available"
                disabled={!bloodRhFactor}
                showClear={false}
              />
              {formik.touched.blood_type && formik.errors.blood_type && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.blood_type}
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
                  type="tel"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.ph_num}
                  className={formik.touched.ph_num && formik.errors.ph_num ? 'error' : ''}
                  placeholder="Enter your phone number"
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

          {/* Section 4: Professional Information */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="specialization">
                <Stethoscope className="label-icon" />
                Medical Specialization *
              </label>
              <SelectDropdown
                id="specialization"
                name="specialization"
                value={formik.values.specialization}
                onChange={(value) => {
                  formik.setFieldValue('specialization', value);
                  formik.setFieldTouched('specialization', true, false);
                }}
                onBlur={() => formik.setFieldTouched('specialization', true)}
                options={SPECIALIZATIONS.map((spec) => ({ value: spec, label: spec }))}
                placeholder="Search and select your specialization"
                error={formik.touched.specialization && !!formik.errors.specialization}
                icon={Stethoscope}
                searchable={true}
                emptyMessage="No specialization found"
              />
              {formik.touched.specialization && formik.errors.specialization && (
                <div className="field-error">
                  <AlertCircle className="error-icon" size={16} />
                  {formik.errors.specialization}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="license">
                <Award className="label-icon" />
                Medical License Number *
              </label>
              <div className="input-wrapper">
                <Award className="input-icon" />
                <input
                  id="license"
                  name="license"
                  type="text"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.license}
                  className={formik.touched.license && formik.errors.license ? 'error' : ''}
                  placeholder="Enter your license number"
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
          </div>

          <div className="form-group">
            <label htmlFor="description">
              <FileText className="label-icon" />
              Professional Description *
            </label>
            <div className="textarea-wrapper">
              <FileText className="input-icon" />
              <textarea
                id="description"
                name="description"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.description}
                className={formik.touched.description && formik.errors.description ? 'error' : ''}
                placeholder="Describe your professional background and expertise..."
                rows={4}
              />
            </div>
            {formik.touched.description && formik.errors.description && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={16} />
                {formik.errors.description}
              </div>
            )}
          </div>

          {/* Section 6: Clinic Location */}
          <div className="form-row">
          </div>

          <div className="form-group">
            <label>
              <MapPin className="label-icon" />
              Clinic Location *
            </label>
            <div className="location-picker-section">
              <button
                type="button"
                className="btn btn-outline location-picker-btn"
                onClick={() => setIsLocationPickerOpen(true)}
              >
                <MapPin size={18} />
                Select Clinic Location
              </button>
              <p className="location-helper-text">
                Pick clinic location from map to auto-fill coordinates.
              </p>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="y">
                <MapPin className="label-icon" />
                Clinic Latitude (y) *
              </label>
              <div className="input-wrapper">
                <MapPin className="input-icon" />
                <input
                  id="y"
                  name="y"
                  type="text"
                  readOnly
                  value={formik.values.y}
                  className={`readonly-input ${formik.touched.y && formik.errors.y ? 'error' : ''}`}
                  placeholder="Select location from map"
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

            <div className="form-group">
              <label htmlFor="x">
                <MapPin className="label-icon" />
                Clinic Longitude (x) *
              </label>
              <div className="input-wrapper">
                <MapPin className="input-icon" />
                <input
                  id="x"
                  name="x"
                  type="text"
                  readOnly
                  value={formik.values.x}
                  className={`readonly-input ${formik.touched.x && formik.errors.x ? 'error' : ''}`}
                  placeholder="Select location from map"
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
          </div>

          <ClinicLocationPickerModal
            isOpen={isLocationPickerOpen}
            initialLatitude={formik.values.y ? parseFloat(formik.values.y) : undefined}
            initialLongitude={formik.values.x ? parseFloat(formik.values.x) : undefined}
            onChange={(latitude, longitude) => {
              // Update form values in real-time as map cursor changes
              formik.setFieldValue('y', latitude.toString());
              formik.setFieldValue('x', longitude.toString());
              formik.setFieldTouched('y', true, false);
              formik.setFieldTouched('x', true, false);
            }}
            onConfirm={(latitude, longitude) => {
              formik.setFieldValue('y', latitude.toString());
              formik.setFieldValue('x', longitude.toString());
              formik.setFieldTouched('y', true, false);
              formik.setFieldTouched('x', true, false);
              setIsLocationPickerOpen(false);
            }}
            onCancel={() => setIsLocationPickerOpen(false)}
          />

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


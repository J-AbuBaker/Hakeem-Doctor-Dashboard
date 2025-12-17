import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import { AuthService } from '../../features/auth';
import { getErrorMessage } from '../../shared/utils/error/handlers';
import { Mail, Loader2, ArrowLeft, AlertCircle, CheckCircle2, KeyRound, Lock } from 'lucide-react';
import './AuthShared.css';
import './AuthForms.css';

const ForgotPasswordForm: React.FC = () => {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string>('');

  /**
   * Masks email address for privacy (e.g., j***@hospital.org)
   */
  const maskEmail = (email: string): string => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = localPart.length > 1
      ? `${localPart.charAt(0)}${'*'.repeat(Math.min(localPart.length - 1, 3))}`
      : localPart;
    return `${maskedLocal}@${domain}`;
  };

  const validationSchema = Yup.object({
    username: Yup.string()
      .email('Please enter a valid email address')
      .required('Email address is required'),
  });

  const formik = useFormik({
    initialValues: {
      username: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);
      try {
        await AuthService.forgotPassword(values);
        setUserEmail(values.username);
        setSuccess(true);
      } catch (err: unknown) {
        // Professional error messages for better UX
        let errorMessage = getErrorMessage(err);

        // Format network errors for better readability
        if (errorMessage.includes('Network Error') || errorMessage.includes('ERR_NETWORK')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
          errorMessage = 'No account found with this email address. Please check your email and try again.';
        } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
          errorMessage = 'A server error occurred. Please try again in a few moments.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          errorMessage = 'The request took too long. Please check your connection and try again.';
        }

        setError(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card email-verification-card">
          {/* Progress Indicators */}
          <div className="verification-progress">
            <div className="progress-step completed">
              <div className="progress-step-circle completed">
                <CheckCircle2 size={16} />
              </div>
              <span className="progress-step-label">Enter Email</span>
            </div>
            <div className="progress-step-line completed"></div>
            <div className="progress-step active">
              <div className="progress-step-circle active">
                <span>2</span>
              </div>
              <span className="progress-step-label">Verify Email</span>
            </div>
            <div className="progress-step-line"></div>
            <div className="progress-step">
              <div className="progress-step-circle">
                <span>3</span>
              </div>
              <span className="progress-step-label">Reset Password</span>
            </div>
          </div>

          <div className="email-verification-content">
            <div className="email-verification-icon-wrapper">
              <div className="email-icon-circle">
                <Mail size={48} className="email-icon" />
                <CheckCircle2 size={24} className="email-check-icon" />
              </div>
            </div>

            <h1>Check Your Email</h1>

            <div className="email-verification-text">
              <p>We sent a 6-digit code to</p>
              <p className="email-address">{maskEmail(userEmail)}</p>
              <p>Enter it below to verify.</p>
            </div>

            <div className="email-verification-actions">
              <Link
                to="/reset-password"
                state={{ email: userEmail }}
                className="btn btn-primary btn-full success-button"
              >
                Continue to Reset Password
              </Link>
              <div className="email-verification-footer">
                <Link to="/login" className="back-link">
                  <ArrowLeft size={16} />
                  Back to Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper forgot-password-icon-wrapper">
            <KeyRound className="auth-icon refresh-icon" />
            <Lock className="auth-icon lock-icon" />
          </div>
          <h1>Forgot Password?</h1>
          <p>Don't worry, we'll help you reset it. Enter the email associated with your account.</p>
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

        <form onSubmit={formik.handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="username">
              <Mail className="label-icon" />
              Email Address
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
                placeholder="name@hospital.org"
                autoComplete="email"
              />
            </div>
            {formik.touched.username && formik.errors.username && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={16} />
                {formik.errors.username}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="spinner" />
                Sending Reset Code...
              </>
            ) : (
              <>
                <Mail size={20} />
                Send Reset Code
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
          <p>
            Remember your password? <Link to="/login">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;


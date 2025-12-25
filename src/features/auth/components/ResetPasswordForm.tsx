import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthService } from '@features/auth';
import { KeyRound, Loader2, CheckCircle, User, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Mail } from 'lucide-react';
import { LocationState } from '@shared/types/common/errors';
import { getErrorMessage, getErrorStatus } from '@shared/utils/error/handlers';
import './AuthShared.css';
import './AuthForms.css';

const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const codeInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = React.useState(120); // 2 minutes in seconds
  const [isResending, setIsResending] = React.useState(false);
  const [resendSuccess, setResendSuccess] = React.useState(false);

  // Get email from location state if available
  const emailFromState = (location.state as LocationState)?.email || '';

  const validationSchema = Yup.object({
    username: Yup.string()
      .email('Please enter a valid email address')
      .required('Email address is required'),
    code: Yup.string()
      .length(6, 'Reset code must be exactly 6 characters')
      .matches(/^[A-Za-z0-9]+$/, 'Reset code can only contain letters and numbers')
      .required('Reset code is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters long')
      .matches(/[A-Z]/, 'Password must include at least one uppercase letter')
      .matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, 'Password must include at least one special character (!@#$%^&*...)')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password')], 'Passwords do not match. Please ensure both passwords are identical')
      .required('Please confirm your password'),
  });

  const formik = useFormik({
    initialValues: {
      username: emailFromState,
      code: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      setError(null);
      try {
        await AuthService.resetPassword({
          username: values.username,
          code: values.code,
          password: values.password,
        });
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } catch (err: unknown) {
        // Professional error messages for better UX
        let errorMessage = getErrorMessage(err);
        const status = getErrorStatus(err);

        // Clean up error message if it contains pipe separators
        errorMessage = errorMessage.split('|')[0].trim();

        // Format specific error messages for better readability
        // Priority: Check status 200 error messages first, then status codes

        // Handle status 200 error messages (priority 1)
        if (status === 200 ||
          errorMessage.toLowerCase().includes('not been changed') ||
          errorMessage.toLowerCase().includes('isn\'t valid') ||
          errorMessage.toLowerCase().includes('invalid code') ||
          errorMessage.toLowerCase().includes('code isn\'t valid')) {
          errorMessage = 'The reset code you entered is incorrect or has expired. Please check your email and try again.';
        }
        // Handle status 400 Bad Request (priority 2)
        else if (status === 400) {
          const lowerMessage = errorMessage.toLowerCase();
          if (lowerMessage.includes('invalid verification code') ||
            lowerMessage.includes('expired code') ||
            lowerMessage.includes('invalid code') ||
            lowerMessage.includes('verification code')) {
            errorMessage = 'Invalid verification code or expired code. Please request a new code and try again.';
          } else {
            errorMessage = 'Invalid request. Please check all fields and ensure your information is correct.';
          }
        }
        // Handle other errors
        else if (errorMessage.includes('Network Error') || errorMessage.includes('ERR_NETWORK')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (status === 404 || errorMessage.includes('Not Found')) {
          errorMessage = 'No account found with this email address. Please check your email and try again.';
        } else if (status === 500 || errorMessage.includes('Internal Server Error')) {
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

  // Sync codeDigits with formik code value
  React.useEffect(() => {
    const codeArray = formik.values.code.split('').slice(0, 6);
    const newDigits = [...codeArray, ...Array(6 - codeArray.length).fill('')];
    setCodeDigits(newDigits);
  }, [formik.values.code]);

  /**
   * Updates formik code value when verification code digits change
   */
  const updateCodeValue = (digits: string[]) => {
    const codeValue = digits.join('');
    formik.setFieldValue('code', codeValue);
  };

  const handleCodeDigitChange = (index: number, value: string) => {
    // Only allow alphanumeric characters (letters and numbers)
    // Take only the first character if multiple are entered
    const firstChar = value.charAt(0);

    if (firstChar && !/^[A-Za-z0-9]$/.test(firstChar)) {
      return;
    }

    const newDigits = [...codeDigits];
    newDigits[index] = firstChar;
    setCodeDigits(newDigits);
    updateCodeValue(newDigits);

    // Auto-advance to next input
    if (firstChar && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      // Move to previous input and clear it
      codeInputRefs.current[index - 1]?.focus();
      const newDigits = [...codeDigits];
      newDigits[index - 1] = '';
      setCodeDigits(newDigits);
      updateCodeValue(newDigits);
    } else if (e.key === 'ArrowLeft' && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    // Only allow alphanumeric characters
    if (/^[A-Za-z0-9]+$/.test(pastedData)) {
      const digits = pastedData.slice(0, 6).split('');
      const newDigits = [...digits, ...Array(6 - digits.length).fill('')];
      setCodeDigits(newDigits);
      updateCodeValue(newDigits);

      // Focus the next empty input or the last one
      const nextIndex = Math.min(digits.length, 5);
      codeInputRefs.current[nextIndex]?.focus();
    }
  };

  // Countdown timer effect
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdown]);

  // Format countdown as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Check password requirements dynamically
  const checkPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };
  };

  const passwordRequirements = checkPasswordRequirements(formik.values.password);

  // Handle resend code
  const handleResendCode = async () => {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      await AuthService.forgotPassword({ username: formik.values.username });
      setResendSuccess(true);
      setCountdown(120); // Reset timer to 2 minutes

      // Clear success message after 3 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      // Professional error messages for better UX
      let errorMessage = getErrorMessage(err) || 'Unable to send reset code. Please check your email address and try again.';

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
      setIsResending(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <CheckCircle className="auth-icon success" />
            <h1>Password Reset Successful</h1>
            <p>Your password has been reset. Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <KeyRound className="auth-icon" />
          </div>
          <h1>Reset Password</h1>
          <p>Enter your username, reset code, and create a new secure password</p>
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
              <User className="label-icon" />
              Username
            </label>
            <div className="input-wrapper">
              <User className="input-icon" />
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
            </div>
            {formik.touched.username && formik.errors.username && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={16} />
                {formik.errors.username}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="code">
              <KeyRound className="label-icon" />
              Reset Code
            </label>
            <div className="code-input-container">
              {codeDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (codeInputRefs.current[index] = el)}
                  type="text"
                  inputMode="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeDigitKeyDown(index, e)}
                  onPaste={handleCodePaste}
                  onFocus={(e) => e.target.select()}
                  onInput={(e) => {
                    // Ensure only one character is entered
                    const target = e.target as HTMLInputElement;
                    if (target.value.length > 1) {
                      target.value = target.value.charAt(0);
                      handleCodeDigitChange(index, target.value);
                    }
                  }}
                  className={`code-digit-input ${formik.touched.code && formik.errors.code ? 'error' : ''}`}
                  autoComplete="off"
                  aria-label={`Character ${index + 1} of 6`}
                />
              ))}
            </div>
            {formik.touched.code && formik.errors.code && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={16} />
                {formik.errors.code}
              </div>
            )}
            <div className="resend-code-container">
              {resendSuccess && (
                <div className="resend-success-message">
                  <CheckCircle2 size={16} />
                  Reset code sent successfully! Please check your email.
                </div>
              )}
              <div className="resend-code-wrapper">
                {countdown > 0 ? (
                  <span className="countdown-timer">
                    Resend code in {formatTime(countdown)}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isResending || !formik.values.username}
                    className="resend-code-button"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="spinner" size={16} />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail size={16} />
                        Resend Code
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Create New Password Header */}
          <div className="create-password-header">
            <div className="create-password-icon-wrapper">
              <Lock className="create-password-icon" />
            </div>
            <h2 className="create-password-title">
              <span>Create New</span>
              <span>Password</span>
            </h2>
            <p className="create-password-description">
              Your new password must be different from previously used passwords.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock className="label-icon" />
              New Password
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
                placeholder="Enter new password"
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
            {formik.values.password && (
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
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Lock className="label-icon" />
              Confirm Password
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
                placeholder="Confirm new password"
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

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="spinner" />
                Resetting Password...
              </>
            ) : (
              <>
                <KeyRound size={20} />
                Reset Password
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;


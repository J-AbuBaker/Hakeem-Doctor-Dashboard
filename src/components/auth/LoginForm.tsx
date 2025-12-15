import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Loader2, Eye, EyeOff, Mail, Lock, Shield, AlertCircle } from 'lucide-react';
import { getErrorMessage, getErrorResponseData, getErrorStatus } from '../../utils/errorUtils';
import './AuthShared.css';
import './AuthForms.css';

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const validationSchema = Yup.object({
    username: Yup.string()
      .email('Please enter a valid email address')
      .required('Email address is required'),
    password: Yup.string().required('Password is required'),
  });

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values: { username: string; password: string }) => {
      setIsSubmitting(true);
      setError(null);
      try {
        await login(values.username, values.password);
        navigate('/dashboard');
      } catch (err: unknown) {
        // Professional error messages for better UX
        let errorMessage = getErrorMessage(err);
        const status = getErrorStatus(err);

        // Format network errors for better readability
        if (errorMessage.includes('Network Error') || errorMessage.includes('ERR_NETWORK')) {
          errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (status === 401 || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (status === 403 || errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          errorMessage = 'Access denied. Please contact your administrator if you believe this is an error.';
        } else if (status === 500 || errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
          errorMessage = 'A server error occurred. Please try again in a few moments. If the problem persists, contact support.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
          errorMessage = 'The request took too long to complete. Please check your connection and try again.';
        }

        setError(errorMessage);
        if (import.meta.env.DEV) {
          console.error('Login Error Details:', {
            message: errorMessage,
            response: getErrorResponseData(err),
            status,
            error: err,
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <Shield className="auth-icon" />
          </div>
          <h1>Doctor Login</h1>
          <p>Welcome back! Please sign in to access your dashboard</p>
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
              Email
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
            </div>
            {formik.touched.username && formik.errors.username && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={16} />
                {formik.errors.username}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock className="label-icon" />
              Password
            </label>
            <div className="input-wrapper password-wrapper">
              <Lock className="input-icon" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
                className={formik.touched.password && formik.errors.password ? 'error' : ''}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <div className="field-error">
                <AlertCircle className="error-icon" size={16} />
                {formik.errors.password}
              </div>
            )}
          </div>

          <div className="form-options">
            <Link to="/forgot-password" className="forgot-link">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="spinner" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/signup">Sign up here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;


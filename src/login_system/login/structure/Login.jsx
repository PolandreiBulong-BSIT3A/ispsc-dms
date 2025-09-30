import React, { useState, useEffect } from "react";
import {
  Container, Form, Button, FloatingLabel, Card, Image, Row, Col, Navbar, Modal, Nav, Alert
} from "react-bootstrap";
import { Eye, EyeSlash, ExclamationTriangleFill } from "react-bootstrap-icons";
import { FaTools, FaEnvelope, FaPhone } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../../contexts/UserContext.jsx';
import Logo from "../../../assets/logos/logo.png";
import LanImage from "../../../assets/logos/lan.png";
import LoginBackgroundImage from "../../../assets/backgrounds/smallbanner.png";
import SignupBackgroundImage from "../../../assets/backgrounds/banner.png";
import { buildUrl } from '../../../lib/api/frontend/client.js';
import { googleAuth } from '../../../lib/api/frontend/google.api.js';
import '../css/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleLoginSuccess } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    firstname: "",
    lastname: "",
    department: "",
    contactNumber: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [formTransition, setFormTransition] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [adminBypass, setAdminBypass] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(false);
  const [maintenanceEndTime, setMaintenanceEndTime] = useState(null);
  const [maintenanceStartTime, setMaintenanceStartTime] = useState(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState(null);
  const [etaText, setEtaText] = useState('');
  const [windowText, setWindowText] = useState('');

  // Handle Google OAuth callback and maintenance errors
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const userParam = urlParams.get('user');
    const errorParam = urlParams.get('error');

    if (userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        
        // Handle Google login success
        handleLoginSuccess(userData, null, rememberMe); // Google users don't get JWT tokens initially
        if (userData?.isNewGoogleUser) {
          setAuthSuccess('Welcome! Your Google account has been created. Redirecting to dashboard...');
        } else {
          setAuthSuccess('Google login successful! Redirecting to dashboard...');
        }
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setAuthError('Error processing login data. Please try again.');
      }
    } else if (errorParam) {
      let errorMessage = 'Google login failed. Please try again.';
      switch (errorParam) {
        case 'oauth_failed':
          errorMessage = 'Google OAuth authentication failed. Please try again.';
          break;
        case 'no_user':
          errorMessage = 'No user data received from Google. Please try again.';
          break;
        case 'oauth_error':
          errorMessage = 'An error occurred during Google authentication. Please try again.';
          break;
        case 'account_deleted':
          errorMessage = 'This account has been deleted and cannot be accessed. Please contact an administrator if you believe this is an error.';
          break;
        case 'maintenance_mode':
          errorMessage = 'The system is currently under maintenance. Only administrators can sign in.';
          break;
      }
      setAuthError(errorMessage);
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.search, navigate, handleLoginSuccess]);

  // Fetch departments from database on component mount
  useEffect(() => {
    loadDepartments();
  }, []);

  // Fetch maintenance status (reusable)
  const fetchMaintenanceStatus = async () => {
    setCheckingMaintenance(true);
    try {
      const res = await fetch(buildUrl('maintenance/status'));
      if (res.ok) {
        const data = await res.json();
        const on = !!data.maintenanceMode;
        setMaintenanceMode(on);
        setMaintenanceStartTime(data.maintenanceStartTime || null);
        setMaintenanceEndTime(data.maintenanceEndTime || null);
        setMaintenanceMessage(data.maintenanceMessage || null);
        if (!on) setAdminBypass(false);
      }
    } catch (e) {
      // ignore network errors
    } finally {
      setCheckingMaintenance(false);
    }
  };

  // Poll maintenance status on mount and every 60s; refresh on tab focus
  useEffect(() => {
    fetchMaintenanceStatus();
    const id = setInterval(fetchMaintenanceStatus, 60000);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchMaintenanceStatus();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Derive ETA text from maintenanceEndTime
  useEffect(() => {
    let timerId;
    const formatETA = (ms) => {
      if (ms <= 0) return 'almost ready';
      const totalSeconds = Math.floor(ms / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      if (days > 0) {
        return `${days}d ${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
      }
      return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    };

    const tick = () => {
      if (!maintenanceEndTime) { setEtaText(''); return; }
      const end = new Date(maintenanceEndTime).getTime();
      const now = Date.now();
      setEtaText(formatETA(end - now));
    };

    tick();
    timerId = setInterval(tick, 1000);
    return () => clearInterval(timerId);
  }, [maintenanceEndTime]);

  // Derive maintenance window display text
  useEffect(() => {
    const fmt = (iso) => {
      if (!iso) return null;
      const d = new Date(iso);
      if (isNaN(d.getTime())) return null;
      const opts = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
      return d.toLocaleString(undefined, opts);
    };
    const start = fmt(maintenanceStartTime);
    const end = fmt(maintenanceEndTime);
    if (start && end) setWindowText(`Maintenance window: ${start} → ${end}`);
    else if (end) setWindowText(`Maintenance ends at: ${end}`);
    else if (start) setWindowText(`Maintenance starts at: ${start}`);
    else setWindowText('');
  }, [maintenanceStartTime, maintenanceEndTime]);

  // Load remembered email and remember me state
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('userEmail');
    const rememberMeState = localStorage.getItem('rememberMe');
    
    if (rememberedEmail && rememberMeState === 'true') {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  const loadDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const depts = await fetchDepartments();
      setDepartments(depts);
    } catch (error) {
      console.error('Error loading departments:', error);
      // Use fallback departments if API fails
      setDepartments(getFallbackDepartments());
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRememberMeChange = (checked) => {
    setRememberMe(checked);
    
    // If unchecking remember me, clear stored email
    if (!checked) {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('rememberMe');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin && currentStep < 3) {
      // Move to next step if not on final step
      handleNextStep();
      return;
    }
    
    // Signup submit at step 3 -> trigger backend and move to verification (step 4)
    if (!isLogin && currentStep === 3) {
      setLoading(true);
      setAuthError("");
      try {
        await signup({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          firstname: formData.firstname,
          lastname: formData.lastname,
          department: formData.department,
          contactNumber: formData.contactNumber
        });
        setCurrentStep(4);
        setAuthSuccess('Account created successfully! Please check your email for verification.');
      } catch (error) {
        setAuthError(error.message || 'Signup failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Handle regular login
    if (isLogin) {
      setLoading(true);
      setAuthError("");
      try {
        const response = await fetch(buildUrl('login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ 
            email: formData.email, 
            password: formData.password 
          })
        });
        let data = null;
        try { data = await response.json(); } catch {}
        if (!response.ok) {
          if (response.status === 503 && data && data.code === 'MAINTENANCE_MODE') {
            setAuthError('The system is currently under maintenance. Only administrators can sign in.');
          } else {
            setAuthError((data && data.message) || 'Login failed');
          }
          setLoading(false);
          return;
        }

        if (data.success) {
          // Handle successful login with JWT tokens
          handleLoginSuccess(data.user, data.tokens, rememberMe);
          setAuthSuccess('Login successful! Redirecting to dashboard...');
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          // Handle specific error codes
          if (data.code === 'ACCOUNT_DELETED') {
            setAuthError('This account has been deleted and cannot be accessed. Please contact an administrator if you believe this is an error.');
          } else {
            setAuthError(data.message || 'Login failed. Please try again.');
          }
        }
      } catch (error) {
        setAuthError(error.message || 'Login failed. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }
    
    setOtpLoading(true);
    setAuthError("");
    try {
      await verifyOtp({ email: formData.email, code: verificationCode });
      setAuthSuccess('Email verified successfully! You can now sign in.');
      
      // Switch to login mode after a delay
      setTimeout(() => {
        setIsLogin(true);
        setCurrentStep(1);
        setFormData({
          email: formData.email, // Keep email for convenience
          password: "",
          username: "",
          firstname: "",
          lastname: "",
          department: "",
          contactNumber: "",
        });
        setVerificationCode("");
        setAuthSuccess("");
      }, 3000);
    } catch (error) {
      setAuthError(error.message || 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setAuthError("");
    try {
      await resendOtp({ email: formData.email });
      setAuthSuccess('Verification code resent successfully. Please check your email.');
    } catch (error) {
      setAuthError(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // Forgot Password Functions
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      setAuthError('Please enter your email address.');
      return;
    }

    setForgotPasswordLoading(true);
    setAuthError("");
    try {
      await forgotPassword({ email: forgotPasswordEmail });
      setForgotPasswordStep(2);
      setAuthSuccess('Password reset code sent successfully! Please check your email.');
    } catch (error) {
      setAuthError(error.message || 'Failed to send reset code. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleVerifyForgotPasswordOtp = async () => {
    if (!forgotPasswordOtp) {
      setAuthError('Please enter the 6-digit verification code.');
      return;
    }

    setForgotPasswordLoading(true);
    setAuthError("");
    try {
      await verifyForgotPasswordOtp({ 
        email: forgotPasswordEmail, 
        code: forgotPasswordOtp 
      });
      setForgotPasswordStep(3);
      setAuthSuccess('Code verified successfully! Please enter your new password.');
    } catch (error) {
      setAuthError(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setAuthError('Please enter both password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setForgotPasswordLoading(true);
    setAuthError("");
    try {
      await updatePassword({ 
        email: forgotPasswordEmail,
        code: forgotPasswordOtp,
        newPassword: newPassword
      });
      setAuthSuccess('Password updated successfully! You can now sign in with your new password.');
      
      // Reset forgot password state and go back to login
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotPasswordStep(1);
        setForgotPasswordEmail("");
        setForgotPasswordOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setAuthSuccess("");
      }, 3000);
    } catch (error) {
      setAuthError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResendForgotPasswordOtp = async () => {
    setForgotPasswordLoading(true);
    setAuthError("");
    try {
      await forgotPassword({ email: forgotPasswordEmail });
      setAuthSuccess('Password reset code resent successfully! Please check your email.');
    } catch (error) {
      setAuthError(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    googleAuth();
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: // Basic info step
        return formData.firstname && formData.lastname && formData.username;
      case 2: // Contact info step
        return formData.department && formData.contactNumber && formData.email;
      case 3: // Login info step
        return formData.password && formData.password.length >= 8;
      default:
        return false;
    }
  };

  const renderProgressIndicator = () => {
    if (isLogin && !showForgotPassword) return null;
    
    let steps = [];
    if (showForgotPassword) {
      steps = [
        { number: 1, title: "Enter Email" },
        { number: 2, title: "Verify Code" },
        { number: 3, title: "New Password" }
      ];
    } else {
      steps = [
        { number: 1, title: "Basic Info" },
        { number: 2, title: "Contact Info" },
        { number: 3, title: "Login Info" },
        { number: 4, title: "Verification" }
      ];
    }

    const currentStepNumber = showForgotPassword ? forgotPasswordStep : currentStep;
    const totalSteps = steps.length;

    return (
      <div className="mb-4">
        <div className="progress-steps">
          {steps.map((step, index) => (
            <div key={step.number} className="progress-step">
              <div 
                className={`progress-circle ${
                  currentStepNumber >= step.number 
                    ? 'active' 
                    : 'inactive'
                }`}
              >
                {step.number}
              </div>
              <div 
                className={`progress-step-title ${
                  currentStepNumber >= step.number ? 'active' : 'inactive'
                }`}
              >
                {step.title}
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress bar */}
        <div className="progress progress-bar-custom">
          <div 
            className="progress-bar" 
            style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderForgotPasswordStep = () => {
    switch (forgotPasswordStep) {
      case 1:
        return (
          <div className="forgot-password-step">
            <h4 className="step-header">
              <div className="step-number">1</div>
              Enter Email
            </h4>
            <p className="text-muted small mb-4">Enter your email address to receive a password reset code.</p>

            <FloatingLabel label="Email" className="mb-4">
              <Form.Control
                type="email"
                placeholder="Enter your email"
                className="form-control-custom py-3"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
            </FloatingLabel>

            <div className="forgot-password-buttons">
              <Button
                type="button"
                variant="outline-secondary"
                className="btn-outline-custom px-4 py-2"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordStep(1);
                  setForgotPasswordEmail("");
                  setAuthError("");
                  setAuthSuccess("");
                }}
              >
                <span className="d-none d-sm-inline">Back to Login</span>
                <span className="d-sm-none">Back</span>
              </Button>
              <Button
                type="button"
                className="btn-primary-custom px-4 py-2"
                onClick={handleForgotPassword}
                disabled={!forgotPasswordEmail || forgotPasswordLoading}
              >
                {forgotPasswordLoading ? 'Sending...' : (
                  <>
                    <span className="d-none d-sm-inline">Send Reset Code</span>
                    <span className="d-sm-none">Send Code</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="forgot-password-step">
            <h4 className="step-header">
              <div className="step-number">2</div>
              Verify Code
            </h4>
            <p className="text-muted small mb-4">We sent a 6-digit verification code to {forgotPasswordEmail}. Enter it below to verify your account.</p>

            <FloatingLabel label="6-digit code" className="mb-4">
              <Form.Control
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="form-control-custom py-3 text-center"
                style={{ letterSpacing: "0.3em" }}
                value={forgotPasswordOtp}
                onChange={(e) => setForgotPasswordOtp(e.target.value.replace(/\D/g, ''))}
              />
            </FloatingLabel>

            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 forgot-password-buttons">
              <Button
                type="button"
                variant="outline-secondary"
                className="btn-outline-custom px-4 py-2"
                onClick={() => setForgotPasswordStep(1)}
              >
                Back
              </Button>
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  type="button"
                  className="btn-outline-custom px-4 py-2 me-2"
                  disabled={forgotPasswordLoading}
                  onClick={handleResendForgotPasswordOtp}
                >
                  {forgotPasswordLoading ? 'Resending...' : (
                    <>
                      <span className="d-none d-sm-inline">Resend Code</span>
                      <span className="d-sm-none">Resend</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  className="btn-primary-custom px-4 py-2"
                  disabled={forgotPasswordLoading || forgotPasswordOtp.length !== 6}
                  onClick={handleVerifyForgotPasswordOtp}
                >
                  {forgotPasswordLoading ? 'Verifying...' : (
                    <>
                      <span className="d-none d-sm-inline">Verify Code</span>
                      <span className="d-sm-none">Verify</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="forgot-password-step">
            <h4 className="step-header">
              <div className="step-number">3</div>
              New Password
            </h4>
            <p className="text-muted small mb-4">Enter your new password below.</p>

            <FloatingLabel label="New Password" className="mb-4 position-relative">
              <Form.Control
                type={showNewPassword ? "text" : "password"}
                placeholder="**********"
                className="form-control-custom py-3 pe-5"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="link"
                className="password-toggle"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </Button>
            </FloatingLabel>

            <FloatingLabel label="Confirm New Password" className="mb-4 position-relative">
              <Form.Control
                type={showConfirmPassword ? "text" : "password"}
                placeholder="**********"
                className="form-control-custom py-3 pe-5"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="link"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </Button>
            </FloatingLabel>

            <div className="forgot-password-buttons mb-4">
              <Button
                type="button"
                variant="outline-secondary"
                className="btn-outline-custom px-4 py-2"
                onClick={() => setForgotPasswordStep(2)}
              >
                Back
              </Button>
              <Button
                type="button"
                className="btn-primary-custom px-4 py-2"
                disabled={forgotPasswordLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                onClick={handleUpdatePassword}
              >
                {forgotPasswordLoading ? 'Updating...' : (
                  <>
                    <span className="d-none d-sm-inline">Update Password</span>
                    <span className="d-sm-none">Update</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderSignupStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h4 className="step-header">
              <div className="step-number">1</div>
              Basic Info
            </h4>
            {/* Google Sign-Up at Step 1 */}
            <div className="mb-4">
              <Button 
                variant="outline-secondary" 
                className="w-100 py-3 google-btn btn-outline-custom" 
                onClick={handleGoogleSignup}
              >
                <FcGoogle size={20} style={{ marginRight: 8 }} />
                <span className="d-none d-sm-inline">Create account with Google</span>
                <span className="d-sm-none">Sign up with Google</span>
              </Button>
              <p className="text-muted small text-center mt-2">
                Google will share your name, email, and profile picture
              </p>
            </div>

            {/* Divider */}
            <div className="divider">
              <div className="divider-line">
                <span className="divider-text">or continue with email</span>
              </div>
            </div>

            <Row className="mb-3 g-2">
              <Col xs={12} sm={6}>
                <FloatingLabel label="First name" className="mb-3">
                  <Form.Control
                    type="text"
                    name="firstname"
                    placeholder="Enter first name"
                    className="form-control-custom py-3"
                    onChange={e => handleFieldChange('firstname', e.target.value)}
                    value={formData.firstname}
                    required
                  />
                </FloatingLabel>
              </Col>
              <Col xs={12} sm={6}>
                <FloatingLabel label="Last name" className="mb-3">
                  <Form.Control
                    type="text"
                    name="lastname"
                    placeholder="Enter last name"
                    className="form-control-custom py-3"
                    onChange={e => handleFieldChange('lastname', e.target.value)}
                    value={formData.lastname}
                    required
                  />
                </FloatingLabel>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col xs={12}>
                <FloatingLabel label="Username" className="mb-3">
                  <Form.Control
                    type="text"
                    name="username"
                    placeholder="Enter username"
                    className="form-control-custom py-3"
                    onChange={e => handleFieldChange('username', e.target.value)}
                    value={formData.username}
                    required
                  />
                </FloatingLabel>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-end">
              <Button
                type="button"
                className="btn-primary-custom px-4 py-2"
                onClick={handleNextStep}
                disabled={!canProceedToNext()}
              >
                Next
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h4 className="step-header">
              <div className="step-number">2</div>
              Contact Info
            </h4>
        
            <Row className="mb-3 g-2">
              <Col xs={12} sm={6}>
                <FloatingLabel label="Department" className="mb-3">
                  <Form.Select
                    name="department"
                    className="form-control-custom py-3"
                    onChange={e => handleFieldChange('department', e.target.value)}
                    value={formData.department}
                    required
                    disabled={departmentsLoading}
                  >
                    <option value="">
                      {departmentsLoading ? 'Loading...' : 'Select Department'}
                    </option>
                    {departments.map(dept => (
                      <option key={dept.value} value={dept.value}>{dept.label}</option>
                    ))}
                  </Form.Select>
                </FloatingLabel>
              </Col>
              <Col xs={12} sm={6}>
                <FloatingLabel label="Contact Number" className="mb-3">
                  <Form.Control
                    type="tel"
                    name="contactNumber"
                    placeholder="Enter contact number"
                    className="form-control-custom py-3"
                    onChange={e => handleFieldChange('contactNumber', e.target.value)}
                    value={formData.contactNumber}
                    required
                  />
                </FloatingLabel>
              </Col>
            </Row>
            
            <Row className="mb-4">
              <Col xs={12}>
                <FloatingLabel label="Email" className="mb-3">
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    className="form-control-custom py-3"
                    onChange={e => handleFieldChange('email', e.target.value)}
                    value={formData.email}
                    required
                  />
                </FloatingLabel>
              </Col>
            </Row>
            
            <div className="d-flex justify-content-between flex-wrap gap-2">
              <Button
                type="button"
                variant="outline-secondary"
                className="btn-outline-custom px-4 py-2"
                onClick={handlePrevStep}
              >
                Back
              </Button>
              <Button
                type="button"
                className="btn-primary-custom px-4 py-2"
                onClick={handleNextStep}
                disabled={!canProceedToNext()}
              >
                Next
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h4 className="step-header">
              <div className="step-number">3</div>
              Login Info
            </h4>
            
            <p className="text-muted small mb-4">*All fields required unless noted.</p>
            
            <FloatingLabel label="Password" className="mb-4 position-relative">
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="**********"
                className="form-control-custom py-3 pe-5"
                onChange={e => handleFieldChange('password', e.target.value)}
                value={formData.password}
                required
              />
              <Button
                type="button"
                variant="link"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
              </Button>
            </FloatingLabel>
            
            {/* Privacy Policy and Terms & Conditions */}
            <Form.Check
              type="checkbox"
              label={
                <span className="form-check-custom">
                  I agree to the{' '}
                  <Button
                    variant="link"
                    className="link-custom p-0"
                    onClick={() => alert('Terms & Conditions to be implemented')}
                  >
                    Terms and Conditions
                  </Button>
                  <span style={{ margin: "0 8px" }}>|</span>
                  <Button
                    variant="link"
                    className="link-custom p-0"
                    onClick={() => alert('Privacy Policy to be implemented')}
                  >
                    Privacy Policy
                  </Button>
                </span>
              }
              required
              className="mb-4"
            />
            
            <div className="d-flex justify-content-between flex-wrap gap-2 mb-4">
              <Button
                type="button"
                variant="outline-secondary"
                className="btn-outline-custom px-4 py-2"
                onClick={handlePrevStep}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="btn-primary-custom px-4 py-2"
                disabled={!canProceedToNext() || loading}
              >
                {loading ? 'Creating Account...' : 'Continue to Verification'}
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h4 className="step-header">
              <div className="step-number">4</div>
              Verification
            </h4>
            <p className="text-muted small mb-4">We sent a 6-digit verification code to {formData.email}. Enter it below to verify your account.</p>

            <FloatingLabel label="6-digit code" className="mb-4">
              <Form.Control
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className="form-control-custom py-3 text-center"
                style={{ letterSpacing: "0.3em" }}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
            </FloatingLabel>

            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <Button
                type="button"
                variant="outline-secondary"
                className="btn-outline-custom px-4 py-2"
                onClick={handlePrevStep}
              >
                Back
              </Button>
              <div className="d-flex gap-2 flex-wrap">
                <Button
                  type="button"
                  className="btn-outline-custom px-4 py-2 me-2"
                  disabled={resendLoading}
                  onClick={handleResendCode}
                >
                  {resendLoading ? 'Resending...' : 'Resend Code'}
                </Button>
                <Button
                  type="button"
                  className="btn-primary-custom px-4 py-2"
                  disabled={otpLoading || verificationCode.length !== 6}
                  onClick={handleVerifyCode}
                >
                  {otpLoading ? 'Verifying...' : 'Verify Email'}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Full-page maintenance takeover: early return
  if (maintenanceMode && !adminBypass) {
    return (
      <div className={`page-transition login-mode`}>
        <div className="maintenance-fullpage">
          <div className="maintenance-left">
            <div className="brand">
              <Image src={Logo} alt="ISPSC DMS" height={36} />
            </div>
            <div className="headline">
              <h1>
                We are <span className="accent">tidying up!</span>
              </h1>
              <p className="sub1">Sorry for the inconvenience!</p>
              <p className="sub2">Currently updating servers to improve service. Thank you for your patience!</p>
            </div>
            <div className="availability">
              {maintenanceMessage && (
                <div className="maint-msg">{maintenanceMessage}</div>
              )}
              {windowText && (
                <div className="maint-window" style={{ color: '#334155', marginTop: 6 }}>{windowText}</div>
              )}
              {maintenanceEndTime ? (
                <span>Your beloved site will be available in: <span className="eta-countdown">{etaText}</span></span>
              ) : (
                <span>Your beloved site will be available soon.</span>
              )}
            </div>
            {/* Social links removed per request */}
            <div className="contact">
              <div><FaEnvelope/> support@ispsc-dms.local</div>
              <div><FaPhone/> +63 900 000 0000</div>
            </div>
            <div className="actions">
              <Button variant="secondary" onClick={fetchMaintenanceStatus} disabled={checkingMaintenance}>
                {checkingMaintenance ? 'Checking...' : 'Refresh Status'}
              </Button>
              <Button variant="primary" onClick={() => setAdminBypass(true)}>
                Continue (Admin)
              </Button>
            </div>
          </div>
          <div className="maintenance-right">
            <div
              className="maintenance-hero has-tooltip"
              data-tooltip='If you are wondering, "Bakit my pusa dito, anong connect?" This is the developer Logo, Haha Remembrance ko nalang'
            >
              <Image src={LanImage} alt="Maintenance illustration" className="maintenance-hero-img" fluid />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-transition ${isLogin ? 'login-mode' : 'signup-mode'}`}>
      {/* White overlay for signup background */}
      {!isLogin && (
        <div className="signup-overlay"></div>
      )}
      
      {/* Form Container */}
      <div className={`form-wrapper ${!isLogin ? 'signup-mode' : ''}`}>
        <Container fluid className="form-container">
          {/* Header */}
          <div className="login-header">
            {/* ISPSc Logo - Show on mobile and tablet */}
            <div className="logo-mobile d-lg-none">
              <Image 
                src={Logo} 
                alt="ISPSc Logo" 
                className="img-fluid"
              />
            </div>
            <h1 className="login-title">
              {showForgotPassword ? "RESET PASSWORD" : isLogin ? "WELCOME BACK" : "JOIN US"}
            </h1>
            {isLogin && !showForgotPassword && (
              <p className="login-subtitle">
                Welcome back! Please enter your details.
              </p>
            )}
            {showForgotPassword && (
              <p className="login-subtitle">
                Reset your password to regain access to your account.
              </p>
            )}
          </div>

          {/* Authentication Status Messages */}
          {authError && (
            <Alert variant="danger" className="alert-custom" onClose={() => setAuthError("")} dismissible>
              <ExclamationTriangleFill className="me-2" />
              {authError}
            </Alert>
          )}
          {authSuccess && (
            <Alert variant="success" className="alert-custom">
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-custom" role="status" aria-hidden="true"></div>
                {authSuccess}
              </div>
            </Alert>
          )}

          {/* Progress Indicator for Signup */}
          {renderProgressIndicator()}

          {/* Form */}
          <Form onSubmit={handleFormSubmit}>
            <div className="form-container">
              <div className={`form-content ${formTransition}`}>
                {showForgotPassword ? (
                  // Forgot Password Form - Multi-step
                  renderForgotPasswordStep()
                ) : isLogin ? (
                  // Login Form
                  <>
                    <FloatingLabel label="Email" className="mb-4">
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        className="form-control-custom py-3"
                        onChange={e => handleFieldChange('email', e.target.value)}
                        value={formData.email}
                        required
                      />
                    </FloatingLabel>

                    <FloatingLabel label="Password" className="mb-4 position-relative">
                      <Form.Control
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="**********"
                        className="form-control-custom py-3 pe-5"
                        onChange={e => handleFieldChange('password', e.target.value)}
                        value={formData.password}
                        required
                      />
                      <Button
                        type="button"
                        variant="link"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                      </Button>
                    </FloatingLabel>

                    {/* Remember Me and Forgot Password */}
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                      <Form.Check
                        type="checkbox"
                        id="rememberMe"
                        label={
                          <span className="form-check-custom">
                            Remember me
                            {rememberMe && (
                              <span style={{ color: "#dc2626", marginLeft: "4px" }}>
                                ✓
                              </span>
                            )}
                          </span>
                        }
                        checked={rememberMe}
                        onChange={(e) => handleRememberMeChange(e.target.checked)}
                      />
                      <Button
                        variant="link"
                        className="link-custom p-0"
                        onClick={() => {
                          setShowForgotPassword(true);
                          setForgotPasswordStep(1);
                          setForgotPasswordEmail("");
                          setForgotPasswordOtp("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setAuthError("");
                          setAuthSuccess("");
                        }}
                      >
                        Forgot password?
                      </Button>
                    </div>

                    {/* Sign In Button */}
                    <Button
                      type="submit"
                      className="w-100 py-3 mb-4 btn-primary-custom"
                      disabled={loading}
                      style={{ opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Signing In...
                        </>
                      ) : (
                        "Sign in"
                      )}
                    </Button>

                    {/* 'Or' divider */}
                    <div className="divider">
                      <div className="divider-line">
                        <span className="divider-text">or</span>
                      </div>
                    </div>

                    {/* Google Sign-In Button */}
                    <Button 
                      variant="outline-secondary" 
                      className="w-100 py-3 mb-4 google-btn btn-outline-custom" 
                      onClick={handleGoogleSignup}
                    >
                      <FcGoogle size={20} style={{ marginRight: 8 }} />
                      <span className="d-none d-sm-inline">Sign in with Google</span>
                      <span className="d-sm-none">Google Sign In</span>
                    </Button>

                    {/* Switch to Signup */}
                    <div className="text-center">
                      <span style={{ color: "#64748b" }}>
                        Don't have an account?{' '}
                      </span>
                      <Button
                        variant="link"
                        className="link-custom p-0"
                        onClick={() => {
                          setFormTransition("fade-out");
                          setTimeout(() => {
                            setIsLogin(false);
                            setCurrentStep(1);
                            setFormData({
                              email: "",
                              password: "",
                              username: "",
                              firstname: "",
                              lastname: "",
                              department: "",
                              contactNumber: "",
                            });
                            setFormTransition("fade-in");
                            setTimeout(() => setFormTransition(""), 500);
                          }, 500);
                        }}
                      >
                        Sign up for free!
                      </Button>
                    </div>
                  </>
                ) : (
                  // Signup Form - Multi-step
                  renderSignupStep()
                )}
              </div>
            </div>
          </Form>

          {/* Switch back to Login (only show in signup mode) */}
          {!isLogin && (
            <div className="text-center mt-4">
              <span style={{ color: "#64748b" }}>
                Already have an account?{' '}
              </span>
              <Button
                variant="link"
                className="link-custom p-0"
                onClick={() => {
                  setFormTransition("fade-out");
                  setTimeout(() => {
                    setIsLogin(true);
                    setCurrentStep(1);
                    setFormData({
                      email: "",
                      password: "",
                      username: "",
                      firstname: "",
                      lastname: "",
                      department: "",
                      contactNumber: "",
                    });
                    setFormTransition("fade-in");
                    setTimeout(() => setFormTransition(""), 500);
                  }, 500);
                }}
              >
                Sign in
              </Button>
            </div>
          )}
        </Container>
      </div>

      {/* Right Section - Banner Background (only show in login mode) */}
      {isLogin && (
        <div 
          className="banner-section d-none d-lg-block"
          style={{
            backgroundImage: `url(${LoginBackgroundImage})`,
          }}
        >
          <div className="banner-overlay"></div>
        </div>
      )}
    </div>
  );
};

export default Login;

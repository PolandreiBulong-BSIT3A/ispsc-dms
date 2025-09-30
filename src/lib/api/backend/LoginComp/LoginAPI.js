import express from 'express';
import db from '../connections/connection.js';
import nodemailer from 'nodemailer';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import {
  loginRateLimit,
  signupRateLimit,
  otpRateLimit,
  requireAuth,
  requireAdmin,
  requireDean,
  validateLogin,
  validateSignup,
  generateTokens,
  hashPassword,
  comparePassword,
  errorHandler
} from '../middleware/authMiddleware.js';

const router = express.Router();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Configure Nodemailer via environment variables
// Defaults target Gmail SMTP if no host/port provided
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

if (!EMAIL_USER || !EMAIL_PASS) {
  const msg = 'Missing EMAIL_USER/EMAIL_PASS for Nodemailer. Set them in .env';
  if ((process.env.NODE_ENV || 'development') === 'production') {
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE, // true for 465, false for 587/STARTTLS
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Multer for profile picture upload (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ----- Auth helpers -----
const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();
const isAdminRole = (role) => {
  const r = normalizeRole(role);
  return r === 'admin' || r === 'administrator';
};
const isDeanRole = (role) => {
  const r = normalizeRole(role);
      return r === 'dean';
};

// User Registration with OTP Email Verification
router.post('/signup', signupRateLimit, validateSignup, async (req, res) => {
  const { username, firstname, lastname, email, password, department, contactNumber } = req.body;
  
  // Convert department to department_id if it's a string
  let department_id = null;
  if (department) {
    if (isNaN(department)) {
      // If department is a string (old format), try to find the department_id
      const [deptResults] = await db.promise().query(
        'SELECT department_id FROM departments WHERE code = ? OR name = ?',
        [department, department]
      );
      if (deptResults.length > 0) {
        department_id = deptResults[0].department_id;
      }
    } else {
      // If department is already a number, use it as department_id
      department_id = parseInt(department);
    }
  }
  
  try {
    // Check if user already exists
    const [existingUsers] = await db.promise().query(
      'SELECT user_id FROM dms_user WHERE user_email = ? OR Username = ?', 
      [email, username]
    );

    if (existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.user_email === email) {
        return res.status(409).json({ 
          success: false, 
          message: 'Email already registered.',
          code: 'EMAIL_EXISTS'
        });
      } else {
        return res.status(409).json({ 
          success: false, 
          message: 'Username already taken.',
          code: 'USERNAME_EXISTS'
        });
      }
    }

    // Hash password with enhanced security
    const hashedPassword = await hashPassword(password);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert new user
    const [result] = await db.promise().query(
        'INSERT INTO dms_user (user_email, password, Username, firstname, lastname, Contact_number, department_id, role, is_verified, verification_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, username, firstname, lastname, contactNumber, department_id, 'FACULTY', 'no', otp, 'pending']
    );

    // Send OTP email
          const mailOptions = {
      from: EMAIL_USER,
            to: email,
      subject: 'ISPSc DMS - Email Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Welcome to ISPSc DMS!</h2>
          <p>Hi ${firstname},</p>
          <p>Thank you for registering with ISPSc DMS. To complete your registration, please use the verification code below:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes. If you didn't request this code, please ignore this email.</p>
          <p>Best regards,<br>ISPSc DMS Team</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ 
        success: true, 
        message: 'Account created successfully! Please check your email for the verification code.',
        emailSent: true 
      });
    } catch (emailError) {
      console.error('Email send failed:', emailError);
      res.json({ 
        success: true, 
        message: 'Account created. Email sending failed; please use the code if received or request resend.',
        emailSent: false 
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration.',
      code: 'SIGNUP_ERROR'
    });
  }
});

// OTP Verification Endpoint
router.post('/verify-otp', otpRateLimit, async (req, res) => {
  const { email, code } = req.body;
  
  if (!email || !code) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and verification code are required.',
      code: 'MISSING_FIELDS'
    });
  }
  
  try {
    // Verify the user exists and the code matches
    const [results] = await db.promise().query(
      'SELECT * FROM dms_user WHERE user_email = ? AND verification_code = ? AND is_verified = ?', 
      [email, code, 'no']
    );
    
    if (results.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid verification code, email not found, or account already verified.',
        code: 'INVALID_OTP'
      });
    }
    
    // Update verification status
    await db.promise().query(
      "UPDATE dms_user SET is_verified = 'yes', verification_code = NULL WHERE user_email = ? AND is_verified = 'no'", 
      [email]
    );
    
    res.json({ 
      success: true, 
      message: 'Email verified successfully! Your account is now active and you can log in.',
      code: 'VERIFICATION_SUCCESS'
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during verification.',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// User Login with JWT tokens
router.post('/login', loginRateLimit, validateLogin, async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check maintenance mode first
    let maintenanceMode = false;
    try {
      const [maintenanceRows] = await db.promise().execute(
        'SELECT maintenance_mode FROM system_settings WHERE id = 1'
      );
      maintenanceMode = maintenanceRows.length > 0 ? maintenanceRows[0].maintenance_mode === 1 : false;
    } catch (dbError) {
      // Table doesn't exist yet, maintenance mode is off
      maintenanceMode = false;
    }
    // Find user by email
    const [results] = await db.promise().query(
      'SELECT * FROM dms_user WHERE user_email = ?', 
      [email]
    );

    if (results.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const user = results[0];

    // Check if user is deleted
    if (user.status === 'deleted') {
      return res.status(403).json({ 
        success: false, 
        message: 'This account has been deleted and cannot be accessed.',
        code: 'ACCOUNT_DELETED'
      });
    }

    // Check if user is verified
    if (user.is_verified !== 'yes') {
      return res.status(403).json({ 
        success: false, 
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }
    
    // Check if user has a password (manual signup) or not (Google signup)
    if (!user.password || user.password === '') {
      return res.status(401).json({ 
        success: false, 
        message: 'This account was created using Google Sign-In. Please use the "Sign In with Google" button to login.',
        accountType: 'google',
        code: 'GOOGLE_ACCOUNT'
      });
    }
    
    // Verify password
    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Check maintenance mode after successful authentication
    if (maintenanceMode) {
      const isAdmin = user.role && user.role.toLowerCase() === 'admin';
      if (!isAdmin) {
        return res.status(503).json({
          success: false,
          message: 'System is currently under maintenance. Only administrators can access the system.',
          maintenanceMode: true,
          code: 'MAINTENANCE_MODE'
        });
      }
    }
    
    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Create session for backward compatibility
    req.session.user = {
      user_id: user.user_id,
      user_email: user.user_email,
      Username: user.Username,
      role: user.role,
      department: user.department
    };
    
    // Set secure cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ 
      success: true, 
      message: 'Login successful!',
      user: {
        id: user.user_id,
        email: user.user_email,
        username: user.Username,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
        department: user.department,
        contactNumber: user.Contact_number,
        profilePic: user.profile_pic,
        status: user.status,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login.',
      code: 'LOGIN_ERROR'
    });
  }
});

// Token refresh endpoint
router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.cookies || req.body;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token required.',
      code: 'REFRESH_TOKEN_MISSING'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded);
    
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token.',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
});

// Get current user from session/JWT
router.get('/auth/me', requireAuth, async (req, res) => {
  try {
    const [results] = await db.promise().query(`
      SELECT u.*, d.name as department_name, d.code as department_code 
      FROM dms_user u 
      LEFT JOIN departments d ON u.department_id = d.department_id 
      WHERE u.user_id = ?
    `, [req.currentUser.id]);
      
      if (results.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.',
        code: 'USER_NOT_FOUND'
      });
      }
      
      const user = results[0];
    res.json({
        success: true,
        user: {
          id: user.user_id,
          email: user.user_email,
          username: user.Username,
          firstname: user.firstname,
          lastname: user.lastname,
          role: user.role,
          department_id: user.department_id,
          department_name: user.department_name,
          department_code: user.department_code,
          contactNumber: user.Contact_number,
          profilePic: user.profile_pic,
          status: user.status,
          isVerified: user.is_verified,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
    });
  } catch (error) {
    console.error('Error in /auth/me:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error.',
      code: 'SERVER_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  
  // Destroy session
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Could not log out.',
        code: 'LOGOUT_ERROR'
      });
    }
    res.json({ 
      success: true, 
      message: 'Logged out successfully.',
      code: 'LOGOUT_SUCCESS'
    });
  });
});

// Cancel signup and delete unverified user
router.post('/cancel-signup', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
  db.query("DELETE FROM dms_user WHERE user_email = ? AND is_verified = 'no'", [email], (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Database error.' });
    return res.json({ success: true, message: 'Account deleted.' });
  });
});

// Set password for Google users
router.post('/setup-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  
  try {
    // Check if user exists and is a Google user (no password)
    db.query('SELECT * FROM dms_user WHERE user_email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'Database error.' });
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      
      const user = results[0];
      if (user.password && user.password !== '') {
        return res.status(400).json({ success: false, message: 'This account already has a password set up.' });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Update user with password
      db.query('UPDATE dms_user SET password = ? WHERE user_email = ?', [hashedPassword, email], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error.' });
        return res.json({ success: true, message: 'Password set up successfully! You can now login manually.' });
      });
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// Resend verification code
router.post('/resend-otp', otpRateLimit, async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email is required.',
      code: 'EMAIL_REQUIRED'
    });
  }

  try {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const [result] = await db.promise().query(
      'UPDATE dms_user SET verification_code = ? WHERE user_email = ? AND (is_verified = ? OR is_verified IS NULL)', 
      [otp, email, 'no']
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not found or already verified.',
        code: 'EMAIL_NOT_FOUND'
      });
    }

    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: 'ISPSc DMS - New Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">New Verification Code</h2>
          <p>You requested a new verification code. Here it is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #dc2626; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>Best regards,<br>ISPSc DMS Team</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ 
      success: true, 
      message: 'Verification code resent successfully.',
      code: 'OTP_RESENT'
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send verification email.',
      code: 'EMAIL_SEND_ERROR'
    });
  }
});

// Get all departments
router.get('/departments', async (req, res) => {
  try {
    console.log('Fetching departments from database...');
    const [departments] = await db.promise().query(
      'SELECT department_id, name, code, is_active FROM departments WHERE is_active = 1 ORDER BY name'
    );

    console.log('Raw departments from DB:', departments);

    // Format departments for frontend select options
    const formattedDepartments = departments.map(dept => ({
      value: dept.department_id.toString(),
      label: dept.name,
      code: dept.code
    }));

    console.log('Formatted departments:', formattedDepartments);

    res.json({
      success: true,
      departments: formattedDepartments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments'
    });
  }
});

// Get specific department by ID
router.get('/departments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [departments] = await db.promise().query(
      'SELECT department_id, name, code, is_active FROM departments WHERE department_id = ? AND is_active = 1',
      [id]
    );

    if (departments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      department: departments[0]
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department'
    });
  }
});


export default router;

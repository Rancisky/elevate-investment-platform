const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Use the UUID from the database (matches the campaigns table expectation)
const DEV_ADMIN_UUID = 'abf54a70-f6b5-4bdb-9b58-afb78e967394';
const DEV_ADMIN_USER_ID = 'dev-admin-123456789';

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  // DEVELOPMENT BYPASS - Check environment variables first
  if (process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV === 'development') {
    console.log('🔓 AUTH BYPASSED: Using development admin user');
    req.user = {
      id: DEV_ADMIN_UUID,           // UUID for campaigns table foreign key
      userId: DEV_ADMIN_USER_ID,    // 20-char user_id for other uses
      username: 'dev-admin-user',
      role: 'admin',
      is_active: true,
      email: 'devadmin@dev.co',
      name: 'Dev Admin',
      directReferrals: 0,
      totalDonations: 0,
      isLoanEligible: false,
      joinDate: new Date()
    };
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required. Please login first.'
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database with all necessary fields
    let user;
    try {
      user = await User.findById(decoded.id);
    } catch (dbError) {
      console.error('Database error while finding user:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error during authentication'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please login again.'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Store both the decoded JWT data AND the full user object
    req.user = {
      id: decoded.id,           // For JWT compatibility
      userId: decoded.userId || user.user_id,   // Use user_id from Supabase
      username: decoded.username || user.username, // For username-based operations
      role: decoded.role || user.role,       // For JWT compatibility
      ...user        // Full user data from database (already a plain object)
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format. Please login again.'
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        message: 'Token not active yet. Please login again.'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: 'Authentication failed. Please login again.'
    });
  }
};

// Development/Testing middleware - bypasses auth temporarily
const authenticateTokenDev = async (req, res, next) => {
  console.log('🔓 DEV MODE: Bypassing authentication');
  
  // Create a mock admin user for development
  req.user = {
    id: DEV_ADMIN_UUID,           // UUID for campaigns table foreign key
    userId: DEV_ADMIN_USER_ID,    // 20-char user_id for other uses
    username: 'dev-admin-user',
    role: 'admin',
    is_active: true,
    email: 'devadmin@dev.co',
    name: 'Dev Admin',
    directReferrals: 0,
    totalDonations: 0,
    isLoanEligible: false,
    joinDate: new Date()
  };
  
  next();
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Check loan eligibility
const checkLoanEligibility = (req, res, next) => {
  if (!req.user.isLoanEligible) {
    return res.status(403).json({
      success: false,
      message: 'Loan eligibility requirements not met',
      requirements: {
        directReferrals: { 
          current: req.user.directReferrals, 
          required: 50 
        },
        totalDonations: { 
          current: req.user.totalDonations, 
          required: 1000000 
        }
      }
    });
  }
  next();
};

// Check if user owns resource or is admin
const requireOwnershipOrAdmin = (resourceUserField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceUserField] || req.body[resourceUserField];
    
    if (req.user.role === 'admin' || req.user.userId === resourceUserId) {
      next();
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only access your own resources'
      });
    }
  };
};

// Rate limiting middleware for sensitive operations
const rateLimitSensitive = (maxAttempts = 5, windowMinutes = 15) => {
  const attempts = new Map();
  
  return (req, res, next) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    if (!attempts.has(key)) {
      attempts.set(key, []);
    }
    
    const userAttempts = attempts.get(key);
    
    // Clean old attempts
    const recentAttempts = userAttempts.filter(time => now - time < windowMs);
    attempts.set(key, recentAttempts);
    
    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Too many attempts. Please try again in ${windowMinutes} minutes.`
      });
    }
    
    // Add current attempt
    recentAttempts.push(now);
    next();
  };
};

// Validate user status (active, verified, etc.)
const requireActiveUser = (req, res, next) => {
  if (!req.user.is_active) {
    return res.status(403).json({
      success: false,
      message: 'Account is deactivated. Please contact support.'
    });
  }
  next();
};

// Check minimum account age for certain operations
const requireAccountAge = (minDays = 30) => {
  return (req, res, next) => {
    const joinDate = new Date(req.user.joinDate);
    const accountAge = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (accountAge < minDays) {
      return res.status(403).json({
        success: false,
        message: `Account must be at least ${minDays} days old for this operation`,
        accountAge: Math.floor(accountAge),
        required: minDays
      });
    }
    next();
  };
};

// Validate referral eligibility (for creating referral links, etc.)
const requireReferralEligibility = (req, res, next) => {
  const minReferrals = 1; // Must have at least 1 referral to be eligible for certain features
  
  if (req.user.directReferrals < minReferrals) {
    return res.status(403).json({
      success: false,
      message: 'Referral eligibility requirements not met',
      requirements: {
        directReferrals: {
          current: req.user.directReferrals,
          required: minReferrals
        }
      }
    });
  }
  next();
};

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  // DEVELOPMENT BYPASS for optional auth too
  if (process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV === 'development') {
    req.user = {
      id: DEV_ADMIN_UUID,           // UUID for campaigns table foreign key
      userId: DEV_ADMIN_USER_ID,    // 20-char user_id for other uses
      username: 'dev-admin-user',
      role: 'admin',
      is_active: true,
      email: 'devadmin@dev.co',
      name: 'Dev Admin',
      directReferrals: 0,
      totalDonations: 0,
      isLoanEligible: false,
      joinDate: new Date()
    };
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    let user;
    try {
      user = await User.findById(decoded.id);
    } catch (dbError) {
      console.error('Database error in optional auth:', dbError);
      req.user = null;
      return next();
    }

    if (user && user.is_active) {
      req.user = {
        id: decoded.id,
        userId: decoded.userId || user.user_id,
        username: decoded.username || user.username,
        role: decoded.role || user.role,
        ...user
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};

// Environment-based auth selector
const getAuthMiddleware = () => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const skipAuth = process.env.SKIP_AUTH === 'true';
  
  if (isDevelopment && skipAuth) {
    console.log('🚨 WARNING: Using development auth bypass. DO NOT USE IN PRODUCTION!');
    return authenticateTokenDev;
  }
  
  return authenticateToken;
};

module.exports = {
  authenticateToken,
  authenticateTokenDev,
  requireAdmin,
  checkLoanEligibility,
  requireOwnershipOrAdmin,
  rateLimitSensitive,
  requireActiveUser,
  requireAccountAge,
  requireReferralEligibility,
  optionalAuth,
  getAuthMiddleware
};
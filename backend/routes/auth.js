const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      userId: user.user_id, 
      username: user.username,
      role: user.role 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { 
      fullName,
      name, 
      username, 
      email, 
      password, 
      phone, 
      address, 
      occupation, 
      monthlyIncome, 
      referralCode,
      referredBy,
      paymentConfirmed,
      transactionId,
      paymentDetails
    } = req.body;

    console.log('Registration attempt for:', { name: fullName || name, username, email, phone });

    // Validation
    if (!name && !fullName) {
      return res.status(400).json({ 
        success: false,
        message: 'Full name is required' 
      });
    }

    if (!username || !email || !password || !phone || !address || !occupation) {
      return res.status(400).json({ 
        success: false,
        message: 'All required fields must be filled' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }

    // Validate username format
    if (username.length < 3) {
      return res.status(400).json({ 
        success: false,
        message: 'Username must be at least 3 characters' 
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        success: false,
        message: 'Username can only contain letters, numbers, and underscores' 
      });
    }

    // Check if user already exists (email or username)
    const existingEmailUser = await User.findByEmail(email.toLowerCase());
    if (existingEmailUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    const existingUsernameUser = await User.findByUsername(username.toLowerCase());
    if (existingUsernameUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this username already exists' 
      });
    }

    // Validate referral code if provided
    let referrer = null;
    const referralCodeToUse = referralCode || referredBy;
    if (referralCodeToUse && referralCodeToUse.trim()) {
      referrer = await User.findByUsername(referralCodeToUse.trim().toLowerCase());
      if (!referrer) {
        return res.status(400).json({ 
          success: false,
          message: 'Invalid referral code' 
        });
      }
    }

    // Create new user
    const userData = {
      name: (fullName || name).trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      address: address.trim(),
      occupation: occupation.trim(),
      monthlyIncome: monthlyIncome || 0,
      referredBy: referralCodeToUse ? referralCodeToUse.trim().toLowerCase() : null
    };

    const user = await User.create(userData);
    console.log('User created successfully:', user.username);

    // Process referral commissions for all 3 levels (if payment confirmed or no payment required)
    if (referrer) {
      try {
        console.log('Processing referral commissions...');
        const commissionRates = { 1: 3000, 2: 1500, 3: 600 };
        let currentReferrer = referrer;
        let level = 1;

        while (currentReferrer && level <= 3) {
          const commission = commissionRates[level];
          
          // Add commission using the User model method
          await User.addReferralCommission(currentReferrer.id, level, commission);
          
          console.log(`Level ${level} commission (${commission}) added to ${currentReferrer.username}`);

          // Find next level referrer
          if (currentReferrer.referred_by) {
            currentReferrer = await User.findByUsername(currentReferrer.referred_by);
            level++;
          } else {
            break;
          }
        }
      } catch (referralError) {
        console.error('Referral processing failed:', referralError);
        // Don't fail registration if referral processing fails
      }
    }

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        userId: user.user_id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        occupation: user.occupation,
        monthlyIncome: user.monthly_income,
        role: user.role,
        referralCode: user.referral_code
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during registration',
      error: error.message 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user - accepts userId, username, or email
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { userId, username, email, password } = req.body;
    
    console.log('Login attempt with data:', { 
      userId, 
      username, 
      email, 
      password: password ? '[PROVIDED]' : '[MISSING]' 
    });

    // Validation
    if ((!userId && !username && !email) || !password) {
      console.log('Login failed: Missing credentials');
      return res.status(400).json({ 
        success: false,
        message: 'User ID/Username/Email and password are required' 
      });
    }

    // Find user by userId, username, or email
    let user;
    if (userId) {
      console.log('Searching by userId:', userId);
      user = await User.findByUserId(userId.trim());
    } else if (username) {
      console.log('Searching by username:', username);
      user = await User.findByUsername(username.toLowerCase().trim());
    } else {
      console.log('Searching by email:', email);
      user = await User.findByEmail(email.toLowerCase().trim());
    }

    console.log('User found:', user ? `YES (${user.username})` : 'NO');
    
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    // Check if user is active
    if (!user.is_active) {
      console.log('Login failed: User inactive');
      return res.status(400).json({ 
        success: false,
        message: 'Account is deactivated' 
      });
    }

    // Validate password
    console.log('Checking password...');
    const isMatch = await User.comparePassword(password, user.password_hash);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Login failed: Wrong password');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    console.log('Login successful for user:', user.username);

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        userId: user.user_id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        referralCode: user.referral_code,
        directReferrals: user.direct_referrals || 0,
        totalDonations: user.total_donations || 0,
        isLoanEligible: user.is_loan_eligible || false
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during login',
      error: error.message 
    });
  }
});

// @route   POST /api/auth/admin-login
// @desc    Admin login with role verification
// @access  Public
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Admin login attempt:', { email, password: password ? '[PROVIDED]' : '[MISSING]' });

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Find user by email
    const user = await User.findByEmail(email.toLowerCase().trim());
    
    if (!user) {
      console.log('❌ Admin login failed: User not found');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid admin credentials' 
      });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      console.log('❌ Admin login failed: User is not admin');
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Check if user is active
    if (!user.is_active) {
      console.log('❌ Admin login failed: Admin account inactive');
      return res.status(400).json({ 
        success: false,
        message: 'Admin account is deactivated' 
      });
    }

    // Validate password
    const isMatch = await User.comparePassword(password, user.password_hash);
    
    if (!isMatch) {
      console.log('❌ Admin login failed: Wrong password');
      return res.status(400).json({ 
        success: false,
        message: 'Invalid admin credentials' 
      });
    }

    console.log('✅ Admin login successful:', user.username);

    // Generate token with admin role
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Admin login successful',
      token,
      user: {
        id: user.id,
        userId: user.user_id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: true
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during admin login',
      error: error.message 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      userId: user.user_id,
      username: user.username,
      fullName: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      occupation: user.occupation,
      monthlyIncome: user.monthly_income,
      role: user.role,
      createdAt: user.created_at,
      totalContributions: user.total_contributions || 0,
      availableLoan: user.available_loan || 0,
      nextContribution: user.next_contribution,
      directReferrals: user.direct_referrals || 0,
      totalDonations: user.total_donations || 0,
      isActive: user.is_active,
      referralCode: user.referral_code,
      isAdmin: user.role === 'admin'
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error getting user data',
      error: error.message 
    });
  }
});

// @route   GET /api/auth/create-admin
// @desc    Create initial admin user (GET version)
// @access  Public (temporary)
router.get('/create-admin', async (req, res) => {
  try {
    // Check if any admin already exists
    const existingAdmins = await User.find({ role: 'admin' });
    if (existingAdmins.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Admin already exists',
        adminCount: existingAdmins.length,
        credentials: {
          email: 'admin@elevate-network.com',
          username: 'admin',
          password: 'admin123'
        },
        loginUrl: '/admin-login'
      });
    }

    // Create initial admin user
    const adminData = {
      name: 'Admin User',
      username: 'admin',
      email: 'admin@elevate-network.com',
      password: 'admin123',
      phone: '1234567890',
      address: 'Admin Office',
      occupation: 'Administrator',
      monthlyIncome: 100000
    };

    const admin = await User.create(adminData);
    
    // Update to admin role
    await User.findByIdAndUpdate(admin.id, { role: 'admin' });
    
    console.log('🛠️ Initial admin user created');

    res.json({
      success: true,
      message: 'Initial admin user created successfully',
      credentials: {
        email: 'admin@elevate-network.com',
        username: 'admin',
        password: 'admin123'
      },
      loginUrl: '/admin-login',
      note: 'Use these credentials at /admin-login route'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.json({ 
      success: false,
      message: 'Error creating admin user',
      error: error.message 
    });
  }
});

// @route   POST /api/auth/create-admin
// @desc    Create admin user (POST version)
// @access  Public (temporary)
router.post('/create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findByEmail('admin@elevate-network.com');
    if (existingAdmin) {
      return res.json({ 
        success: true, 
        message: 'Admin already exists',
        credentials: {
          email: 'admin@elevate-network.com',
          username: 'admin',
          password: 'admin123'
        }
      });
    }

    // Create admin user
    const adminData = {
      name: 'Admin User',
      username: 'admin',
      email: 'admin@elevate-network.com',
      password: 'admin123',
      phone: '1234567890',
      address: 'Admin Office',
      occupation: 'Administrator',
      monthlyIncome: 100000
    };

    const admin = await User.create(adminData);
    
    // Update to admin role
    await User.findByIdAndUpdate(admin.id, { role: 'admin' });
    
    console.log('🛠️ Admin user created via POST');
    
    res.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: {
        email: 'admin@elevate-network.com',
        username: 'admin', 
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating admin user',
      error: error.message 
    });
  }
});

// @route   POST /api/auth/promote-to-admin
// @desc    Promote existing user to admin (admin only)
// @access  Private/Admin
router.post('/promote-to-admin', authenticateToken, async (req, res) => {
  try {
    // Check if current user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can promote users'
      });
    }

    const { userId, username, email } = req.body;

    if (!userId && !username && !email) {
      return res.status(400).json({
        success: false,
        message: 'User ID, username, or email is required'
      });
    }

    // Find user to promote
    let user;
    if (userId) {
      user = await User.findByUserId(userId.trim());
    } else if (username) {
      user = await User.findByUsername(username.toLowerCase().trim());
    } else {
      user = await User.findByEmail(email.toLowerCase().trim());
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.json({
        success: true,
        message: 'User is already an admin',
        user: {
          userId: user.user_id,
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    }

    // Promote to admin
    await User.findByIdAndUpdate(user.id, { role: 'admin' });

    console.log(`🔧 User ${user.username} promoted to admin`);

    res.json({
      success: true,
      message: 'User promoted to admin successfully',
      user: {
        userId: user.user_id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Promote to admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error promoting user to admin',
      error: error.message
    });
  }
});

// @route   POST /api/auth/verify-referral
// @desc    Verify referral code (username)
// @access  Public
router.post('/verify-referral', async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Referral code is required' 
      });
    }

    // Look for user by username (referral code)
    const referrer = await User.findByUsername(referralCode.toLowerCase().trim());
    
    if (!referrer) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid referral code' 
      });
    }

    res.json({
      success: true,
      valid: true,
      referrer: {
        userId: referrer.user_id,
        username: referrer.username,
        fullName: referrer.name
      }
    });

  } catch (error) {
    console.error('Verify referral error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error verifying referral code',
      error: error.message 
    });
  }
});

// @route   POST /api/auth/check-username
// @desc    Check username availability
// @access  Public
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ 
        success: false,
        message: 'Username is required' 
      });
    }

    if (username.length < 3) {
      return res.status(400).json({ 
        success: false,
        available: false,
        message: 'Username must be at least 3 characters' 
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        success: false,
        available: false,
        message: 'Username can only contain letters, numbers, and underscores' 
      });
    }

    const existingUser = await User.findByUsername(username.toLowerCase().trim());
    
    if (existingUser) {
      return res.json({
        success: true,
        available: false,
        message: 'Username is already taken'
      });
    }

    res.json({
      success: true,
      available: true,
      message: 'Username is available'
    });

  } catch (error) {
    console.error('Check username error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error checking username',
      error: error.message 
    });
  }
});

module.exports = router;
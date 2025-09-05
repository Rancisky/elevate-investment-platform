const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Test mode configuration
const IS_TEST_MODE = process.env.NODE_ENV === 'development' && process.env.ENABLE_PAYMENT_TESTING === 'true';

// NOWPayments API Configuration
const NOWPAYMENTS_CONFIG = {
  apiKey: process.env.NOWPAYMENTS_API_KEY,
  publicKey: process.env.NOWPAYMENTS_PUBLIC_KEY,
  ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET,
  baseURL: 'https://api.nowpayments.io/v1',
  webhookURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/webhook`
};

// @route   GET /api/payments/test
// @desc    Test NOWPayments API connection
// @access  Public
router.get('/test', async (req, res) => {
  try {
    console.log('Testing NOWPayments API connection...');
    console.log('API Key configured:', !!NOWPAYMENTS_CONFIG.apiKey);
    console.log('Test mode:', IS_TEST_MODE);
    
    if (IS_TEST_MODE) {
      return res.json({
        success: true,
        message: 'NOWPayments integration ready (TEST MODE)',
        mode: 'test',
        apiConfigured: !!NOWPAYMENTS_CONFIG.apiKey
      });
    }
    
    // Test NOWPayments API status
    const response = await axios.get(`${NOWPAYMENTS_CONFIG.baseURL}/status`, {
      headers: {
        'x-api-key': NOWPAYMENTS_CONFIG.apiKey
      }
    });
    
    console.log('NOWPayments API response:', response.data);
    
    res.json({
      success: true,
      message: 'NOWPayments API connection successful',
      mode: 'production',
      apiStatus: response.data.message || 'OK',
      connection: 'Working'
    });
  } catch (error) {
    console.error('NOWPayments API error:', error.message);
    res.status(500).json({
      success: false,
      message: 'NOWPayments API connection failed',
      error: error.message,
      apiConfigured: !!NOWPAYMENTS_CONFIG.apiKey
    });
  }
});

// @route   POST /api/payment/create-payment
// @desc    Create NOWPayments payment (with test mode support)
// @access  Public
router.post('/create-payment', async (req, res) => {
  try {
    const { userData } = req.body;

    if (!userData || !userData.email || !userData.firstName) {
      return res.status(400).json({
        success: false,
        message: 'User data required for payment processing'
      });
    }

    // TEST MODE - Return mock payment data
    if (IS_TEST_MODE) {
      console.log('🧪 TEST MODE: Creating mock payment for:', userData.email);
      return res.json({
        success: true,
        payment: {
          paymentId: 'TEST_' + Date.now(),
          payAmount: 20,
          payCurrency: 'usdttrc20',
          payAddress: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5oLkJV4',
          paymentUrl: '#',
          orderId: `TEST_REG_${Date.now()}`,
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TQn9Y2khEsLJW1ChVWFMSMeRDow5oLkJV4'
        }
      });
    }

    // PRODUCTION MODE - Real NOWPayments API
    const paymentData = {
      price_amount: 20,
      price_currency: 'usd',
      pay_currency: 'usdttrc20',
      order_id: `REG_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      order_description: 'Elevate Network Registration Fee',
      ipn_callback_url: NOWPAYMENTS_CONFIG.webhookURL,
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/registration-success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/registration-cancelled`,
      customer_email: userData.email,
      case: 'success'
    };

    console.log('🚀 PRODUCTION MODE: Creating real NOWPayments transaction');
    const response = await axios.post(`${NOWPAYMENTS_CONFIG.baseURL}/payment`, paymentData, {
      headers: {
        'x-api-key': NOWPAYMENTS_CONFIG.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.data) {
      res.json({
        success: true,
        payment: {
          paymentId: response.data.payment_id,
          payAmount: response.data.pay_amount,
          payCurrency: response.data.pay_currency,
          payAddress: response.data.pay_address,
          paymentUrl: response.data.payment_url,
          orderId: paymentData.order_id,
          qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${response.data.pay_address}`
        }
      });
    }

  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment',
      error: error.response?.data || error.message
    });
  }
});

// @route   GET /api/payment/status/:paymentId
// @desc    Check payment status (with test mode support)
// @access  Public
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    // TEST MODE - Simulate payment completion after 10 seconds
    if (IS_TEST_MODE && paymentId.startsWith('TEST_')) {
      const paymentAge = Date.now() - parseInt(paymentId.split('_')[1]);
      const isCompleted = paymentAge > 10000; // 10 seconds

      console.log(`🧪 TEST MODE: Payment ${paymentId} age: ${paymentAge}ms, completed: ${isCompleted}`);
      
      return res.json({
        success: true,
        payment_status: isCompleted ? 'finished' : 'waiting',
        pay_amount: 20,
        pay_currency: 'usdttrc20',
        price_amount: 20,
        price_currency: 'usd',
        created_at: new Date(parseInt(paymentId.split('_')[1])).toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // PRODUCTION MODE - Real API call
    const response = await axios.get(`${NOWPAYMENTS_CONFIG.baseURL}/payment/${paymentId}`, {
      headers: {
        'x-api-key': NOWPAYMENTS_CONFIG.apiKey
      }
    });

    if (response.data) {
      res.json({
        success: true,
        payment_status: response.data.payment_status,
        pay_amount: response.data.pay_amount,
        pay_currency: response.data.pay_currency,
        price_amount: response.data.price_amount,
        price_currency: response.data.price_currency,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at
      });
    }

  } catch (error) {
    console.error('Payment status check error:', error);
    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to check payment status'
      });
    }
  }
});

// @route   POST /api/payment/complete-registration
// @desc    Complete registration after successful payment
// @access  Public
router.post('/complete-registration', async (req, res) => {
  try {
    const { paymentId, userData } = req.body;

    if (!paymentId || !userData) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID and user data required'
      });
    }

    // For test mode, skip payment verification
    let paymentVerified = false;
    
    if (IS_TEST_MODE && paymentId.startsWith('TEST_')) {
      console.log('🧪 TEST MODE: Skipping payment verification for', paymentId);
      paymentVerified = true;
    } else {
      // Verify real payment status
      const paymentResponse = await axios.get(`${NOWPAYMENTS_CONFIG.baseURL}/payment/${paymentId}`, {
        headers: {
          'x-api-key': NOWPAYMENTS_CONFIG.apiKey
        }
      });

      paymentVerified = paymentResponse.data.payment_status === 'finished';
    }

    if (!paymentVerified) {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed yet'
      });
    }

    // Create user account
    const User = require('../models/User');
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email },
        { username: userData.username },
        { paymentTxHash: paymentId }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists or payment already processed'
      });
    }

    // Create new user
    const newUser = new User({
      name: `${userData.firstName} ${userData.lastName}`,
      username: userData.username,
      email: userData.email,
      phone: `${userData.countryCode}${userData.phone}`,
      address: userData.address,
      occupation: userData.occupation,
      monthlyIncome: userData.monthlyIncome,
      password: userData.password,
      referredBy: userData.referrerCode || null,
      paymentTxHash: paymentId,
      paymentStatus: 'verified',
      paymentAmount: 20
    });

    await newUser.save();

    // Process referral commissions
    if (userData.referrerCode) {
      await processReferralCommissions(newUser._id, userData.referrerCode);
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { 
        id: newUser._id, 
        userId: newUser.userId, 
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    console.log(`✅ Registration completed for: ${userData.email} (Payment: ${paymentId})`);

    res.json({
      success: true,
      message: 'Registration completed successfully',
      token,
      user: {
        id: newUser._id,
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration'
    });
  }
});

// @route   POST /api/payment/webhook
// @desc    Handle NOWPayments IPN webhook (production only)
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (IS_TEST_MODE) {
    console.log('🧪 TEST MODE: Webhook received but ignored in test mode');
    return res.status(200).send('OK');
  }

  try {
    const body = req.body.toString();
    const signature = req.headers['x-nowpayments-sig'];

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha512', NOWPAYMENTS_CONFIG.ipnSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.log('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const webhookData = JSON.parse(body);
    console.log('NOWPayments webhook received:', webhookData);

    const { payment_status, order_id, payment_id } = webhookData;

    // Process successful payments
    if (payment_status === 'finished') {
      console.log(`✅ Payment completed: ${payment_id} for order: ${order_id}`);
      // Additional webhook processing logic can go here
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper function to process referral commissions
const processReferralCommissions = async (newUserId, referrerCode) => {
  try {
    const User = require('../models/User');
    const commissionRates = { 1: 3000, 2: 1500, 3: 600 };
    
    let currentReferrer = await User.findOne({ referralCode: referrerCode });
    let level = 1;

    if (currentReferrer) {
      currentReferrer.directReferrals += 1;
    }
    
    while (currentReferrer && level <= 3) {
      const commission = commissionRates[level];
      
      currentReferrer.addReferralCommission(level, commission);
      await currentReferrer.save();

      if (currentReferrer.referredBy) {
        currentReferrer = await User.findOne({ referralCode: currentReferrer.referredBy });
        level++;
      } else {
        break;
      }
    }

    console.log(`✅ Referral commissions processed for referrer: ${referrerCode}`);
  } catch (error) {
    console.error('Referral commission processing failed:', error);
  }
};

module.exports = router;
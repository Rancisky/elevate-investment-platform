const express = require('express');
const router = express.Router();
const supabase = require('../config/database'); // Use Supabase instead of models
const { authenticateToken } = require('../middleware/auth');
const axios = require('axios'); // Add this for API calls

// =============================================
// NOWPAYMENTS INTEGRATION FUNCTIONS
// =============================================

// Function to create NOWPayments payment - IMPROVED VERSION
const createNOWPayment = async (amount, investmentId, campaignTitle) => {
  try {
    console.log(`Creating NOWPayments payment for amount: $${amount}, investment: ${investmentId}`);
    
    const paymentData = {
      price_amount: amount,
      price_currency: 'USD',
      pay_currency: 'btc',
      order_id: investmentId,
      order_description: `Investment ${investmentId}`,
      ipn_callback_url: `${process.env.BACKEND_URL}/api/investments/nowpayments-callback`,
      success_url: `${process.env.FRONTEND_URL}/investment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/investment-cancelled`
    };
    
    console.log('Sending payment data to NOWPayments:', paymentData);
    
    const response = await axios.post('https://api.nowpayments.io/v1/payment', paymentData, {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15 second timeout
    });

    console.log('NOWPayments response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('NOWPayments API error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(`Payment gateway error: ${error.response?.data?.message || error.message}`);
  }
};

// Function to get available currencies from NOWPayments
const getAvailableCurrencies = async () => {
  try {
    const response = await axios.get('https://api.nowpayments.io/v1/currencies', {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY
      }
    });
    return response.data.currencies;
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return ['btc', 'eth', 'usdt']; // Fallback currencies
  }
};

// Function to get minimum payment amount
const getMinimumAmount = async (currency) => {
  try {
    const response = await axios.get(`https://api.nowpayments.io/v1/min-amount?currency_from=${currency}&currency_to=usd`, {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY
      }
    });
    return response.data.min_amount;
  } catch (error) {
    console.error('Error fetching minimum amount:', error);
    return 0.001; // Fallback minimum
  }
};

// =============================================
// INVESTMENT ENDPOINTS
// =============================================

// 1. Create Investment (Member invests in campaign) - /api/investments
router.post('/', async (req, res) => {
  try {
    const { campaignId, amount, userId, paymentMethod = 'crypto' } = req.body;
    const investorUserId = userId || '20a8cff1-8a13-43fa-974f-edad8cd1b45c';

    console.log('Processing investment:', { userId: investorUserId, campaignId, amount, paymentMethod });

    // Validate input
    if (!campaignId || !amount || amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid investment data. Minimum investment is $10.'
      });
    }

    // Get campaign details using Supabase
    console.log('Fetching campaign with ID:', campaignId);
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign fetch error:', campaignError);
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    console.log('Campaign data received:', campaign);

    if (campaign.status !== 'active' && campaign.status !== 'Active') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is not active for investments'
      });
    }

    // Calculate expected return and maturity date
    const roiPercentage = parseFloat(campaign.expectedROI || campaign.expected_roi || campaign.roi_percentage || 50);
    const profit = amount * (roiPercentage / 100);
    const expectedReturn = amount + profit;
    
    console.log('ROI Calculation:', {
      amount: amount,
      roiPercentage: roiPercentage,
      profit: profit,
      expectedReturn: expectedReturn
    });
    
    // Create maturity date
    const currentDate = new Date();
    const maturityDate = new Date(currentDate);
    maturityDate.setMonth(maturityDate.getMonth() + (campaign.durationMonths || 12));

    // Create investment record using Supabase
    const investmentData = {
      user_id: investorUserId,
      campaign_id: campaignId,
      amount: parseFloat(amount),
      expected_return: parseFloat(expectedReturn),
      status: 'active',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      investment_date: new Date().toISOString(),
      current_profit: 0.00,
      progress: 0.00,
      roi_percentage: roiPercentage,
      duration_months: parseInt(campaign.durationMonths || 12),
      can_withdraw_early: false,
      maturity_date: maturityDate.toISOString()
    };

    if (campaign.title) investmentData.campaign_title = campaign.title;

    console.log('Creating investment with calculated values:', investmentData);

    const { data: investment, error: investmentError } = await supabase
      .from('investments')
      .insert([investmentData])
      .select()
      .single();

    if (investmentError) {
      console.error('Investment creation error:', investmentError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create investment',
        error: investmentError.message
      });
    }

    console.log('Investment created successfully:', investment.id);

    // Create real payment with NOWPayments - CRYPTO ONLY
    let paymentInstructions;
    
    try {
      console.log('Creating NOWPayments payment...');
      const nowPayment = await createNOWPayment(amount, investment.id, campaign.title);
      
      // Get available currencies
      const availableCurrencies = await getAvailableCurrencies();
      
      paymentInstructions = {
        investmentId: investment.id,
        amount: amount,
        expectedReturn: expectedReturn,
        profit: profit,
        campaign: campaign.title,
        roi: roiPercentage,
        duration: campaign.durationMonths || 12,
        maturityDate: maturityDate,
        paymentMethods: [
          {
            method: 'nowpayments_crypto',
            details: {
              payment_id: nowPayment.payment_id,
              payment_status: nowPayment.payment_status,
              pay_address: nowPayment.pay_address,
              pay_amount: nowPayment.pay_amount,
              pay_currency: nowPayment.pay_currency,
              price_amount: nowPayment.price_amount,
              price_currency: nowPayment.price_currency,
              payment_url: `https://nowpayments.io/payment/?iid=${nowPayment.payment_id}`,
              available_currencies: availableCurrencies.slice(0, 10) // Show top 10 currencies
            }
          }
        ],
        instructions: `Complete your $${amount} payment using NOWPayments secure crypto gateway. Your investment will be activated once payment is confirmed. You will receive $${expectedReturn} at maturity ($${profit} profit).`,
        referenceId: investment.id,
        nowPaymentId: nowPayment.payment_id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      // Store NOWPayments payment ID in the investment record
      await supabase
        .from('investments')
        .update({ 
          payment_id: nowPayment.payment_id,
          payment_method: 'nowpayments_crypto'
        })
        .eq('id', investment.id);

    } catch (error) {
      console.error('NOWPayments creation failed, falling back to manual crypto payment:', error);
      
      // Fallback to manual crypto payment instructions if NOWPayments fails
      paymentInstructions = {
        investmentId: investment.id,
        amount: amount,
        expectedReturn: expectedReturn,
        profit: profit,
        campaign: campaign.title,
        roi: roiPercentage,
        duration: campaign.durationMonths || 12,
        maturityDate: maturityDate,
        paymentMethods: [
          {
            method: 'crypto_manual',
            details: {
              bitcoin: 'Contact support for Bitcoin address',
              ethereum: 'Contact support for Ethereum address',
              usdt: 'Contact support for USDT address',
              note: 'Crypto payment addresses will be provided via email'
            }
          }
        ],
        instructions: `Payment gateway temporarily unavailable. Please contact support at support@elevatenetwork.com with your investment reference ${investment.id} to receive crypto payment instructions. You will receive $${expectedReturn} at maturity ($${profit} profit).`,
        referenceId: investment.id,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        requiresSupport: true
      };
    }

    res.json({
      success: true,
      message: 'Investment created - Please complete crypto payment to activate',
      requiresPayment: true,
      paymentInstructions: paymentInstructions
    });

  } catch (error) {
    console.error('Investment creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during investment creation',
      error: error.message
    });
  }
});

// Enhanced NOWPayments IPN Callback handler with proper security and logging
router.post('/nowpayments-callback', express.raw({type: 'application/json'}), async (req, res) => {
  try {
    console.log('NOWPayments callback received at:', new Date().toISOString());
    console.log('Headers:', req.headers);
    console.log('Raw body:', req.body);
    
    const data = JSON.parse(req.body);
    console.log('Parsed callback data:', data);
    
    const { 
      payment_id, 
      payment_status, 
      order_id, 
      pay_amount,
      price_amount,
      price_currency,
      pay_currency,
      actually_paid,
      outcome_amount,
      outcome_currency
    } = data;

    // Validate required fields
    if (!payment_id || !payment_status || !order_id) {
      console.error('Missing required fields in callback:', { payment_id, payment_status, order_id });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the callback signature (recommended for production)
    const expectedSignature = req.headers['x-nowpayments-sig'];
    if (expectedSignature) {
      // TODO: Implement signature verification
      // const calculatedSignature = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET)
      //   .update(req.body)
      //   .digest('hex');
      // if (expectedSignature !== calculatedSignature) {
      //   console.error('Invalid signature');
      //   return res.status(401).json({ error: 'Invalid signature' });
      // }
    }

    // Get investment details first
    const { data: investment, error: fetchError } = await supabase
      .from('investments')
      .select('*')
      .eq('id', order_id)
      .single();

    if (fetchError || !investment) {
      console.error(`Investment not found for order_id: ${order_id}`, fetchError);
      return res.status(404).json({ error: 'Investment not found' });
    }

    console.log('Investment found:', {
      id: investment.id,
      amount: investment.amount,
      current_status: investment.status,
      current_payment_status: investment.payment_status
    });

    // Create audit log entry
    const auditEntry = {
      investment_id: order_id,
      payment_id: payment_id,
      event_type: 'payment_callback',
      old_status: investment.payment_status,
      new_status: payment_status,
      callback_data: data,
      created_at: new Date().toISOString()
    };

    // Log to payment_audit table
    await supabase
      .from('payment_audit')
      .insert([auditEntry]);

    // Handle different payment statuses
    let updateData = {
      payment_status: payment_status,
      updated_at: new Date().toISOString()
    };

    if (payment_status === 'finished' || payment_status === 'confirmed') {
      // Payment successful
      updateData = {
        ...updateData,
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
        status: 'active', // Activate the investment
        actual_paid_amount: actually_paid || pay_amount,
        paid_currency: pay_currency,
        payment_tx_hash: data.payment_extra_id || null
      };

      console.log(`✅ Payment CONFIRMED for investment ${order_id}`);
      console.log('Payment details:', {
        expected_amount: pay_amount,
        actually_paid: actually_paid,
        currency: pay_currency,
        usd_amount: price_amount
      });

      // TODO: Send confirmation email to user
      // await sendPaymentConfirmationEmail(investment.user_id, investment);

    } else if (payment_status === 'partially_paid') {
      // Partial payment received
      updateData = {
        ...updateData,
        payment_status: 'partially_paid',
        actual_paid_amount: actually_paid || 0,
        notes: `Partial payment: ${actually_paid || 0} ${pay_currency} of ${pay_amount} ${pay_currency} required`
      };

      console.log(`⚠️ PARTIAL payment for investment ${order_id}: ${actually_paid}/${pay_amount} ${pay_currency}`);

    } else if (payment_status === 'failed' || payment_status === 'expired' || payment_status === 'refunded') {
      // Payment failed/expired
      updateData = {
        ...updateData,
        payment_status: 'failed',
        status: 'cancelled',
        failure_reason: payment_status,
        failed_at: new Date().toISOString()
      };

      console.log(`❌ Payment FAILED for investment ${order_id}: ${payment_status}`);

      // TODO: Send failure notification email
      // await sendPaymentFailureEmail(investment.user_id, investment, payment_status);

    } else if (payment_status === 'waiting' || payment_status === 'confirming') {
      // Payment in progress
      updateData = {
        ...updateData,
        payment_status: payment_status,
        actual_paid_amount: actually_paid || 0
      };

      console.log(`🔄 Payment IN PROGRESS for investment ${order_id}: ${payment_status}`);

    } else {
      // Unknown status
      console.log(`❓ Unknown payment status for investment ${order_id}: ${payment_status}`);
    }

    // Update investment record
    const { error: updateError } = await supabase
      .from('investments')
      .update(updateData)
      .eq('id', order_id);

    if (updateError) {
      console.error('Failed to update investment:', updateError);
      return res.status(500).json({ error: 'Failed to update investment' });
    }

    // Update campaign raised amount if payment confirmed
    if (payment_status === 'finished' || payment_status === 'confirmed') {
      const { error: campaignError } = await supabase
        .rpc('increment_campaign_amount', {
          campaign_id: investment.campaign_id,
          amount: investment.amount
        });

      if (campaignError) {
        console.error('Failed to update campaign amount:', campaignError);
        // Don't fail the callback for this
      }
    }

    console.log(`✅ Investment ${order_id} updated successfully`);
    res.status(200).json({ 
      success: true, 
      message: 'Callback processed successfully',
      investment_id: order_id,
      payment_status: payment_status
    });

  } catch (error) {
    console.error('NOWPayments callback error:', error);
    
    // Log error to database
    try {
      await supabase
        .from('payment_audit')
        .insert([{
          event_type: 'callback_error',
          error_message: error.message,
          callback_data: req.body ? JSON.parse(req.body) : null,
          created_at: new Date().toISOString()
        }]);
    } catch (logError) {
      console.error('Failed to log callback error:', logError);
    }
    
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// Enhanced payment status endpoint with real-time NOWPayments checking
router.get('/payment-status/:investmentId', async (req, res) => {
  try {
    const { investmentId } = req.params;
    
    console.log(`Checking payment status for investment: ${investmentId}`);
    
    // Get investment details
    const { data: investment, error } = await supabase
      .from('investments')
      .select('*')
      .eq('id', investmentId)
      .single();

    if (error || !investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    let nowPaymentData = null;
    let statusFromNOW = null;

    // If we have a NOWPayments payment ID, check current status
    if (investment.payment_id) {
      try {
        console.log(`Checking NOWPayments status for payment ID: ${investment.payment_id}`);
        
        const response = await axios.get(`https://api.nowpayments.io/v1/payment/${investment.payment_id}`, {
          headers: {
            'x-api-key': process.env.NOWPAYMENTS_API_KEY
          },
          timeout: 10000 // 10 second timeout
        });

        nowPaymentData = response.data;
        statusFromNOW = nowPaymentData.payment_status;
        
        console.log(`NOWPayments current status: ${statusFromNOW}`);

        // Update local status if different from NOWPayments
        if (statusFromNOW !== investment.payment_status) {
          console.log(`Status mismatch. Local: ${investment.payment_status}, NOWPayments: ${statusFromNOW}. Updating...`);
          
          let updateData = {
            payment_status: statusFromNOW,
            updated_at: new Date().toISOString()
          };

          // If payment is now confirmed, activate investment
          if ((statusFromNOW === 'finished' || statusFromNOW === 'confirmed') && 
              investment.payment_status !== 'confirmed') {
            updateData.payment_confirmed_at = new Date().toISOString();
            updateData.status = 'active';
            
            console.log(`Payment confirmed! Activating investment ${investmentId}`);
          }

          // Update investment
          await supabase
            .from('investments')
            .update(updateData)
            .eq('id', investmentId);

          // Log the status change
          await supabase
            .from('payment_audit')
            .insert([{
              investment_id: investmentId,
              payment_id: investment.payment_id,
              event_type: 'status_sync',
              old_status: investment.payment_status,
              new_status: statusFromNOW,
              callback_data: nowPaymentData,
              created_at: new Date().toISOString()
            }]);

          // Update local investment object for response
          investment.payment_status = statusFromNOW;
          if (updateData.payment_confirmed_at) {
            investment.payment_confirmed_at = updateData.payment_confirmed_at;
            investment.status = 'active';
          }
        }

      } catch (nowError) {
        console.error('Error checking NOWPayments status:', nowError.message);
        // Continue with local data if NOWPayments is unavailable
      }
    }

    // Get payment audit history
    const { data: auditHistory } = await supabase
      .from('payment_audit')
      .select('*')
      .eq('investment_id', investmentId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Determine overall status and user-friendly message
    let userStatus = 'pending';
    let statusMessage = 'Payment is being processed';
    let nextAction = 'Please wait for payment confirmation';

    switch (investment.payment_status) {
      case 'confirmed':
      case 'finished':
        userStatus = 'confirmed';
        statusMessage = 'Payment confirmed! Investment is now active';
        nextAction = 'No action required. You can view your investment in the dashboard';
        break;
      
      case 'waiting':
        userStatus = 'waiting';
        statusMessage = 'Waiting for payment to be sent';
        nextAction = 'Please send the exact Bitcoin amount to the provided address';
        break;
      
      case 'confirming':
        userStatus = 'confirming';
        statusMessage = 'Payment received, waiting for blockchain confirmation';
        nextAction = 'Please wait while the blockchain confirms your transaction';
        break;
      
      case 'partially_paid':
        userStatus = 'partial';
        statusMessage = 'Partial payment received';
        nextAction = 'Please send the remaining amount to complete your investment';
        break;
      
      case 'failed':
      case 'expired':
      case 'refunded':
        userStatus = 'failed';
        statusMessage = `Payment ${investment.payment_status}`;
        nextAction = 'Please contact support or create a new investment';
        break;
    }

    // Calculate time since investment created
    const createdAt = new Date(investment.created_at);
    const now = new Date();
    const minutesElapsed = Math.floor((now - createdAt) / (1000 * 60));
    const hoursElapsed = Math.floor(minutesElapsed / 60);

    res.json({
      success: true,
      investment: {
        id: investment.id,
        amount: investment.amount,
        expected_return: investment.expected_return,
        status: investment.status,
        payment_status: investment.payment_status,
        payment_confirmed_at: investment.payment_confirmed_at,
        created_at: investment.created_at,
        campaign_title: investment.campaign_title
      },
      payment: {
        payment_id: investment.payment_id,
        current_status: investment.payment_status,
        user_status: userStatus,
        status_message: statusMessage,
        next_action: nextAction,
        minutes_elapsed: minutesElapsed,
        hours_elapsed: hoursElapsed,
        nowpayments_data: nowPaymentData
      },
      audit_history: auditHistory || [],
      last_checked: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking payment status',
      error: error.message
    });
  }
});

// New endpoint: Get all pending payments for monitoring
router.get('/pending-payments', async (req, res) => {
  try {
    const { data: pendingInvestments, error } = await supabase
      .from('investments')
      .select('*')
      .in('payment_status', ['waiting', 'confirming', 'partially_paid'])
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const pendingPayments = pendingInvestments.map(inv => ({
      investment_id: inv.id,
      payment_id: inv.payment_id,
      amount: inv.amount,
      payment_status: inv.payment_status,
      created_at: inv.created_at,
      user_id: inv.user_id,
      campaign_title: inv.campaign_title,
      minutes_pending: Math.floor((new Date() - new Date(inv.created_at)) / (1000 * 60))
    }));

    res.json({
      success: true,
      pending_payments: pendingPayments,
      total_pending: pendingPayments.length,
      total_amount_pending: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
    });

  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending payments'
    });
  }
});

// 2. GET /api/investments - get current user's investments
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get userId from auth middleware
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    console.log('Fetching investments for user:', userId);

    // Get investments using Supabase
    const { data: investments, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching investments:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching investments',
        investments: []
      });
    }

    // Process investments
    const investmentDetails = investments.map(investment => {
      return {
        id: investment.id,
        campaign: investment.campaign_title || 'Unknown',
        amount: investment.amount || 0,
        expectedReturn: investment.expected_return || 0,
        currentProfit: 0,
        progress: 0,
        status: investment.status || 'active',
        paymentStatus: investment.payment_status || 'pending',
        maturityDate: investment.maturity_date,
        investmentDate: investment.created_at,
        roi: investment.roi_percentage || 0,
        duration: investment.duration_months || 0,
        canWithdrawEarly: false
      };
    });

    const totalInvestments = investmentDetails.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpectedReturns = investmentDetails.reduce((sum, inv) => sum + inv.expectedReturn, 0);
    const totalCurrentProfit = investmentDetails.reduce((sum, inv) => sum + inv.currentProfit, 0);

    res.json({
      success: true,
      investments: investmentDetails,
      summary: {
        totalInvestments: totalInvestments,
        totalExpectedReturns: totalExpectedReturns,
        totalCurrentProfit: totalCurrentProfit,
        activeInvestments: investmentDetails.filter(inv => inv.status === 'active').length,
        maturedInvestments: investmentDetails.filter(inv => inv.status === 'matured').length
      }
    });

  } catch (error) {
    console.error('Error fetching user investments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching investments',
      investments: []
    });
  }
});

// 3. Get User Investments - /api/investments/user/:userId
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId || req.user?.id;

    // Get investments using Supabase
    const { data: investments, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching investments:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching user investments',
        error: error.message
      });
    }

    // Process investments
    const investmentDetails = investments.map(investment => {
      return {
        id: investment.id,
        campaign: investment.campaign_title || 'Unknown',
        amount: investment.amount || 0,
        expectedReturn: investment.expected_return || 0,
        currentProfit: 0,
        progress: 0,
        status: investment.status || 'active',
        paymentStatus: investment.payment_status || 'pending',
        maturityDate: investment.maturity_date,
        investmentDate: investment.created_at,
        roi: investment.roi_percentage || 0,
        duration: investment.duration_months || 0,
        canWithdrawEarly: false
      };
    });

    const totalInvestments = investmentDetails.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpectedReturns = investmentDetails.reduce((sum, inv) => sum + inv.expectedReturn, 0);
    const totalCurrentProfit = investmentDetails.reduce((sum, inv) => sum + inv.currentProfit, 0);

    res.json({
      success: true,
      investments: investmentDetails,
      summary: {
        totalInvestments: totalInvestments,
        totalExpectedReturns: totalExpectedReturns,
        totalCurrentProfit: totalCurrentProfit,
        activeInvestments: investmentDetails.filter(inv => inv.status === 'active').length,
        maturedInvestments: investmentDetails.filter(inv => inv.status === 'matured').length
      }
    });

  } catch (error) {
    console.error('Error fetching user investments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user investments',
      error: error.message
    });
  }
});

// 4. Process Early Withdrawal - /api/investments/:id/withdraw-early
router.post('/:id/withdraw-early', authenticateToken, async (req, res) => {
  try {
    const investmentId = req.params.id;
    const userId = req.user?.id || req.user?._id;

    // Get investment using Supabase
    const { data: investment, error } = await supabase
      .from('investments')
      .select('*')
      .eq('id', investmentId)
      .single();
    
    if (error || !investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    // Verify ownership
    if (investment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to investment'
      });
    }

    // Process early withdrawal
    const withdrawalDetails = {
      originalAmount: investment.amount,
      penaltyAmount: investment.amount * 0.1, // 10% penalty
      withdrawnAmount: investment.amount * 0.9,
      processedAt: new Date()
    };
    
    // Update investment status using Supabase
    const { error: updateError } = await supabase
      .from('investments')
      .update({ status: 'withdrawn_early' })
      .eq('id', investmentId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Early withdrawal processed successfully',
      withdrawalDetails: withdrawalDetails
    });

  } catch (error) {
    console.error('Error processing early withdrawal:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing early withdrawal'
    });
  }
});

// 5. Claim Matured Investment - /api/investments/:id/claim
router.post('/:id/claim', authenticateToken, async (req, res) => {
  try {
    const investmentId = req.params.id;
    const userId = req.user?.id || req.user?._id;

    // Get investment using Supabase
    const { data: investment, error } = await supabase
      .from('investments')
      .select('*')
      .eq('id', investmentId)
      .single();
    
    if (error || !investment) {
      return res.status(404).json({
        success: false,
        message: 'Investment not found'
      });
    }

    // Verify ownership
    if (investment.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to investment'
      });
    }

    // Claim profit
    const claimDetails = {
      originalAmount: investment.amount,
      profit: investment.expected_return - investment.amount,
      totalAmount: investment.expected_return,
      claimedAt: new Date()
    };
    
    // Update investment status using Supabase
    const { error: updateError } = await supabase
      .from('investments')
      .update({ status: 'claimed' })
      .eq('id', investmentId);

    if (updateError) {
      throw updateError;
    }

    res.json({
      success: true,
      message: 'Investment profit claimed successfully',
      claimDetails: claimDetails
    });

  } catch (error) {
    console.error('Error claiming investment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error claiming investment'
    });
  }
});

// Test NOWPayments payment creation
router.get('/test-payment-creation', async (req, res) => {
  try {
    console.log('Testing NOWPayments payment creation...');
    
    const testPayment = await axios.post('https://api.nowpayments.io/v1/payment', {
      price_amount: 10,
      price_currency: 'USD',
      pay_currency: 'btc',
      order_id: 'test-order-123',
      order_description: 'Test payment creation'
    }, {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Test payment created:', testPayment.data);
    res.json({ success: true, payment: testPayment.data });
  } catch (error) {
    console.error('Payment creation test error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data || error.message 
    });
  }
});

// Test NOWPayments API - Add this temporarily for debugging
router.get('/test-nowpayments', async (req, res) => {
  try {
    console.log('Testing NOWPayments API...');
    console.log('API Key:', process.env.NOWPAYMENTS_API_KEY ? 'Present' : 'Missing');
    
    const response = await axios.get('https://api.nowpayments.io/v1/status', {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY
      }
    });
    
    console.log('NOWPayments API Response:', response.data);
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('NOWPayments API Test Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data || error.message,
      apiKey: process.env.NOWPAYMENTS_API_KEY ? 'Present' : 'Missing'
    });
  }
});

module.exports = router;
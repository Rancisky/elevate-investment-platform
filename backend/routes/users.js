const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile - FIXED field access
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user profile with proper field names (Supabase snake_case)
    const userProfile = {
      id: user.id,
      user_id: user.user_id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      address: user.address,
      occupation: user.occupation,
      monthly_income: user.monthly_income,
      role: user.role,
      created_at: user.created_at,
      wallet_balance: user.wallet_balance || 0,
      total_earnings: user.total_earnings || 0
    };

    res.json(userProfile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/users/wallet
// @desc    Get user wallet information - FIXED for Supabase
// @access  Private
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching wallet for user:', req.user.id);
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Manual calculation of wallet data since we removed Mongoose methods
    const walletData = {
      totalBalance: user.wallet_balance || 0,
      totalEarnings: user.total_earnings || 0,
      level1Earnings: user.level1_commission || 0,
      level2Earnings: user.level2_commission || 0,
      level3Earnings: user.level3_commission || 0,
      investmentProfits: user.investment_profits || 0,
      donationProfits: user.donation_profits || 0,
      totalWithdrawn: user.total_withdrawn || 0,
      availableWithdrawal: Math.max(0, (user.wallet_balance || 0) - (user.pending_withdrawals || 0)),
      withdrawalHistory: user.withdrawal_history || []
    };

    res.json(walletData);
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/withdraw
// @desc    Request withdrawal (NEW - $25 minimum)
// @access  Private
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    // Validation
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid withdrawal amount' 
      });
    }

    if (amount < 25) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimum withdrawal amount is $25' 
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check available balance
    const availableBalance = (user.wallet_balance || 0) - (user.pending_withdrawals || 0);
    if (amount > availableBalance) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient funds. Available: $${availableBalance.toLocaleString()}` 
      });
    }

    // Create withdrawal record
    const withdrawalData = {
      id: Date.now().toString(),
      amount: amount,
      status: 'pending',
      method: 'Bank Transfer',
      createdAt: new Date(),
      processedAt: null
    };

    // Update user data
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $inc: { 
          pending_withdrawals: amount 
        },
        $push: { 
          withdrawal_history: withdrawalData 
        }
      },
      { new: true }
    );

    console.log(`💰 Withdrawal requested: $${amount} by user ${user.user_id || user.username}`);

    // Log withdrawal for admin tracking
    await logWithdrawalRequest({
      userId: user.user_id || user.username,
      userEmail: user.email,
      amount: amount,
      timestamp: new Date(),
      userBalance: user.wallet_balance,
      availableBalance: availableBalance
    });

    res.json({
      success: true,
      message: `Withdrawal of $${amount.toLocaleString()} has been requested. Funds will be processed within 24 hours.`,
      withdrawal: {
        id: withdrawalData.id,
        amount: amount,
        status: 'pending',
        estimatedProcessing: '24 hours'
      }
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Withdrawal request failed', 
      error: error.message 
    });
  }
});

// @route   GET /api/users/withdrawals
// @desc    Get user withdrawal history
// @access  Private
router.get('/withdrawals', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const withdrawals = user.withdrawal_history || [];
    
    res.json({
      withdrawals: withdrawals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      totalWithdrawn: user.total_withdrawn || 0,
      pendingAmount: user.pending_withdrawals || 0
    });

  } catch (error) {
    console.error('Withdrawal history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/transactions
// @desc    Get user transaction history - FIXED for Supabase
// @access  Private
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Manual transaction aggregation since no Mongoose populate
    const transactions = [];
    
    // Add commission earnings
    if (user.level1_commission > 0) {
      transactions.push({
        type: 'commission',
        level: 1,
        amount: user.level1_commission,
        description: 'Level 1 Referral Commission',
        date: user.created_at
      });
    }
    
    if (user.level2_commission > 0) {
      transactions.push({
        type: 'commission',
        level: 2,
        amount: user.level2_commission,
        description: 'Level 2 Referral Commission',
        date: user.created_at
      });
    }

    if (user.level3_commission > 0) {
      transactions.push({
        type: 'commission',
        level: 3,
        amount: user.level3_commission,
        description: 'Level 3 Referral Commission',
        date: user.created_at
      });
    }

    // Add withdrawals
    if (user.withdrawal_history) {
      user.withdrawal_history.forEach(withdrawal => {
        transactions.push({
          type: 'withdrawal',
          amount: -withdrawal.amount,
          description: `Withdrawal - ${withdrawal.method}`,
          status: withdrawal.status,
          date: withdrawal.createdAt
        });
      });
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(transactions);
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone, address, occupation, monthly_income } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        full_name,
        phone,
        address,
        occupation,
        monthly_income
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        full_name: updatedUser.full_name,
        username: updatedUser.username,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        occupation: updatedUser.occupation,
        monthly_income: updatedUser.monthly_income
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ====================
// ADMIN ROUTES
// ====================

// @route   GET /api/users
// @desc    Get all users (Admin only) - FIXED aggregation
// @access  Admin
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({});
    
    // Manual calculation instead of Mongoose aggregation
    const usersWithStats = users.map(user => ({
      id: user.id,
      user_id: user.user_id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      wallet_balance: user.wallet_balance || 0,
      total_earnings: user.total_earnings || 0,
      total_withdrawn: user.total_withdrawn || 0,
      pending_withdrawals: user.pending_withdrawals || 0,
      direct_referrals: user.direct_referrals || 0,
      total_referrals: user.total_referrals || 0,
      created_at: user.created_at,
      last_active: user.last_active
    }));

    res.json(usersWithStats);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/admin/process-withdrawal
// @desc    Process pending withdrawal (Admin only)
// @access  Admin
router.post('/admin/process-withdrawal', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, withdrawalId, action } = req.body; // action: 'approve' or 'reject'
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const withdrawal = user.withdrawal_history.id(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ message: 'Withdrawal not found' });
    }

    if (action === 'approve') {
      // Approve withdrawal
      withdrawal.status = 'completed';
      withdrawal.processedAt = new Date();
      
      // Update user balances
      user.wallet_balance = Math.max(0, (user.wallet_balance || 0) - withdrawal.amount);
      user.total_withdrawn = (user.total_withdrawn || 0) + withdrawal.amount;
      user.pending_withdrawals = Math.max(0, (user.pending_withdrawals || 0) - withdrawal.amount);
      
    } else if (action === 'reject') {
      // Reject withdrawal
      withdrawal.status = 'rejected';
      withdrawal.processedAt = new Date();
      
      // Return funds to available balance
      user.pending_withdrawals = Math.max(0, (user.pending_withdrawals || 0) - withdrawal.amount);
    }

    await user.save();

    console.log(`📋 Admin ${action}ed withdrawal: $${withdrawal.amount} for user ${user.username}`);

    res.json({
      success: true,
      message: `Withdrawal ${action}ed successfully`,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        processedAt: withdrawal.processedAt
      }
    });

  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/admin/pending-withdrawals
// @desc    Get all pending withdrawals (Admin only)
// @access  Admin
router.get('/admin/pending-withdrawals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({
      'withdrawal_history.status': 'pending'
    });

    const pendingWithdrawals = [];
    
    users.forEach(user => {
      user.withdrawal_history.forEach(withdrawal => {
        if (withdrawal.status === 'pending') {
          pendingWithdrawals.push({
            withdrawalId: withdrawal.id,
            userId: user.id,
            userDetails: {
              user_id: user.user_id,
              full_name: user.full_name,
              username: user.username,
              email: user.email
            },
            amount: withdrawal.amount,
            method: withdrawal.method,
            requestedAt: withdrawal.createdAt,
            userBalance: user.wallet_balance
          });
        }
      });
    });

    // Sort by request date (newest first)
    pendingWithdrawals.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

    res.json({
      pendingWithdrawals,
      totalPendingAmount: pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0),
      count: pendingWithdrawals.length
    });

  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to log withdrawal requests for admin tracking
const logWithdrawalRequest = async (withdrawalData) => {
  try {
    // You can implement additional logging here
    // For now, just console log for admin monitoring
    console.log('=== WITHDRAWAL REQUEST ===');
    console.log(`User: ${withdrawalData.userId} (${withdrawalData.userEmail})`);
    console.log(`Amount: $${withdrawalData.amount.toLocaleString()}`);
    console.log(`Time: ${withdrawalData.timestamp}`);
    console.log(`User Balance: $${withdrawalData.userBalance.toLocaleString()}`);
    console.log(`Available: $${withdrawalData.availableBalance.toLocaleString()}`);
    console.log('========================');
    
    // In production, you might want to:
    // - Send email notification to admin
    // - Log to separate withdrawal tracking system
    // - Create notification in admin panel
    
  } catch (error) {
    console.error('Withdrawal logging error:', error);
  }
};

module.exports = router;
const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const supabase = require('../config/database');

const router = express.Router();

// Referral Commission Processing with Supabase
class ReferralService {
  static async createReferralRecord(referrerId, referredId, level, commission) {
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_id: referredId,
        level: level,
        commission: commission,
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getReferralsByReferrer(referrerId) {
    const { data, error } = await supabase
      .from('referrals')
      .select(`
        *,
        referred:users!referrals_referred_id_fkey(
          id,
          name,
          user_id,
          created_at
        )
      `)
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

// Create referrals table if it doesn't exist
const createReferralsTable = async () => {
  const { error } = await supabase.rpc('create_referrals_table_if_not_exists');
  if (error && !error.message.includes('already exists')) {
    console.log('Creating referrals table...');
    // Table will be created through SQL if needed
  }
};

// @route   GET /api/referrals
// @desc    Get user's referral commissions
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const referrals = await ReferralService.getReferralsByReferrer(req.user.id);

    res.json({
      success: true,
      referrals: referrals
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching referrals' 
    });
  }
});

// @route   POST /api/referrals/process
// @desc    Process referral commissions (called when new user registers)
// @access  Private (Internal use)
router.post('/process', async (req, res) => {
  try {
    const { referredUserId, referrerCode } = req.body;

    if (!referredUserId || !referrerCode) {
      return res.status(400).json({ 
        success: false,
        message: 'Referred user ID and referrer code are required' 
      });
    }

    // Find referrer by referral code
    const referrer = await User.findOne({ referral_code: referrerCode });
    if (!referrer) {
      return res.status(404).json({ 
        success: false,
        message: 'Referrer not found' 
      });
    }

    // Commission structure
    const commissionRates = {
      1: 3000, // Level 1: ₦3,000
      2: 1500, // Level 2: ₦1,500
      3: 600   // Level 3: ₦600
    };

    const commissions = [];
    let currentReferrer = referrer;
    let level = 1;

    // Process up to 3 levels of referrals
    while (currentReferrer && level <= 3) {
      const commission = commissionRates[level];

      try {
        // Create referral record
        await ReferralService.createReferralRecord(
          currentReferrer.id, 
          referredUserId, 
          level, 
          commission
        );

        // Add commission to user wallet
        await User.addReferralCommission(currentReferrer.id, level, commission);

        commissions.push({
          referrerId: currentReferrer.id,
          referrerName: currentReferrer.name,
          level,
          commission
        });

        // Find next level referrer
        if (currentReferrer.referred_by) {
          currentReferrer = await User.findOne({ referral_code: currentReferrer.referred_by });
          level++;
        } else {
          break;
        }
      } catch (error) {
        console.error(`Error processing level ${level} referral:`, error);
        break;
      }
    }

    res.json({
      success: true,
      message: 'Referral commissions processed successfully',
      commissions
    });

  } catch (error) {
    console.error('Process referrals error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error processing referral commissions' 
    });
  }
});

// @route   GET /api/referrals/stats
// @desc    Get referral statistics for user
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get referral tree using User model method
    const downline = await User.getDownline(user.username, 3);
    
    // Calculate total earnings from wallet
    const wallet = user.wallet || {};
    const totalEarned = (wallet.level1Earnings || 0) + 
                       (wallet.level2Earnings || 0) + 
                       (wallet.level3Earnings || 0);

    const stats = {
      totalReferrals: downline.level1.length + downline.level2.length + downline.level3.length,
      level1Count: downline.level1.length,
      level2Count: downline.level2.length,
      level3Count: downline.level3.length,
      totalEarned: totalEarned,
      referralCode: user.referral_code,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/register?ref=${user.referral_code}`
    };

    res.json({
      success: true,
      ...stats
    });

  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching referral statistics' 
    });
  }
});

// @route   GET /api/referrals/recent
// @desc    Get recent referral activity
// @access  Private
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const recentReferrals = await ReferralService.getReferralsByReferrer(req.user.id);

    // Format for frontend
    const formattedReferrals = recentReferrals.slice(0, 10).map(ref => ({
      name: ref.referred?.name || 'Unknown User',
      fullName: ref.referred?.name || 'Unknown User',
      level: ref.level,
      date: ref.created_at,
      commission: ref.commission,
      status: ref.status,
      createdAt: ref.created_at
    }));

    res.json({
      success: true,
      referrals: formattedReferrals
    });

  } catch (error) {
    console.error('Get recent referrals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching recent referrals'
    });
  }
});

// @route   GET /api/referrals/tree
// @desc    Get referral tree (genealogy)
// @access  Private
router.get('/tree', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get referral tree using User model method
    const referralTree = await User.getDownline(user.username, 3);

    res.json({
      success: true,
      referralCode: user.referral_code,
      totalLevels: 3,
      tree: referralTree
    });

  } catch (error) {
    console.error('Get referral tree error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching referral tree' 
    });
  }
});

// @route   GET /api/referrals/admin/all
// @desc    Get all referral records (Admin only)
// @access  Private/Admin
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    const { level, status } = req.query;
    let query = supabase
      .from('referrals')
      .select(`
        *,
        referrer:users!referrals_referrer_id_fkey(
          id,
          name,
          user_id,
          email
        ),
        referred:users!referrals_referred_id_fkey(
          id,
          name,
          user_id,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (level) {
      query = query.eq('level', parseInt(level));
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: referrals, error } = await query;
    if (error) throw error;

    res.json({
      success: true,
      referrals: referrals || []
    });

  } catch (error) {
    console.error('Get all referrals error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching all referrals' 
    });
  }
});

// @route   GET /api/referrals/admin/stats
// @desc    Get referral statistics (Admin only)
// @access  Private/Admin
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }

    // Get referral statistics from referrals table
    const { data: allReferrals, error } = await supabase
      .from('referrals')
      .select('*');

    if (error) throw error;

    const referrals = allReferrals || [];
    const totalReferrals = referrals.length;
    const level1Referrals = referrals.filter(r => r.level === 1).length;
    const level2Referrals = referrals.filter(r => r.level === 2).length;
    const level3Referrals = referrals.filter(r => r.level === 3).length;
    const totalCommissions = referrals.reduce((sum, r) => sum + (r.commission || 0), 0);

    // Commission by level
    const commissionsByLevel = [1, 2, 3].map(level => ({
      _id: level,
      total: referrals.filter(r => r.level === level).reduce((sum, r) => sum + (r.commission || 0), 0),
      count: referrals.filter(r => r.level === level).length
    }));

    // Top referrers (simplified - would need more complex query for full stats)
    const topReferrers = [];

    res.json({
      success: true,
      totalReferrals,
      level1Referrals,
      level2Referrals,
      level3Referrals,
      totalCommissions,
      commissionsByLevel,
      topReferrers
    });

  } catch (error) {
    console.error('Get referral admin stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching referral statistics' 
    });
  }
});

module.exports = router;
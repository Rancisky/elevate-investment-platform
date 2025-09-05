const express = require('express');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const Investment = require('../models/Investment');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/campaigns/debug-db
// @desc    Debug database campaigns with enhanced info
// @access  Public
router.get('/debug-db', async (req, res) => {
  try {
    // Get all campaigns without filters to see total count
    const allCampaigns = await Campaign.find({});
    const activeCampaigns = await Campaign.find({ status: 'active' });
    const pausedCampaigns = await Campaign.find({ status: 'paused' });
    const closedCampaigns = await Campaign.find({ status: 'closed' });
    const completedCampaigns = await Campaign.find({ status: 'completed' });
    
    // Find campaigns that are expired but still active
    const expiredButActive = allCampaigns.filter(c => c.isExpired && c.status === 'active');
    
    console.log('=== CAMPAIGN DEBUG INFO ===');
    console.log('Total campaigns in database:', allCampaigns.length);
    console.log('Active campaigns:', activeCampaigns.length);
    console.log('Paused campaigns:', pausedCampaigns.length);
    console.log('Closed campaigns:', closedCampaigns.length);
    console.log('Completed campaigns:', completedCampaigns.length);
    console.log('Expired but still active:', expiredButActive.length);
    
    const recentCampaigns = allCampaigns.slice(0, 5);
    console.log('Recent campaigns:', recentCampaigns.map(c => ({
      title: c.title,
      status: c.status,
      isExpired: c.isExpired,
      progress: c.progress,
      created_at: c.created_at
    })));
    
    res.json({
      success: true,
      totalCount: allCampaigns.length,
      statusBreakdown: {
        active: activeCampaigns.length,
        paused: pausedCampaigns.length,
        closed: closedCampaigns.length,
        completed: completedCampaigns.length
      },
      healthCheck: {
        expiredButActive: expiredButActive.length,
        needsStatusUpdate: expiredButActive.map(c => ({
          id: c.id,
          title: c.title,
          endDate: c.endDate,
          daysPastExpiry: Math.floor((new Date() - new Date(c.endDate)) / (1000 * 60 * 60 * 24))
        }))
      },
      recentCampaigns: recentCampaigns.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status,
        isExpired: c.isExpired,
        progress: c.progress,
        created_at: c.created_at,
        current_amount: c.current_amount,
        target_amount: c.target_amount
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// @route   GET /api/campaigns/public
// @desc    Get public campaigns for members (ONLY ACTIVE)
// @access  Public
router.get('/public', async (req, res) => {
  try {
    console.log('Fetching public campaigns for members...');
    
    // Explicitly fetch only active campaigns for public access
    const activeCampaigns = await Campaign.find({ status: 'active' });
    
    console.log(`Found ${activeCampaigns.length} active campaigns for members`);
    
    res.json({ 
      success: true,
      campaigns: activeCampaigns,
      debug: {
        totalCampaigns: activeCampaigns.length,
        activeCampaigns: activeCampaigns.length,
        note: 'Public endpoint only shows active campaigns'
      }
    });
  } catch (error) {
    console.error('Error fetching public campaigns:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch campaigns',
      error: error.message 
    });
  }
});

// @route   GET /api/campaigns/admin
// @desc    Get all campaigns for admin (ALL STATUSES)
// @access  Private/Admin
router.get('/admin', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    console.log('Fetching all campaigns for admin panel...');
    
    const { status, category } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    console.log('Admin filter:', filter);

    // Get ALL campaigns for admin, no default status filter
    const campaigns = await Campaign.find(filter);

    console.log(`Found ${campaigns.length} campaigns for admin`);

    // Get counts by status
    const statusCounts = {
      active: campaigns.filter(c => c.status === 'active').length,
      paused: campaigns.filter(c => c.status === 'paused').length,
      closed: campaigns.filter(c => c.status === 'closed').length,
      completed: campaigns.filter(c => c.status === 'completed').length
    };

    res.json({
      success: true,
      campaigns: campaigns,
      statusCounts: statusCounts,
      debug: {
        totalFound: campaigns.length,
        filter: filter,
        isAdmin: true
      }
    });
  } catch (error) {
    console.error('Get admin campaigns error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching campaigns',
      error: error.message 
    });
  }
});

// @route   GET /api/campaigns
// @desc    Get campaigns with filtering (NO DEFAULT STATUS FILTER)
// @access  Public
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/campaigns called with query:', req.query);
    
    const { status, category } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    console.log('Using filter:', filter);

    // Remove the default status filter - let the query specify what they want
    const campaigns = await Campaign.find(filter);

    console.log(`Found ${campaigns.length} campaigns matching filter`);

    res.json({
      success: true,
      campaigns: campaigns,
      debug: {
        totalFound: campaigns.length,
        filter: filter
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching campaigns',
      error: error.message 
    });
  }
});

// @route   POST /api/campaigns
// @desc    Create new campaign
// @access  Private/Admin
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('POST /api/campaigns called');
    console.log('Request body:', req.body);

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to create campaigns'
      });
    }

    const { 
      title, 
      description, 
      targetAmount, 
      target_amount,
      expectedROI, 
      expected_roi,
      durationMonths, 
      duration_months,
      category,
      minimumInvestment,
      minimum_investment 
    } = req.body;

    // Handle both naming conventions
    const finalTargetAmount = targetAmount || target_amount;
    const finalExpectedROI = expectedROI || expected_roi;
    const finalDurationMonths = durationMonths || duration_months;
    const finalMinimumInvestment = minimumInvestment || minimum_investment || 5000;

    // Validation
    if (!title || !description || !finalTargetAmount || !finalExpectedROI || !finalDurationMonths || !category) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required',
        received: { title, description, finalTargetAmount, finalExpectedROI, finalDurationMonths, category }
      });
    }

    if (finalTargetAmount < 10000) {
      return res.status(400).json({ 
        success: false,
        message: 'Target amount must be at least $10,000' 
      });
    }

    if (finalExpectedROI < 5 || finalExpectedROI > 500) {
      return res.status(400).json({ 
        success: false,
        message: 'Expected ROI must be between 5% and 500%' 
      });
    }

    if (finalDurationMonths < 1 || finalDurationMonths > 60) {
      return res.status(400).json({ 
        success: false,
        message: 'Duration must be between 1 and 60 months' 
      });
    }

    console.log('Creating campaign with data:', {
      title,
      description: description.substring(0, 50) + '...',
      target_amount: parseFloat(finalTargetAmount),
      expected_roi: parseFloat(finalExpectedROI),
      duration_months: parseInt(finalDurationMonths),
      category,
      minimum_investment: parseFloat(finalMinimumInvestment)
    });

    const campaignData = {
      title,
      description,
      target_amount: parseFloat(finalTargetAmount),
      expected_roi: parseFloat(finalExpectedROI),
      duration_months: parseInt(finalDurationMonths),
      category,
      minimum_investment: parseFloat(finalMinimumInvestment),
      created_by: req.user?.id || null,
      status: 'active' // New campaigns start as active
    };

    const savedCampaign = await Campaign.create(campaignData);
    console.log('Campaign created successfully with ID:', savedCampaign.id);

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign: savedCampaign
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error creating campaign',
      error: error.message
    });
  }
});

// @route   PATCH /api/campaigns/:id/status
// @desc    Update campaign status (pause/activate/close)
// @access  Private/Admin
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { status } = req.body;
    const campaignId = req.params.id;

    // Validate status
    const validStatuses = ['active', 'paused', 'closed', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    console.log(`Updating campaign ${campaignId} status to: ${status}`);

    // Check if campaign exists
    const existingCampaign = await Campaign.findById(campaignId);
    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Update status using the model method
    const updatedCampaign = await Campaign.updateStatus(campaignId, status);

    console.log(`Campaign ${campaignId} status updated from ${existingCampaign.status} to ${status}`);

    res.json({
      success: true,
      message: `Campaign ${status === 'active' ? 'activated' : status === 'paused' ? 'paused' : 'closed'} successfully`,
      campaign: updatedCampaign,
      previousStatus: existingCampaign.status,
      newStatus: status
    });

  } catch (error) {
    console.error('Update campaign status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating campaign status',
      error: error.message
    });
  }
});

// @route   GET /api/campaigns/:id
// @desc    Get single campaign
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ 
        success: false,
        message: 'Campaign not found' 
      });
    }

    res.json({
      success: true,
      campaign: campaign
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching campaign' 
    });
  }
});

// @route   GET /api/campaigns/:id/investors-debug
// @desc    Debug investors endpoint
// @access  Public
router.get('/:id/investors-debug', async (req, res) => {
  try {
    const campaignId = req.params.id;
    console.log('DEBUG: Starting investors debug for:', campaignId);
    
    const campaign = await Campaign.findById(campaignId);
    console.log('DEBUG: Campaign result:', !!campaign);
    
    if (!campaign) {
      console.log('DEBUG: Campaign not found');
      return res.json({ error: 'Campaign not found', campaignId });
    }
    
    console.log('DEBUG: Campaign found:', campaign.title, 'Status:', campaign.status);
    console.log('DEBUG: Investment model available:', !!Investment);
    
    const investments = await Investment.find({ campaign_id: campaignId });
    console.log('DEBUG: Found', investments.length, 'investments');
    
    res.json({
      success: true,
      campaignId,
      campaignTitle: campaign.title,
      campaignStatus: campaign.status,
      investmentsFound: investments.length,
      investments: investments.map(inv => ({
        id: inv.id,
        amount: inv.amount,
        user_id: inv.user_id,
        payment_status: inv.payment_status
      }))
    });
    
  } catch (error) {
    console.error('DEBUG: Error:', error);
    res.json({ error: error.message });
  }
});

// @route   GET /api/campaigns/:id/investors
// @desc    Get campaign investors
// @access  Public
router.get('/:id/investors', async (req, res) => {
  try {
    const campaignId = req.params.id;
    console.log('Fetching investors for campaign:', campaignId);

    // Verify campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    console.log(`Campaign found: ${campaign.title} (Status: ${campaign.status})`);

    // Get investments for this campaign
    const investments = await Investment.find({ campaign_id: campaignId });

    console.log(`Found ${investments.length} investments`);

    if (investments.length === 0) {
      return res.json({
        success: true,
        investors: [],
        totalInvested: 0,
        totalInvestors: 0,
        message: 'No investors found for this campaign'
      });
    }

    // Transform investments to investor format
    const investors = [];
    for (const investment of investments) {
      try {
        const user = await User.findById(investment.user_id);
        
        // Calculate current profit and progress
        const updatedInvestment = await Investment.calculateCurrentProfit(investment.id);
        
        investors.push({
          id: investment.id,
          investmentId: investment.id,
          userId: investment.user_id,
          name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || 'Anonymous User' : 'User Not Found',
          email: user?.email || 'N/A',
          profileImage: user?.profile_image || null,
          investmentAmount: parseFloat(investment.amount),
          expectedReturn: parseFloat(updatedInvestment.expected_return || investment.expected_return),
          currentProfit: parseFloat(updatedInvestment.current_profit || 0),
          progress: updatedInvestment.progress || 0,
          investmentDate: investment.investment_date || investment.created_at,
          status: updatedInvestment.status || investment.status,
          paymentStatus: investment.payment_status || 'pending',
          maturityDate: investment.maturity_date,
          userJoinDate: user?.created_at
        });
      } catch (investorError) {
        console.error('Error processing investor:', investorError);
        // Add investor with limited info
        investors.push({
          id: investment.id,
          investmentId: investment.id,
          userId: investment.user_id,
          name: 'Unknown User',
          email: 'N/A',
          investmentAmount: parseFloat(investment.amount),
          expectedReturn: parseFloat(investment.expected_return || 0),
          currentProfit: 0,
          progress: 0,
          investmentDate: investment.created_at,
          status: investment.status || 'active',
          paymentStatus: investment.payment_status || 'pending'
        });
      }
    }

    const totalInvested = investors.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0);
    const averageInvestment = investors.length > 0 ? totalInvested / investors.length : 0;

    console.log(`Returning ${investors.length} investors, total: $${totalInvested}`);

    res.json({
      success: true,
      investors: investors,
      totalInvestors: investors.length,
      totalInvested: totalInvested,
      averageInvestment: Math.round(averageInvestment * 100) / 100,
      campaign: {
        id: campaign.id,
        title: campaign.title,
        status: campaign.status,
        target_amount: campaign.target_amount,
        current_amount: campaign.current_amount
      },
      debug: {
        campaignId: campaignId,
        campaignTitle: campaign.title,
        campaignStatus: campaign.status,
        investmentsFound: investments.length
      }
    });

  } catch (error) {
    console.error('Error in investors endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign investors',
      error: error.message,
      investors: [],
      totalInvested: 0,
      totalInvestors: 0
    });
  }
});

// @route   PUT /api/campaigns/:id
// @desc    Update campaign details
// @access  Private/Admin
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign: campaign
    });

  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating campaign',
      error: error.message
    });
  }
});

// @route   DELETE /api/campaigns/:id
// @desc    Close campaign (soft delete)
// @access  Private/Admin
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const campaign = await Campaign.updateStatus(req.params.id, 'closed');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      message: 'Campaign closed successfully',
      campaign: campaign
    });

  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error closing campaign',
      error: error.message
    });
  }
});

module.exports = router;
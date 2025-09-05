const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  sendDonationSuccess,
  sendLoanEligibility,
  sendGlobalNotification
} = require('../controllers/notificationController');

// Member notification endpoints
router.get('/my-notifications', authenticateToken, async (req, res) => {
  try {
    // Sample notifications for member - replace with database query in production
    const notifications = [
      {
        id: 1,
        userId: req.user.id,
        type: 'donation_success',
        title: 'Investment Confirmed',
        message: 'Your $500 investment in Poultry Farm Investment was confirmed. Expected return: $1,000 in 3 months.',
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        actionUrl: null,
        actionText: null
      },
      {
        id: 2,
        userId: req.user.id,
        type: 'referral_bonus',
        title: 'Referral Bonus Earned',
        message: 'You earned $12 commission from Francis Obinna\'s investment. Bonus added to your wallet.',
        isRead: false,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        actionUrl: null,
        actionText: null
      },
      {
        id: 3,
        userId: req.user.id,
        type: 'loan_eligible',
        title: 'Loan Eligibility Achieved',
        message: 'Congratulations! You now qualify for loans up to $9,600. Apply now in the Loans section.',
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        actionUrl: '/dashboard?tab=loans',
        actionText: 'Apply for Loan'
      },
      {
        id: 4,
        userId: req.user.id,
        type: 'investment_matured',
        title: 'Investment Matured',
        message: 'Your Fish Farm investment has matured! Claim your profit of $320 now.',
        isRead: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        actionUrl: '/dashboard?tab=investments',
        actionText: 'Claim Profit'
      },
      {
        id: 5,
        userId: req.user.id,
        type: 'system_announcement',
        title: 'New Investment Campaign Available',
        message: 'Check out our new Real Estate Development campaign with 120% ROI in 6 months.',
        isRead: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        actionUrl: '/dashboard?tab=invest',
        actionText: 'View Campaign'
      }
    ];
    
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
});

router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    // In production, update the notification in database
    // await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    
    res.json({ 
      success: true, 
      message: 'Notification marked as read' 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    // In production, update all user notifications in database
    // await Notification.updateMany(
    //   { userId: req.user.id, isRead: false }, 
    //   { isRead: true }
    // );
    
    res.json({ 
      success: true, 
      message: 'All notifications marked as read' 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
});

// Admin-only routes for sending notifications
router.post('/donation-success', authenticateToken, requireAdmin, sendDonationSuccess);
router.post('/loan-eligibility', authenticateToken, requireAdmin, sendLoanEligibility);
router.post('/global', authenticateToken, requireAdmin, sendGlobalNotification);

// Test route to check if notifications endpoint is working
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Notification routes are working!',
    endpoints: [
      'GET /api/notifications/my-notifications',
      'PUT /api/notifications/:notificationId/read',
      'PUT /api/notifications/mark-all-read',
      'POST /api/notifications/donation-success (Admin)',
      'POST /api/notifications/loan-eligibility (Admin)', 
      'POST /api/notifications/global (Admin)'
    ]
  });
});

module.exports = router;
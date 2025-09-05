const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// In-memory storage for development (replace with MongoDB models in production)
let supportTickets = [
  {
    id: 1,
    memberId: 'ELV00002',
    memberName: 'Francis Obinna',
    email: 'francis@email.com',
    subject: 'Investment Return Inquiry',
    message: 'When will my Poultry Farm investment mature? I invested $500 last month.',
    category: 'Investment Issue',
    status: 'Open',
    priority: 'Medium',
    createdAt: new Date().toISOString().split('T')[0],
    updatedAt: new Date().toISOString().split('T')[0]
  }
];

// Create new support ticket
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;
    
    if (!subject || !message || !category) {
      return res.status(400).json({
        success: false,
        message: 'Subject, message, and category are required'
      });
    }

    const newTicket = {
      id: supportTickets.length + 1,
      memberId: req.user.userId,
      memberName: req.user.name || req.user.username,
      email: req.user.email,
      subject,
      message,
      category,
      status: 'Open',
      priority: priority || 'Medium',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    supportTickets.push(newTicket);

    // Send notification to admins about new ticket
    console.log(`New support ticket created: ${newTicket.id} by ${newTicket.memberName}`);

    res.json({
      success: true,
      message: 'Support ticket created successfully',
      ticket: newTicket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support ticket'
    });
  }
});

// Get user's own tickets
router.get('/my-tickets', authenticateToken, async (req, res) => {
  try {
    const userTickets = supportTickets
      .filter(ticket => ticket.memberId === req.user.userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      tickets: userTickets
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets'
    });
  }
});

// Get specific ticket details (only if user owns it)
router.get('/ticket/:ticketId', authenticateToken, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const ticket = supportTickets.find(t => t.id === ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.memberId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket'
    });
  }
});

// Admin routes - get all tickets
router.get('/admin/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const allTickets = supportTickets.sort((a, b) => {
      // Sort by status (Open first), then by priority, then by date
      const statusOrder = { 'Open': 0, 'In Review': 1, 'Resolved': 2 };
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      tickets: allTickets,
      stats: {
        total: supportTickets.length,
        open: supportTickets.filter(t => t.status === 'Open').length,
        inReview: supportTickets.filter(t => t.status === 'In Review').length,
        resolved: supportTickets.filter(t => t.status === 'Resolved').length
      }
    });
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets'
    });
  }
});

// Admin route - update ticket status
router.put('/admin/:ticketId/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const ticketId = parseInt(req.params.ticketId);
    const { status } = req.body;
    
    if (!['Open', 'In Review', 'Resolved'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const ticketIndex = supportTickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    supportTickets[ticketIndex] = {
      ...supportTickets[ticketIndex],
      status,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    res.json({
      success: true,
      message: 'Ticket status updated',
      ticket: supportTickets[ticketIndex]
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ticket'
    });
  }
});

module.exports = router;
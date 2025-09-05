const supabase = require('../config/database');

class Campaign {
  static async find(filters = {}) {
    try {
      let query = supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      // Add filters WITHOUT forcing active status
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      // REMOVED: Default to active campaigns - let the caller decide

      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }

      if (filters.created_by || filters.createdBy) {
        query = query.eq('created_by', filters.created_by || filters.createdBy);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Campaign find error:', error);
        throw error;
      }

      // Add virtual fields to each campaign
      return (data || []).map(campaign => this.addVirtuals(campaign));
    } catch (error) {
      throw new Error(`Failed to fetch campaigns: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        return this.addVirtuals(data);
      }
      
      return null;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find campaign: ${error.message}`);
    }
  }

  static async create(campaignData) {
    try {
      // Calculate end date from duration
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (campaignData.durationMonths) {
        endDate.setMonth(endDate.getMonth() + campaignData.durationMonths);
      } else if (campaignData.end_date || campaignData.endDate) {
        endDate = new Date(campaignData.end_date || campaignData.endDate);
      }

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          title: campaignData.title,
          description: campaignData.description,
          target_amount: campaignData.target_amount || campaignData.targetAmount,
          current_amount: 0, // Same as raisedAmount
          minimum_investment: campaignData.minimum_investment || campaignData.minimumInvestment || 100,
          expected_roi: campaignData.expected_roi || campaignData.expectedROI,
          duration_months: campaignData.duration_months || campaignData.durationMonths,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          participants: 0,
          category: campaignData.category,
          risk_level: campaignData.risk_level || campaignData.riskLevel,
          expected_return: campaignData.expected_return || campaignData.expectedReturn,
          image_url: campaignData.image_url || campaignData.imageUrl,
          created_by: campaignData.created_by || campaignData.createdBy,
          status: campaignData.status || 'active' // Default to active but allow override
        })
        .select()
        .single();

      if (error) {
        console.error('Campaign creation error:', error);
        throw error;
      }

      return this.addVirtuals(data);
    } catch (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  }

  static async updateAmount(id, newAmount) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ 
          current_amount: newAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Auto-update status if needed
      await this.updateStatus(id);
      
      return this.addVirtuals(data);
    } catch (error) {
      throw new Error(`Failed to update campaign amount: ${error.message}`);
    }
  }

  static async addInvestment(campaignId, investmentAmount) {
    try {
      const campaign = await this.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const newAmount = parseFloat(campaign.current_amount) + parseFloat(investmentAmount);
      const newParticipants = (campaign.participants || 0) + 1;

      // Determine new status - only change to completed if target reached
      let newStatus = campaign.status;
      if (newAmount >= parseFloat(campaign.target_amount) && campaign.status === 'active') {
        newStatus = 'completed';
      }

      const { data, error } = await supabase
        .from('campaigns')
        .update({ 
          current_amount: newAmount,
          participants: newParticipants,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .select()
        .single();

      if (error) throw error;
      return this.addVirtuals(data);
    } catch (error) {
      throw new Error(`Failed to add investment to campaign: ${error.message}`);
    }
  }

  static async updateStatus(campaignId, forcedStatus = null) {
    try {
      const campaign = await this.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      let newStatus = forcedStatus || campaign.status;
      
      if (!forcedStatus) {
        // Only auto-update status for active campaigns
        if (campaign.status === 'active') {
          const isFullyFunded = parseFloat(campaign.current_amount) >= parseFloat(campaign.target_amount);
          const isExpired = new Date() > new Date(campaign.end_date);
          
          if (isFullyFunded) {
            newStatus = 'completed';
          } else if (isExpired) {
            newStatus = 'closed';
          }
        }
      }

      if (newStatus !== campaign.status) {
        const { data, error } = await supabase
          .from('campaigns')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', campaignId)
          .select()
          .single();

        if (error) throw error;
        return this.addVirtuals(data);
      }

      return this.addVirtuals(campaign);
    } catch (error) {
      throw new Error(`Failed to update campaign status: ${error.message}`);
    }
  }

  static async getInvestmentStats(id) {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('amount, payment_status')
        .eq('campaign_id', id);

      if (error) throw error;

      const stats = {
        totalInvestments: data.length,
        totalAmount: data
          .filter(inv => inv.payment_status === 'confirmed')
          .reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
        pendingAmount: data
          .filter(inv => inv.payment_status === 'pending')
          .reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
        participants: data.filter(inv => inv.payment_status === 'confirmed').length
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to get investment stats: ${error.message}`);
    }
  }

  // Add virtual fields (like mongoose virtuals)
  static addVirtuals(campaign) {
    if (!campaign) return null;

    const targetAmount = parseFloat(campaign.target_amount) || 0;
    const currentAmount = parseFloat(campaign.current_amount) || 0;
    const endDate = new Date(campaign.end_date);
    const now = new Date();

    return {
      ...campaign,
      // Virtual fields from original mongoose schema
      progress: Math.min(Math.round((currentAmount / targetAmount) * 100), 100),
      isFullyFunded: currentAmount >= targetAmount,
      isExpired: now > endDate,
      raisedAmount: currentAmount, // Alias for compatibility
      targetAmount: targetAmount, // Alias for compatibility
      expectedROI: campaign.expected_roi, // Alias for compatibility
      durationMonths: campaign.duration_months, // Alias for compatibility
      startDate: campaign.start_date, // Alias for compatibility
      endDate: campaign.end_date, // Alias for compatibility
      createdBy: campaign.created_by, // Alias for compatibility
      // Add status display helpers
      isActive: campaign.status === 'active',
      isPaused: campaign.status === 'paused',
      isClosed: campaign.status === 'closed',
      isCompleted: campaign.status === 'completed',
      statusDisplay: campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)
    };
  }

  // Legacy mongoose compatibility methods
  static async findByIdAndUpdate(id, updateData, options = {}) {
    try {
      // Handle mongoose-style field names
      if (updateData.raisedAmount !== undefined) {
        updateData.current_amount = updateData.raisedAmount;
        delete updateData.raisedAmount;
      }
      if (updateData.targetAmount !== undefined) {
        updateData.target_amount = updateData.targetAmount;
        delete updateData.targetAmount;
      }

      const { data, error } = await supabase
        .from('campaigns')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.addVirtuals(data);
    } catch (error) {
      throw new Error(`Failed to update campaign: ${error.message}`);
    }
  }

  static async findOne(query) {
    if (query._id || query.id) {
      return await this.findById(query._id || query.id);
    }
    
    // Handle other query types
    const campaigns = await this.find(query);
    return campaigns.length > 0 ? campaigns[0] : null;
  }

  // Get campaigns by user
  static async findByCreatedBy(userId) {
    return await this.find({ created_by: userId });
  }

  // Get active campaigns only
  static async findActive(filters = {}) {
    return await this.find({ ...filters, status: 'active' });
  }

  // Get campaigns by status
  static async findByStatus(status, filters = {}) {
    return await this.find({ ...filters, status: status });
  }

  // Get paused campaigns
  static async findPaused(filters = {}) {
    return await this.find({ ...filters, status: 'paused' });
  }

  // Get closed campaigns
  static async findClosed(filters = {}) {
    return await this.find({ ...filters, status: 'closed' });
  }

  // Get completed campaigns
  static async findCompleted(filters = {}) {
    return await this.find({ ...filters, status: 'completed' });
  }
}

module.exports = Campaign;
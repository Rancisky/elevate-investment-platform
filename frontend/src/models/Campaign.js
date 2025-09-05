const supabase = require('../config/database');

class Campaign {
  static async findAll(filters = {}) {
    try {
      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Add filters if provided
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Campaign findAll error:', error);
        throw error;
      }

      return data || [];
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
      
      return data;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null; // Campaign not found
      }
      throw new Error(`Failed to find campaign: ${error.message}`);
    }
  }

  static async create(campaignData) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          title: campaignData.title,
          description: campaignData.description,
          target_amount: campaignData.target_amount || campaignData.targetAmount,
          current_amount: 0,
          minimum_investment: campaignData.minimum_investment || campaignData.minimumInvestment || 100,
          end_date: campaignData.end_date || campaignData.endDate,
          category: campaignData.category,
          risk_level: campaignData.risk_level || campaignData.riskLevel,
          expected_return: campaignData.expected_return || campaignData.expectedReturn,
          image_url: campaignData.image_url || campaignData.imageUrl,
          created_by: campaignData.created_by || campaignData.createdBy,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Campaign creation error:', error);
        throw error;
      }

      return data;
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
      return data;
    } catch (error) {
      throw new Error(`Failed to update campaign amount: ${error.message}`);
    }
  }

  static async incrementAmount(id, amount) {
    try {
      // First get current amount
      const campaign = await this.findById(id);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const newAmount = parseFloat(campaign.current_amount) + parseFloat(amount);
      return await this.updateAmount(id, newAmount);
    } catch (error) {
      throw new Error(`Failed to increment campaign amount: ${error.message}`);
    }
  }

  static async updateStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
          .filter(inv => inv.payment_status === 'completed')
          .reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
        pendingAmount: data
          .filter(inv => inv.payment_status === 'pending')
          .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to get investment stats: ${error.message}`);
    }
  }
}

module.exports = Campaign;
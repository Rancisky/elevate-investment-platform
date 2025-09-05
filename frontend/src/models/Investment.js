const supabase = require('../config/database');

class Investment {
  static async create(investmentData) {
    try {
      const { data, error } = await supabase
        .from('investments')
        .insert({
          user_id: investmentData.user_id || investmentData.userId,
          campaign_id: investmentData.campaign_id || investmentData.campaignId,
          amount: investmentData.amount,
          payment_id: investmentData.payment_id || investmentData.paymentId,
          payment_status: investmentData.payment_status || 'pending',
          payment_method: investmentData.payment_method || investmentData.paymentMethod
        })
        .select()
        .single();

      if (error) {
        console.error('Investment creation error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to create investment: ${error.message}`);
    }
  }

  static async findByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          campaigns (
            id,
            title,
            target_amount,
            current_amount,
            category,
            risk_level,
            expected_return,
            image_url,
            status
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Investment findByUserId error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch user investments: ${error.message}`);
    }
  }

  static async findByCampaignId(campaignId) {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          users (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch campaign investments: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          campaigns (
            id,
            title,
            target_amount,
            current_amount,
            category
          ),
          users (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null; // Investment not found
      }
      throw new Error(`Failed to find investment: ${error.message}`);
    }
  }

  static async findByPaymentId(paymentId) {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('payment_id', paymentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null; // Investment not found
      }
      throw new Error(`Failed to find investment by payment ID: ${error.message}`);
    }
  }

  static async updatePaymentStatus(id, status, transactionHash = null) {
    try {
      const updateData = { 
        payment_status: status,
        updated_at: new Date().toISOString()
      };
      
      if (transactionHash) {
        updateData.transaction_hash = transactionHash;
      }

      const { data, error } = await supabase
        .from('investments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  static async getUserInvestmentStats(userId) {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('amount, payment_status')
        .eq('user_id', userId);

      if (error) throw error;

      const stats = {
        totalInvestments: data.length,
        totalAmount: data
          .filter(inv => inv.payment_status === 'completed')
          .reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
        pendingAmount: data
          .filter(inv => inv.payment_status === 'pending')
          .reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
        completedInvestments: data.filter(inv => inv.payment_status === 'completed').length,
        pendingInvestments: data.filter(inv => inv.payment_status === 'pending').length
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to get user investment stats: ${error.message}`);
    }
  }

  static async getTotalInvestments() {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('amount, payment_status');

      if (error) throw error;

      const totalAmount = data
        .filter(inv => inv.payment_status === 'completed')
        .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

      return {
        count: data.length,
        totalAmount: totalAmount,
        completedCount: data.filter(inv => inv.payment_status === 'completed').length
      };
    } catch (error) {
      throw new Error(`Failed to get total investments: ${error.message}`);
    }
  }
}

module.exports = Investment;
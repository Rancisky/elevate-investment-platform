const supabase = require('../config/database');

class Investment {
  static async create(investmentData) {
    try {
      // Calculate maturity date from duration
      const investmentDate = new Date();
      const maturityDate = new Date(investmentDate);
      if (investmentData.durationMonths) {
        maturityDate.setMonth(maturityDate.getMonth() + investmentData.durationMonths);
      }

      const { data, error } = await supabase
        .from('investments')
        .insert({
          user_id: investmentData.user_id || investmentData.userId || investmentData.user,
          campaign_id: investmentData.campaign_id || investmentData.campaignId || investmentData.campaign,
          campaign_title: investmentData.campaign_title || investmentData.campaignTitle,
          amount: investmentData.amount,
          expected_return: investmentData.expected_return || investmentData.expectedReturn,
          actual_return: 0,
          current_profit: 0,
          status: 'active',
          progress: 0,
          maturity_date: maturityDate.toISOString(),
          investment_date: investmentDate.toISOString(),
          can_withdraw_early: false,
          profit_claimed: false,
          roi_percentage: investmentData.roi_percentage || investmentData.roiPercentage,
          duration_months: investmentData.duration_months || investmentData.durationMonths,
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

      return this.addBusinessLogic(data);
    } catch (error) {
      throw new Error(`Failed to create investment: ${error.message}`);
    }
  }

  static async find(query = {}) {
    try {
      let supabaseQuery = supabase.from('investments').select(`
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
      `);

      // Apply filters
      if (query.user_id || query.userId || query.user) {
        supabaseQuery = supabaseQuery.eq('user_id', query.user_id || query.userId || query.user);
      }
      
      if (query.campaign_id || query.campaignId || query.campaign) {
        supabaseQuery = supabaseQuery.eq('campaign_id', query.campaign_id || query.campaignId || query.campaign);
      }
      
      if (query.payment_status) {
        supabaseQuery = supabaseQuery.eq('payment_status', query.payment_status);
      }

      if (query.status) {
        supabaseQuery = supabaseQuery.eq('status', query.status);
      }

      supabaseQuery = supabaseQuery.order('created_at', { ascending: false });

      const { data, error } = await supabaseQuery;

      if (error) {
        console.error('Investment find error:', error);
        throw error;
      }

      return (data || []).map(investment => this.addBusinessLogic(investment));
    } catch (error) {
      throw new Error(`Failed to fetch investments: ${error.message}`);
    }
  }

  static async findByUserId(userId) {
    return await this.find({ user_id: userId });
  }

  static async findByCampaignId(campaignId) {
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          users (
            id,
            name,
            username,
            email
          )
        `)
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(investment => this.addBusinessLogic(investment));
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
            name,
            username,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        return this.addBusinessLogic(data);
      }
      
      return null;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find investment: ${error.message}`);
    }
  }

  static async calculateCurrentProfit(investmentId) {
    try {
      const investment = await this.findById(investmentId);
      if (!investment) {
        throw new Error('Investment not found');
      }

      const now = new Date();
      const investmentDate = new Date(investment.investment_date);
      const maturityDate = new Date(investment.maturity_date);
      
      const totalDuration = maturityDate.getTime() - investmentDate.getTime();
      const elapsed = now.getTime() - investmentDate.getTime();
      
      // Calculate progress percentage
      const progress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
      
      // Calculate current profit (linear progression)
      const totalProfit = parseFloat(investment.expected_return) - parseFloat(investment.amount);
      const currentProfit = Math.round((totalProfit * progress) / 100);
      
      // Enable early withdrawal after 30 days
      const canWithdrawEarly = elapsed > 30 * 24 * 60 * 60 * 1000;
      
      // Determine status
      let status = investment.status;
      if (now >= maturityDate && status === 'active') {
        status = 'matured';
      }

      // Update the investment
      const { data, error } = await supabase
        .from('investments')
        .update({
          progress: progress,
          current_profit: currentProfit,
          can_withdraw_early: canWithdrawEarly,
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', investmentId)
        .select()
        .single();

      if (error) throw error;
      return this.addBusinessLogic(data);
    } catch (error) {
      throw new Error(`Failed to calculate current profit: ${error.message}`);
    }
  }

  static async processEarlyWithdrawal(investmentId) {
    try {
      const investment = await this.calculateCurrentProfit(investmentId);
      
      if (!investment.can_withdraw_early || investment.status !== 'active') {
        throw new Error('Early withdrawal not allowed');
      }
      
      // 30% penalty on profits
      const penalty = parseFloat(investment.current_profit) * 0.3;
      const withdrawableProfit = parseFloat(investment.current_profit) - penalty;
      const totalWithdrawal = parseFloat(investment.amount) + withdrawableProfit;
      
      const { data, error } = await supabase
        .from('investments')
        .update({
          status: 'early_withdrawn',
          early_withdrawal_date: new Date().toISOString(),
          actual_return: totalWithdrawal,
          updated_at: new Date().toISOString()
        })
        .eq('id', investmentId)
        .select()
        .single();

      if (error) throw error;

      return {
        investment: this.addBusinessLogic(data),
        withdrawal: {
          originalAmount: parseFloat(investment.amount),
          currentProfit: parseFloat(investment.current_profit),
          penalty: penalty,
          withdrawableProfit: withdrawableProfit,
          totalWithdrawal: totalWithdrawal
        }
      };
    } catch (error) {
      throw new Error(`Failed to process early withdrawal: ${error.message}`);
    }
  }

  static async claimProfit(investmentId) {
    try {
      const investment = await this.calculateCurrentProfit(investmentId);
      
      if (investment.status !== 'matured') {
        throw new Error('Investment not yet matured');
      }
      
      if (investment.profit_claimed) {
        throw new Error('Profit already claimed');
      }
      
      const profit = parseFloat(investment.expected_return) - parseFloat(investment.amount);
      
      const { data, error } = await supabase
        .from('investments')
        .update({
          profit_claimed: true,
          profit_claimed_date: new Date().toISOString(),
          actual_return: investment.expected_return,
          status: 'withdrawn',
          updated_at: new Date().toISOString()
        })
        .eq('id', investmentId)
        .select()
        .single();

      if (error) throw error;

      return {
        investment: this.addBusinessLogic(data),
        profit: {
          profit: profit,
          totalReturn: parseFloat(investment.expected_return)
        }
      };
    } catch (error) {
      throw new Error(`Failed to claim profit: ${error.message}`);
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
      return this.addBusinessLogic(data);
    } catch (error) {
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  // Add business logic and virtual fields (like mongoose methods)
  static addBusinessLogic(investment) {
    if (!investment) return null;

    // Add alias fields for compatibility
    return {
      ...investment,
      // Mongoose compatibility aliases
      user: investment.user_id,
      campaign: investment.campaign_id,
      campaignTitle: investment.campaign_title,
      expectedReturn: investment.expected_return,
      actualReturn: investment.actual_return,
      currentProfit: investment.current_profit,
      maturityDate: investment.maturity_date,
      investmentDate: investment.investment_date,
      canWithdrawEarly: investment.can_withdraw_early,
      earlyWithdrawalDate: investment.early_withdrawal_date,
      profitClaimed: investment.profit_claimed,
      profitClaimedDate: investment.profit_claimed_date,
      roiPercentage: investment.roi_percentage,
      durationMonths: investment.duration_months
    };
  }

  // Get user investment statistics
  static async getUserInvestmentStats(userId) {
    try {
      const investments = await this.findByUserId(userId);
      
      const stats = {
        totalInvestments: investments.length,
        activeInvestments: investments.filter(inv => inv.status === 'active').length,
        maturedInvestments: investments.filter(inv => inv.status === 'matured').length,
        totalAmount: investments
          .filter(inv => inv.payment_status === 'completed')
          .reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
        totalCurrentProfit: investments
          .filter(inv => inv.status === 'active' || inv.status === 'matured')
          .reduce((sum, inv) => sum + parseFloat(inv.current_profit || 0), 0),
        pendingAmount: investments
          .filter(inv => inv.payment_status === 'pending')
          .reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to get user investment stats: ${error.message}`);
    }
  }

  // Legacy mongoose compatibility methods
  static async findByIdAndUpdate(id, updateData, options = {}) {
    try {
      const { data, error } = await supabase
        .from('investments')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.addBusinessLogic(data);
    } catch (error) {
      throw new Error(`Failed to update investment: ${error.message}`);
    }
  }

  static async findOne(query) {
    if (query._id || query.id) {
      return await this.findById(query._id || query.id);
    }
    
    const results = await this.find(query);
    return results.length > 0 ? results[0] : null;
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
      
      return data ? this.addBusinessLogic(data) : null;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find investment by payment ID: ${error.message}`);
    }
  }
}

module.exports = Investment;
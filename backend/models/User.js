const supabase = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      // Generate unique userId
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      
      const userId = `ELV${(count + 1).toString().padStart(5, '0')}`;
      const referralCode = userData.username || userData.email.split('@')[0];

      // Check loan eligibility
      const directReferrals = 0;
      const totalDonations = 0;
      const isLoanEligible = directReferrals >= 50 && totalDonations >= 1000000;

      const { data, error } = await supabase
        .from('users')
        .insert({
          name: userData.name,
          username: userData.username,
          email: userData.email,
          password_hash: hashedPassword,
          phone: userData.phone,
          address: userData.address,
          occupation: userData.occupation,
          monthly_income: userData.monthlyIncome,
          user_id: userId,
          referral_code: referralCode,
          referred_by: userData.referredBy || null,
          direct_referrals: 0,
          total_donations: 0,
          total_contributions: 0,
          available_loan: 0,
          next_contribution: null,
          is_loan_eligible: isLoanEligible,
          role: 'member',
          wallet: {
            level1Earnings: 0,
            level2Earnings: 0,
            level3Earnings: 0,
            donationProfits: 0,
            availableWithdrawal: 0,
            totalWithdrawn: 0,
            pendingWithdrawal: 0
          },
          bank_details: {
            bankName: '',
            accountNumber: '',
            accountName: ''
          },
          is_active: true,
          join_date: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('User creation error:', error);
        throw error;
      }

      // Remove password_hash from returned data
      const { password_hash, ...userWithoutPassword } = data;
      return userWithoutPassword;
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  static async findByUsername(username) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by username: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        // Remove password_hash from returned data
        const { password_hash, ...userWithoutPassword } = data;
        return userWithoutPassword;
      }
      
      return data;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  static async findByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find user by userId: ${error.message}`);
    }
  }

  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async addReferralCommission(userId, level, amount) {
    try {
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found');

      const wallet = user.wallet || {};
      
      if (level === 1) {
        wallet.level1Earnings = (wallet.level1Earnings || 0) + amount;
      } else if (level === 2) {
        wallet.level2Earnings = (wallet.level2Earnings || 0) + amount;
      } else if (level === 3) {
        wallet.level3Earnings = (wallet.level3Earnings || 0) + amount;
      }

      // Update available withdrawal
      wallet.availableWithdrawal = 
        (wallet.level1Earnings || 0) +
        (wallet.level2Earnings || 0) +
        (wallet.level3Earnings || 0) +
        (wallet.donationProfits || 0) -
        (wallet.totalWithdrawn || 0) -
        (wallet.pendingWithdrawal || 0);

      const { data, error } = await supabase
        .from('users')
        .update({ wallet })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to add referral commission: ${error.message}`);
    }
  }

  static async addContribution(userId, amount) {
    try {
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found');

      const newTotalContributions = (user.total_contributions || 0) + amount;
      const nextContribution = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('users')
        .update({ 
          total_contributions: newTotalContributions,
          next_contribution: nextContribution
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to add contribution: ${error.message}`);
    }
  }

  static async calculateAvailableLoan(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found');

      let availableLoan = 0;
      const isLoanEligible = (user.direct_referrals || 0) >= 50 && (user.total_donations || 0) >= 1000000;
      
      if (isLoanEligible) {
        const baseAmount = (user.total_contributions || 0) * 0.5;
        const referralBonus = (user.direct_referrals || 0) * 5000;
        availableLoan = Math.min(baseAmount + referralBonus, 500000);
      }

      const { data, error } = await supabase
        .from('users')
        .update({ 
          available_loan: availableLoan,
          is_loan_eligible: isLoanEligible
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to calculate available loan: ${error.message}`);
    }
  }

  static async getDownline(username, levels = 3) {
    try {
      const downline = { level1: [], level2: [], level3: [] };

      // Level 1 - Direct referrals
      const { data: level1, error: error1 } = await supabase
        .from('users')
        .select('username, name, user_id, direct_referrals, total_donations, created_at')
        .eq('referred_by', username);

      if (error1) throw error1;
      downline.level1 = level1 || [];

      if (levels > 1 && level1 && level1.length > 0) {
        // Level 2
        const level1Usernames = level1.map(user => user.username);
        const { data: level2, error: error2 } = await supabase
          .from('users')
          .select('username, name, user_id, direct_referrals, total_donations, created_at')
          .in('referred_by', level1Usernames);

        if (error2) throw error2;
        downline.level2 = level2 || [];

        if (levels > 2 && level2 && level2.length > 0) {
          // Level 3
          const level2Usernames = level2.map(user => user.username);
          const { data: level3, error: error3 } = await supabase
            .from('users')
            .select('username, name, user_id, direct_referrals, total_donations, created_at')
            .in('referred_by', level2Usernames);

          if (error3) throw error3;
          downline.level3 = level3 || [];
        }
      }

      return downline;
    } catch (error) {
      console.error('Error getting downline:', error);
      return { level1: [], level2: [], level3: [] };
    }
  }

  static async getStats(userId) {
    try {
      const user = await this.findById(userId);
      if (!user) throw new Error('User not found');

      const wallet = user.wallet || {};
      const totalEarnings = (wallet.level1Earnings || 0) + 
                           (wallet.level2Earnings || 0) + 
                           (wallet.level3Earnings || 0) + 
                           (wallet.donationProfits || 0);

      return {
        totalReferrals: user.direct_referrals || 0,
        totalEarnings,
        totalContributions: user.total_contributions || 0,
        totalDonations: user.total_donations || 0,
        availableWithdrawal: wallet.availableWithdrawal || 0,
        availableLoan: user.available_loan || 0,
        isLoanEligible: user.is_loan_eligible || false,
        memberSince: user.join_date || user.created_at
      };
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
  }

  static async updateBankDetails(userId, bankDetails) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ bank_details: bankDetails })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update bank details: ${error.message}`);
    }
  }

  // Legacy mongoose compatibility methods
  static async findByIdAndUpdate(id, updateData, options = {}) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Remove password_hash from returned data
      if (data && data.password_hash) {
        const { password_hash, ...userWithoutPassword } = data;
        return userWithoutPassword;
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  static async findOne(query) {
    if (query.email) {
      return await this.findByEmail(query.email);
    }
    if (query.username) {
      return await this.findByUsername(query.username);
    }
    if (query._id || query.id) {
      return await this.findById(query._id || query.id);
    }
    if (query.userId || query.user_id) {
      return await this.findByUserId(query.userId || query.user_id);
    }
    throw new Error('Unsupported query');
  }

  static async find(query = {}) {
    try {
      let supabaseQuery = supabase.from('users').select('*');

      if (query.referred_by || query.referredBy) {
        supabaseQuery = supabaseQuery.eq('referred_by', query.referred_by || query.referredBy);
      }
      
      if (query.role) {
        supabaseQuery = supabaseQuery.eq('role', query.role);
      }
      
      if (query.is_active !== undefined) {
        supabaseQuery = supabaseQuery.eq('is_active', query.is_active);
      }

      const { data, error } = await supabaseQuery;

      if (error) throw error;
      
      // Remove password_hash from all returned data
      return (data || []).map(user => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      throw new Error(`Failed to find users: ${error.message}`);
    }
  }

  static async countDocuments(query = {}) {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });

      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw new Error(`Failed to count users: ${error.message}`);
    }
  }
}

module.exports = User;
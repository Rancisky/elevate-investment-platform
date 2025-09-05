const supabase = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: hashedPassword,
          first_name: userData.firstName || userData.first_name,
          last_name: userData.lastName || userData.last_name,
          phone: userData.phone
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
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, phone, kyc_status, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(`Failed to find user by ID: ${error.message}`);
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateKYCStatus(userId, status) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ kyc_status: status, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select('id, email, first_name, last_name, phone, kyc_status, updated_at')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update KYC status: ${error.message}`);
    }
  }

  static async updateProfile(userId, updateData) {
    try {
      const allowedFields = ['first_name', 'last_name', 'phone'];
      const filteredData = {};
      
      Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredData[key] = updateData[key];
        }
      });
      
      filteredData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .update(filteredData)
        .eq('id', userId)
        .select('id, email, first_name, last_name, phone, kyc_status, updated_at')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  }
}

module.exports = User;
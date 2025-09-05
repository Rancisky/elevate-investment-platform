const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elevate-network', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Generate admin user ID and referral code
    const userCount = await User.countDocuments();
    const adminUserId = `ELV${(userCount + 1).toString().padStart(5, '0')}`;

    // Create admin user
    const adminData = {
      name: 'Admin User',
      email: 'admin@elevate-network.com',
      password: 'admin123456', // Change this!
      phone: '+2348000000000',
      userId: adminUserId,
      referralCode: adminUserId,
      role: 'admin'
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('Admin user created successfully!');
    console.log('Email:', admin.email);
    console.log('User ID:', admin.userId);
    console.log('Password: admin123456 (PLEASE CHANGE THIS!)');
    console.log('\nYou can now login to the admin panel with these credentials.');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
    process.exit(0);
  }
};

createAdmin();
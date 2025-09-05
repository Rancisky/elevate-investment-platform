const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import Supabase database connection
const supabase = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Development user setup function
const createDevUser = async () => {
  if (process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV === 'development') {
    try {
      const devUserId = '12345678-1234-1234-1234-123456789abc';
      
      console.log('🔧 Setting up development environment...');
      
      // Check if dev user exists
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', devUserId)
        .single();
      
      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking for dev user:', selectError);
        return;
      }
      
      if (!existingUser) {
        // Create the dev admin user
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: devUserId,
            username: 'dev-admin',
            email: 'admin@dev.com',
            role: 'admin',
            is_active: true,
            join_date: new Date().toISOString(),
            total_donations: 0,
            direct_referrals: 0,
            is_loan_eligible: false,
            wallet_balance: 0
          });
        
        if (insertError) {
          console.error('❌ Failed to create dev user:', insertError);
          console.log('⚠️ You may need to create the users table or adjust the schema');
        } else {
          console.log('✅ Development admin user created successfully');
        }
      } else {
        console.log('✅ Development admin user already exists');
      }
    } catch (error) {
      console.error('❌ Error setting up dev user:', error);
      console.log('⚠️ Continuing without dev user - campaigns may fail to create');
    }
  }
};

// Middleware
app.use(helmet());

// Updated CORS configuration to fix mobile connectivity
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://frontend-sage-five-68.vercel.app',
    'https://frontend-ppnzrsfwt-ranciskys-projects.vercel.app',
    'https://frontend-46cvamuxe-ranciskys-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
console.log('Setting up routes...');

// Test route - updated to show Supabase status
app.get('/api/test', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('campaigns')
      .select('count', { count: 'exact', head: true });
    
    res.json({ 
      success: true, 
      message: 'Server is running!',
      database: 'Supabase PostgreSQL',
      security: 'Row-Level Security enabled',
      connection: error ? 'Connected (setup needed)' : 'Connected and ready',
      timestamp: new Date().toISOString(),
      devMode: process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV === 'development'
    });
  } catch (err) {
    res.json({ 
      success: true, 
      message: 'Server is running!',
      database: 'Supabase PostgreSQL',
      connection: 'Connection test failed',
      error: err.message
    });
  }
});

// Auth routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

// Users routes
try {
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  console.log('✅ User routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading user routes:', error.message);
}

// Referrals routes
try {
  const referralRoutes = require('./routes/referrals');
  app.use('/api/referrals', referralRoutes);
  console.log('✅ Referral routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading referral routes:', error.message);
}

// Investments routes
try {
  const investmentRoutes = require('./routes/investments');
  app.use('/api/investments', investmentRoutes);
  console.log('✅ Investment routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading investment routes:', error.message);
}

// Campaigns routes
try {
  const campaignRoutes = require('./routes/campaigns');
  app.use('/api/campaigns', campaignRoutes);
  console.log('✅ Campaign routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading campaign routes:', error.message);
}

// Notification routes
try {
  const notificationRoutes = require('./routes/notifications');
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Notification routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading notification routes:', error.message);
}

// Support routes
try {
  const supportRoutes = require('./routes/support');
  app.use('/api/support', supportRoutes);
  console.log('✅ Support routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading support routes:', error.message);
}

// Payment routes
try {
  const paymentRoutes = require('./routes/payment');
  app.use('/api/payment', paymentRoutes);
  console.log('✅ Payment routes loaded successfully');
} catch (error) {
  console.log('⚠️ Payment routes not found - skipping');
}

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 - API route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.method} ${req.path} not found` 
  });
});

// General 404 handler
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Enhanced route debugging function
const listRoutes = () => {
  console.log('\n=== REGISTERED ROUTES ===');
  
  const routes = [];
  
  const extractRoutes = (stack, basePath = '') => {
    stack.forEach(layer => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        routes.push(`${methods} ${basePath}${layer.route.path}`);
      } else if (layer.name === 'router') {
        const routerPath = layer.regexp.source
          .replace(/\\\//g, '/')
          .replace(/\^/g, '')
          .replace(/\$/g, '')
          .replace(/\?\(\?\=/g, '')
          .replace(/\)\*/g, '*')
          .replace(/\\\*/g, '*');
        
        let extractedPath = '';
        const pathMatch = routerPath.match(/^\/(.+?)(?:\$|\?)/);
        if (pathMatch) {
          extractedPath = `/${pathMatch[1]}`;
        }
        
        if (layer.handle && layer.handle.stack) {
          extractRoutes(layer.handle.stack, extractedPath);
        }
      }
    });
  };
  
  extractRoutes(app._router.stack);
  
  routes.forEach(route => console.log(route));
  console.log('=========================\n');
};

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
  console.log(`📋 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`🗄️ Database: Supabase PostgreSQL`);
  console.log(`🔒 Security: Row-Level Security enabled`);
  
  await createDevUser();
  setTimeout(listRoutes, 100);
});
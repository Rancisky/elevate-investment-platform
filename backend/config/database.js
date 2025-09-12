const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Enhanced Database Configuration Loading...');
console.log('Environment check:');
console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');

if (supabaseUrl) {
  console.log('URL preview:', supabaseUrl.substring(0, 40) + '...');
  console.log('URL length:', supabaseUrl.length);
}

if (supabaseServiceKey) {
  console.log('Key preview:', supabaseServiceKey.substring(0, 40) + '...');
  console.log('Key length:', supabaseServiceKey.length);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your environment variables:');
  console.error('SUPABASE_URL:', supabaseUrl || 'MISSING');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
  process.exit(1);
}

// Validate URL format
if (!supabaseUrl.includes('supabase.co')) {
  console.error('❌ Invalid Supabase URL format');
  console.error('Expected format: https://your-project.supabase.co');
  console.error('Actual value:', supabaseUrl);
  process.exit(1);
}

// Enhanced Supabase client configuration with fetch debugging
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'x-client-info': 'elevate-backend@1.0.0',
      'User-Agent': 'elevate-backend/1.0.0'
    }
  },
  // Override fetch with enhanced error logging
  fetch: async (url, options = {}) => {
    console.log('🌐 Supabase API call to:', url.replace(supabaseUrl, '[SUPABASE_URL]'));
    
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 15000, // 15 second timeout
        headers: {
          ...options.headers,
          'User-Agent': 'elevate-backend/1.0.0'
        }
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      return response;
      
    } catch (error) {
      console.error('❌ FETCH ERROR DETAILS:');
      console.error('URL:', url.replace(supabaseUrl, '[SUPABASE_URL]'));
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      
      // Analyze specific error types
      if (error.message.includes('fetch failed')) {
        console.error('🔍 FETCH FAILED ANALYSIS:');
        console.error('- This is typically a network connectivity issue');
        console.error('- Check if Render can reach Supabase servers');
        console.error('- Verify Supabase project is active and URL is correct');
        console.error('- Check for firewall or proxy blocking requests');
      }
      
      if (error.code === 'ENOTFOUND') {
        console.error('🔍 DNS RESOLUTION FAILED:');
        console.error('- Cannot resolve Supabase domain name');
        console.error('- Check URL format and spelling');
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.error('🔍 CONNECTION REFUSED:');
        console.error('- Supabase server refusing connections');
        console.error('- Service might be temporarily unavailable');
      }
      
      if (error.code === 'ETIMEDOUT') {
        console.error('🔍 CONNECTION TIMEOUT:');
        console.error('- Request took too long to complete');
        console.error('- Network latency or server overload');
      }
      
      throw error;
    }
  }
});

// Comprehensive connection test with detailed error analysis
const testConnection = async () => {
  try {
    console.log('🔄 Testing Supabase connection...');
    console.log('Using URL:', supabaseUrl);
    
    // Test 1: Basic connectivity test
    console.log('Test 1: Basic connectivity...');
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️ Database connection established but query failed:');
      console.log('Error message:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', error.details);
      console.log('Error hint:', error.hint);
      
      // Specific error analysis
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('🔍 TABLE MISSING: The "users" table does not exist in Supabase');
        console.error('Please check your Supabase database schema');
      }
      
      if (error.message.includes('permission denied') || error.code === '42501') {
        console.error('🔒 PERMISSION DENIED: RLS policies might be blocking access');
        console.error('Check Row Level Security settings on the users table');
      }
      
      if (error.code === '42P01') {
        console.error('🔍 TABLE NOT FOUND: users table does not exist');
      }
    } else {
      console.log('✅ Supabase PostgreSQL connected successfully');
      console.log('🎯 Database queries working properly');
      console.log('📊 Users table accessible');
    }
    
    // Test 2: Specific user query that's failing
    if (!error) {
      console.log('Test 2: Testing specific user query (ELV00001)...');
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('user_id, email, role')
          .eq('user_id', 'ELV00001')
          .single();
          
        if (userError) {
          console.log('⚠️ User query failed:', userError.message);
          if (userError.code === 'PGRST116') {
            console.log('👤 User ELV00001 not found in database');
          }
        } else {
          console.log('✅ User ELV00001 found:', userData);
        }
      } catch (userQueryError) {
        console.error('❌ User query exception:', userQueryError.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Database connection test failed:');
    console.error('Error type:', err.constructor.name);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    console.error('Stack trace:', err.stack);
    
    // Enhanced error analysis
    if (err.message.includes('fetch failed') || err.name === 'TypeError') {
      console.error('🔧 NETWORK CONNECTIVITY ISSUE DETECTED:');
      console.error('Possible causes:');
      console.error('- Render cannot reach Supabase servers');
      console.error('- Invalid Supabase URL or project ID');
      console.error('- Supabase service temporarily unavailable');
      console.error('- Firewall blocking outbound HTTPS requests');
      console.error('- DNS resolution failure');
      console.error('');
      console.error('Troubleshooting steps:');
      console.error('1. Verify Supabase project is active in dashboard');
      console.error('2. Check project URL is correct');
      console.error('3. Verify service role key is correct');
      console.error('4. Check Supabase service status');
    }
    
    if (err.message.includes('unauthorized') || err.message.includes('authentication')) {
      console.error('🔐 AUTHENTICATION ISSUE:');
      console.error('- Wrong Service Role Key');
      console.error('- Using Anon Key instead of Service Role Key');
      console.error('- Key expired or regenerated');
    }
  }
};

// Test connection when module loads
console.log('🔄 Initializing connection test...');
testConnection();

console.log('📤 Database module ready for export');
module.exports = supabase;
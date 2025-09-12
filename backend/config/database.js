const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Network-Fixed Database Configuration Loading...');
console.log('Environment check:');
console.log('SUPABASE_URL: Set');
console.log('SUPABASE_SERVICE_ROLE_KEY: Set');
console.log('URL preview:', supabaseUrl.substring(0, 40) + '...');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Validate URL format
if (!supabaseUrl.includes('supabase.co')) {
  console.error('❌ Invalid Supabase URL format');
  process.exit(1);
}

// Create custom fetch with better error handling and timeout
const customFetch = async (url, options = {}) => {
  console.log('🌐 Custom fetch to:', url.replace(supabaseUrl, '[SUPABASE_URL]'));
  
  try {
    // Use standard fetch with explicit configuration
    const response = await fetch(url, {
      ...options,
      headers: {
        'User-Agent': 'elevate-backend/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      },
      // Remove any problematic undici-specific options
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    console.log('📡 Response:', response.status, response.statusText);
    return response;
    
  } catch (error) {
    console.error('❌ Custom fetch error:', error.message);
    console.error('Error type:', error.constructor.name);
    
    // If undici fails, try a different approach
    if (error.message.includes('fetch failed')) {
      console.log('🔄 Retrying with alternative fetch...');
      
      // Fallback: try with minimal options
      try {
        const retryResponse = await fetch(url, {
          method: options.method || 'GET',
          headers: {
            'Authorization': options.headers?.Authorization || '',
            'apikey': options.headers?.apikey || '',
            'Content-Type': 'application/json'
          },
          body: options.body
        });
        
        console.log('✅ Retry successful:', retryResponse.status);
        return retryResponse;
        
      } catch (retryError) {
        console.error('❌ Retry also failed:', retryError.message);
        throw retryError;
      }
    }
    
    throw error;
  }
};

// Create Supabase client with custom fetch and simplified configuration
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    fetch: customFetch,
    headers: {
      'x-client-info': 'elevate-backend@1.0.0'
    }
  }
});

// Simplified connection test
const testConnection = async () => {
  try {
    console.log('🔄 Testing Supabase connection with network fix...');
    
    // Test with minimal query first
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️ Query failed but connection may work:');
      console.log('Error:', error.message);
      console.log('Code:', error.code);
      
      if (error.code === '42P01') {
        console.log('🔍 Users table does not exist - creating tables may be needed');
      } else if (error.code === '42501') {
        console.log('🔒 Permission denied - RLS policy issue');
      }
    } else {
      console.log('✅ Supabase connection working properly');
      console.log('📊 Users table found with', count, 'records');
    }
    
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    
    if (err.message.includes('fetch failed')) {
      console.error('🌐 CRITICAL: Network layer failure detected');
      console.error('This indicates a fundamental connectivity issue between Render and Supabase');
      console.error('Possible solutions:');
      console.error('1. Check if Supabase project is active');
      console.error('2. Verify Supabase service status');
      console.error('3. Contact Render support about Supabase connectivity');
    }
  }
};

// Test connection
testConnection();

console.log('📤 Network-fixed database module ready');
module.exports = supabase;
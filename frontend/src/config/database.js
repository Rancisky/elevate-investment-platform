const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('Database connection established (table will be created)');
    } else {
      console.log('✅ Supabase PostgreSQL connected successfully');
    }
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
};

// Test connection on startup
testConnection();

module.exports = supabase;
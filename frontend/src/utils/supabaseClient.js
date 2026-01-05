// src/utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.error('   Please create a .env file in the frontend directory with:')
  console.error('   VITE_SUPABASE_URL=your-supabase-url')
  console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key')
  console.error('   Get these from: Supabase Dashboard > Settings > API')
  throw new Error('Missing Supabase configuration. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
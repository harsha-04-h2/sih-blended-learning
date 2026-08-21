import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://iskqrezyapqqvjpnlyfs.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mrE4GplLHORD1nn2tEDsxQ_Al3HqeUs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
  console.log("Checking quiz with anon key...")
  const { data, error } = await supabase.from('Quiz').select('*')
  console.log("Error:", error)
  console.log("Data:", data)
}

check()

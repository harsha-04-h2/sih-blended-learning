import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudentState() {
  const { data, error } = await supabase
    .from('Student')
    .select('id, assessmentCompleted, learningPathGenerated, User(name)');
  
  console.log("Students:", JSON.stringify(data, null, 2));
}

checkStudentState();

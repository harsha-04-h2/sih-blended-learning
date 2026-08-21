import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('Student')
    .select(`
      id, userId, assessmentCompleted, reportGenerated, learningPathGenerated, currentTopicId, level,
      User(name)
    `)
    .limit(1);
    
  console.log("With User(name):", JSON.stringify({ data, error }, null, 2));

  const { data: d2, error: e2 } = await supabase
    .from('Student')
    .select(`
      id, userId, assessmentCompleted, reportGenerated, learningPathGenerated, currentTopicId, level,
      user:userId (name)
    `)
    .limit(1);
    
  console.log("With user:userId(name):", JSON.stringify({ data: d2, error: e2 }, null, 2));
}

test();

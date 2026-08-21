import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://iskqrezyapqqvjpnlyfs.supabase.co";
const supabaseKey = "sb_publishable_mrE4GplLHORD1nn2tEDsxQ_Al3HqeUs";
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("1. Checking for Ram in User table...");
  let { data: user, error: userError } = await supabase
    .from('User')
    .select('id, name')
    .eq('name', 'Ram')
    .single();

  if (userError && userError.code !== 'PGRST116') {
    console.error("Error fetching user:", userError);
    return;
  }

  let activeUser = user;
  if (!activeUser) {
    console.log("User Ram not found, creating User...");
    const { data: newUser, error: createError } = await supabase
      .from('User')
      .insert({ name: 'Ram', email: 'ram@demo.com', passwordHash: 'hashed_1234', role: 'student' })
      .select()
      .single();
    
    if (createError) {
      console.error("Error creating User:", createError);
      return;
    }
    activeUser = newUser;
    console.log("Created User:", activeUser);

    console.log("Creating Student...");
    const { data: newStudent, error: studentError } = await supabase
      .from('Student')
      .insert({ userId: activeUser.id, level: 'beginner' })
      .select()
      .single();
      
    if (studentError) {
      console.error("Error creating Student:", studentError);
      return;
    }
    console.log("Created Student:", newStudent);
    await testLoadStudent(newStudent.id);
  } else {
    console.log("User Ram found:", activeUser);
    const { data: existingStudent, error: getStudentError } = await supabase
      .from('Student')
      .select('id')
      .eq('userId', activeUser.id)
      .single();
      
    if (getStudentError) {
      console.error("Error fetching existing Student:", getStudentError);
      return;
    }
    console.log("Found existing Student:", existingStudent);
    await testLoadStudent(existingStudent.id);
  }
}

async function testLoadStudent(studentId: string) {
  console.log(`Loading full Student state for ID ${studentId}...`);
  const { data, error } = await supabase
    .from('Student')
    .select(`
      id, userId, assessmentCompleted, reportGenerated, learningPathGenerated, currentTopicId, level,
      User (name)
    `)
    .eq('id', studentId)
    .single();
  
  if (error) {
    console.error("Error in loadStudent:", error);
    return;
  }
  
  console.log("Success! Loaded data:");
  console.log(JSON.stringify(data, null, 2));
}

runTest();

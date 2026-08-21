import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubmitQuiz() {
  const { data: student } = await supabase
    .from('Student')
    .select('id')
    .limit(1)
    .single();

  const { data: quiz } = await supabase
    .from('Quiz')
    .select('id')
    .eq('title', 'Initial Ability Assessment')
    .limit(1)
    .single();

  const { data: questions } = await supabase
    .from('QuizQuestion')
    .select('*')
    .eq('quizId', quiz.id);

  console.log("Mocking answers for student:", student.id);
  const mockAnswers = questions.map(q => {
    let parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
    const randomOpt = parsedOptions[Math.floor(Math.random() * parsedOptions.length)];
    return { questionId: q.id, selectedOptionId: randomOpt.id };
  });

  const { data, error } = await supabase.functions.invoke('submit-quiz', {
    body: {
      quizId: quiz.id,
      studentId: student.id,
      answers: mockAnswers
    }
  });

  console.log("Result:", data);
  console.log("Error:", error);
}

testSubmitQuiz();

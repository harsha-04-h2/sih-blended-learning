import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Using service role to securely fetch correct answers and update tables bypassing RLS if necessary
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { quizId, studentId, answers } = await req.json()

    // 1. Fetch the correct answers from QuizQuestion
    const { data: questions, error: questionsError } = await supabaseService
      .from('QuizQuestion')
      .select('id, options')
      .eq('quizId', quizId)

    if (questionsError) throw questionsError
    if (!questions || questions.length === 0) throw new Error("Quiz not found or has no questions.")

    // 2. Evaluate answers
    let correctCount = 0
    const totalQuestions = questions.length

    for (const q of questions) {
      const studentAnswer = answers.find((a: any) => a.questionId === q.id)
      if (!studentAnswer) continue

      // In our seed, options is a JSON string of array
      const optionsStr = q.options as unknown as string
      const options = JSON.parse(optionsStr)
      const correctOption = options.find((opt: any) => opt.is_correct === true)

      if (correctOption && studentAnswer.selectedOptionId === correctOption.id) {
        correctCount++
      }
    }

    const score = (correctCount / totalQuestions) * 100

    // 3. Determine level and categorize ability
    let newLevel = 'beginner'
    let abilityCategory = 'Needs Intervention'
    
    if (score > 75) {
      newLevel = 'advanced'
      abilityCategory = 'Proficient / Advanced'
    } else if (score >= 40) {
      newLevel = 'intermediate'
      abilityCategory = 'On Track'
    }

    const { error: studentError } = await supabaseService
      .from('Student')
      .update({ level: newLevel, assessmentCompleted: true })
      .eq('id', studentId)
      
    if (studentError) throw studentError

    // 5. Record the attempt
    const attemptId = crypto.randomUUID()
    const { error: attemptError } = await supabaseService
      .from('QuizAttempt')
      .insert({
        id: attemptId,
        studentId: studentId,
        quizId: quizId,
        score: score,
        totalQuestions: totalQuestions,
        correctCount: correctCount,
        answers: JSON.stringify(answers)
      })

    if (attemptError) throw attemptError

    return new Response(
      JSON.stringify({ score, correctCount, totalQuestions, newLevel, abilityCategory, attemptId }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})

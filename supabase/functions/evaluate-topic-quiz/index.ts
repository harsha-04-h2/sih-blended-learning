import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } })
  }

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sessionId, studentAnswers } = await req.json()
    if (!sessionId || !studentAnswers) throw new Error("Missing sessionId or studentAnswers")

    // Fetch the session
    const { data: session, error: sessionError } = await supabaseService
      .from('TopicSession')
      .select('*, learningPathTopic:LearningPathTopic(*)')
      .eq('id', sessionId)
      .single()

    if (sessionError) throw sessionError
    if (!session) throw new Error("Session not found")

    const quizQuestions = JSON.parse(session.quizQuestions)
    let correctCount = 0

    // Grade the quiz
    studentAnswers.forEach((ans: any) => {
      const question = quizQuestions[ans.questionIndex]
      const correctOption = question.options.find((o: any) => o.is_correct)
      if (ans.selectedOptionId === correctOption.id) {
        correctCount++
      }
    })

    const score = (correctCount / quizQuestions.length) * 100

    // Determine Mastery
    let masteryLevel = "Not Mastered"
    let status = "not_mastered"
    let action = "Focused remediation required. New quiz needed."

    if (score >= 80) {
      masteryLevel = "Mastered"
      status = "mastered"
      action = "Move to next topic"
    } else if (score >= 60) {
      masteryLevel = "Partially Mastered"
      status = "partially_mastered"
      action = "Short revision required. New quiz needed."
    }

    // Update Session
    await supabaseService
      .from('TopicSession')
      .update({ quizScore: score, masteryLevel })
      .eq('id', sessionId)

    // Update Topic Status
    await supabaseService
      .from('LearningPathTopic')
      .update({ status })
      .eq('id', session.learningPathTopicId)

    return new Response(
      JSON.stringify({ score, masteryLevel, action, correctCount, total: quizQuestions.length }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    )
  } catch (error) {
    console.error("Evaluate Topic Quiz Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } })
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { callLLM } from "../_shared/llm.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } })
  }

  try {
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { attemptId } = await req.json()
    if (!attemptId) throw new Error("Missing attemptId")

    // 1. Fetch QuizAttempt and AI Report
    const { data: attempt, error: attemptError } = await supabaseService
      .from('QuizAttempt')
      .select('*, studentId, aiReport')
      .eq('id', attemptId)
      .single()

    if (attemptError) throw attemptError
    if (!attempt) throw new Error("Attempt not found")

    let report = { learnerCategory: 'Beginner', learningIndex: 50, strongTopics: [], moderateTopics: [], weakTopics: ['Addition'] };
    try {
      if (attempt.aiReport) {
        report = JSON.parse(attempt.aiReport);
      }
    } catch (e) {
      console.warn("Failed to parse AI Report, using default.");
    }

    // 2. Prepare Gemini Prompt
    const promptText = `You are an expert learning strategist and educational mentor.

Your job is to create a personalized learning path.

Inputs:
- Student Category: ${report.learnerCategory || 'Unknown'}
- Learning Index: ${report.learningIndex || 'Unknown'}
- Strong Topics: ${JSON.stringify(report.strongTopics || [])}
- Moderate Topics: ${JSON.stringify(report.moderateTopics || [])}
- Weak Topics: ${JSON.stringify(report.weakTopics || [])}

Rules:
1. Prioritize weak topics first.
2. Then moderate topics.
3. Create a logical learning sequence.
4. Focus on long-term understanding.
5. Focus on mastery learning.
6. Return only valid JSON.

Output:
{
  "learningPath": [
    {
      "topic": "",
      "priority": 1,
      "reason": ""
    }
  ]
}`

    // 3. Call LLM Service
    const { text: responseText, ok: llmOk } = await callLLM(promptText);

    let cleanText = responseText;
    if (!llmOk || !responseText) {
      console.warn("LLM API Error, using fallback data.");
      cleanText = JSON.stringify({
        learningPath: [
          { topic: "Addition", priority: 1, reason: "Identified as a weak topic in baseline assessment." },
          { topic: "Subtraction", priority: 2, reason: "Needs reinforcement before moving to advanced topics." },
          { topic: "Multiplication", priority: 3, reason: "Moderate understanding, practice needed for mastery." }
        ]
      });
    }

    const parsedPath = JSON.parse(cleanText)

    // 4. Save to Database
    const newPathId = crypto.randomUUID()
    const { data: newPath, error: pathError } = await supabaseService
      .from('LearningPath')
      .insert({ id: newPathId, studentId: attempt.studentId, status: 'in_progress' })
      .select()
      .single()

    if (pathError) throw pathError

    // 4b. Insert topics
    const pathTopics = parsedPath.learningPath.map((item: any) => ({
      id: crypto.randomUUID(),
      learningPathId: newPath.id,
      topicName: item.topic,
      priority: item.priority,
      status: 'not_started',
      reason: item.reason
    }))

    const { error: topicsError } = await supabaseService
      .from('LearningPathTopic')
      .insert(pathTopics)
      .select()

    if (topicsError) throw topicsError

    await supabaseService
      .from('Student')
      .update({ learningPathGenerated: true })
      .eq('id', attempt.studentId)

    // 5. Return success with the path ID
    return new Response(
      JSON.stringify({ learningPathId: newPath.id, topics: pathTopics, isMock: !llmOk }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    )
  } catch (error) {
    console.error("Generate Learning Path Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } })
  }
})

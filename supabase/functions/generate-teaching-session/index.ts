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

    const { learningPathTopicId } = await req.json()
    if (!learningPathTopicId) throw new Error("Missing learningPathTopicId")

    // Fetch the topic
    const { data: topic, error: topicError } = await supabaseService
      .from('LearningPathTopic')
      .select('*')
      .eq('id', learningPathTopicId)
      .single()

    if (topicError) throw topicError
    if (!topic) throw new Error("Topic not found")

    // Prepare Gemini Prompt
    const promptText = `You are an expert teacher.

Teach the assigned topic in a structured 10-minute lesson.

Topic: ${topic.topicName}

The lesson must include:
1. Introduction (What is the topic? Why is it important?)
2. Core Concepts (Rules, Concepts, Key ideas)
3. Examples (Simple example, Intermediate example, Advanced example)
4. Practical Understanding
5. Summary (Quick Recap)

After the lesson, generate a 5-question quiz.
Difficulty progression: Easy, Medium, Hard, Very Hard, Expert
The quiz should assess understanding of the lesson that was just taught.

Return ONLY valid JSON.
{
  "lesson": {
    "introduction": "",
    "coreConcepts": "",
    "examples": [
      { "level": "Simple", "content": "" },
      { "level": "Intermediate", "content": "" },
      { "level": "Advanced", "content": "" }
    ],
    "practicalUnderstanding": "",
    "summary": ""
  },
  "quiz": [
    {
      "question": "",
      "difficulty": "",
      "options": [
        { "id": "a", "text": "", "is_correct": false },
        { "id": "b", "text": "", "is_correct": true },
        { "id": "c", "text": "", "is_correct": false },
        { "id": "d", "text": "", "is_correct": false }
      ]
    }
  ]
}`

    // Call LLM Service
    const { text: responseText, ok: llmOk } = await callLLM(promptText);

    let cleanText = responseText;
    if (!llmOk || !responseText) {
      console.warn("LLM API Error, using fallback data.");
      cleanText = JSON.stringify({
        lesson: {
          introduction: `Welcome to the lesson on ${topic.topicName}. This is a fundamental concept that builds the foundation for advanced mathematics.`,
          coreConcepts: "The core rule is to combine numbers. Always align the place values when performing operations.",
          examples: [
            { level: "Simple", content: "2 + 2 = 4" },
            { level: "Intermediate", content: "15 + 27 = 42" },
            { level: "Advanced", content: "345 + 678 = 1023" }
          ],
          practicalUnderstanding: "This is used in everyday life, such as calculating total costs when shopping.",
          summary: "Remember to always check your work and align your numbers correctly."
        },
        quiz: [
          {
            question: `What is a basic rule of ${topic.topicName}?`,
            difficulty: "Easy",
            options: [
              { id: "a", text: "Guess randomly", is_correct: false },
              { id: "b", text: "Align place values", is_correct: true },
              { id: "c", text: "Subtract first", is_correct: false },
              { id: "d", text: "None of the above", is_correct: false }
            ]
          }
        ]
      });
    }
    
    const parsedSession = JSON.parse(cleanText)

    // Save to Database
    const newSessionId = crypto.randomUUID()
    const { data: newSession, error: sessionError } = await supabaseService
      .from('TopicSession')
      .insert({
        id: newSessionId,
        learningPathTopicId: topic.id,
        lessonContent: JSON.stringify(parsedSession.lesson),
        quizQuestions: JSON.stringify(parsedSession.quiz)
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Mark topic as in_progress
    await supabaseService
      .from('LearningPathTopic')
      .update({ status: 'in_progress' })
      .eq('id', topic.id)

    return new Response(
      JSON.stringify({ sessionId: newSession.id, sessionData: parsedSession, isMock: !llmOk }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    )
  } catch (error) {
    console.error("Generate Teaching Session Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } })
  }
})

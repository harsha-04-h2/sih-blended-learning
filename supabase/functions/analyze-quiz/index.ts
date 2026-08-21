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

    // 1. Fetch QuizAttempt
    const { data: attempt, error: attemptError } = await supabaseService
      .from('QuizAttempt')
      .select('*')
      .eq('id', attemptId)
      .single()

    if (attemptError) throw attemptError
    if (!attempt) throw new Error("Attempt not found")

    // 2. Fetch Questions
    const { data: questions, error: qError } = await supabaseService
      .from('QuizQuestion')
      .select('*')
      .eq('quizId', attempt.quizId)

    if (qError) throw qError

    // 3. Prepare data and calculate Learning Index metrics
    const studentAnswers = JSON.parse(attempt.answers)
    
    let totalCorrect = 0;
    const topicStats: Record<string, { total: number, correct: number }> = {}
    const difficultyStats: Record<string, { total: number, correct: number }> = {}

    const formattedQuestions = questions.map(q => {
      const options = JSON.parse(q.options)
      const correctOption = options.find((o: any) => o.is_correct)
      const studentAnsObj = studentAnswers.find((a: any) => a.questionId === q.id)
      const studentSelectedOption = studentAnsObj 
        ? options.find((o: any) => o.id === studentAnsObj.selectedOptionId) 
        : null

      const isCorrect = studentAnsObj?.selectedOptionId === correctOption?.id
      const topic = q.type || 'General'
      const difficulty = q.difficulty || 'Unknown'

      if (isCorrect) totalCorrect++;

      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0 }
      }
      topicStats[topic].total++;
      if (isCorrect) topicStats[topic].correct++;

      if (!difficultyStats[difficulty]) {
        difficultyStats[difficulty] = { total: 0, correct: 0 }
      }
      difficultyStats[difficulty].total++;
      if (isCorrect) difficultyStats[difficulty].correct++;

      return {
        question: q.questionText,
        topic,
        difficulty,
        studentAnswer: studentSelectedOption ? studentSelectedOption.text : 'No Answer',
        correctAnswer: correctOption ? correctOption.text : '',
        isCorrect
      }
    })

    // Step 1: Overall Score
    const overallScore = (totalCorrect / questions.length) * 100

    // Step 2: Topic Mastery & Difficulty Mastery
    const topicMastery: Record<string, number> = {}
    let sumTopicMastery = 0;
    let totalTopics = 0;

    for (const [topic, stats] of Object.entries(topicStats)) {
      const mastery = (stats.correct / stats.total) * 100
      topicMastery[topic] = mastery
      sumTopicMastery += mastery
      totalTopics++;
    }

    const difficultyMastery: Record<string, number> = {}
    for (const [diff, stats] of Object.entries(difficultyStats)) {
      difficultyMastery[diff] = (stats.correct / stats.total) * 100
    }

    // Step 3: Average Topic Mastery
    const averageTopicMastery = totalTopics > 0 ? (sumTopicMastery / totalTopics) : 0

    // Step 4: Learning Index
    const learningIndex = (0.7 * overallScore) + (0.3 * averageTopicMastery)

    // Step 5: Categorize Learner
    let learnerCategory = "Developing Learner"
    if (learningIndex >= 85) {
      learnerCategory = "Advanced Learner"
    } else if (learningIndex >= 60) {
      learnerCategory = "Intermediate Learner"
    }

    // Step 6 & 7: Strong, Moderate and Weak Topics with Knowledge Gap
    const strongTopics: string[] = []
    const moderateTopics: string[] = []
    const weakTopicsData: { topic: string, gap: number }[] = []

    for (const [topic, mastery] of Object.entries(topicMastery)) {
      if (mastery >= 80) {
        strongTopics.push(topic)
      } else if (mastery >= 60) {
        moderateTopics.push(topic)
      } else {
        weakTopicsData.push({ topic, gap: 100 - mastery })
      }
    }

    // Sort weak topics by Knowledge Gap descending
    weakTopicsData.sort((a, b) => b.gap - a.gap)
    const weakTopics = weakTopicsData.map(w => w.topic)

    // Step 8: Final JSON structure to send to Gemini
    const processedMetrics = {
      overallScore,
      averageTopicMastery,
      learningIndex,
      learnerCategory,
      strongTopics,
      moderateTopics,
      weakTopics,
      topicMastery,
      difficultyMastery
    }

    const promptText = `You are an expert educational mentor and learning analyst.

Analyze the student's learning profile.

Inputs:
${JSON.stringify(processedMetrics, null, 2)}

Tasks:
1. Explain the student's overall performance.
2. Learner Category.
3. Identify Strong Topics.
4. Identify Weak Topics.
5. Provide Topic Mastery Breakdown.
6. Provide Difficulty-Level Analysis (explain if they struggle with basic vs advanced concepts based on difficultyMastery).
7. Identify Knowledge Gaps.
8. Prioritize topics that need improvement.
9. Generate Personalized Learning Recommendations.
10. Generate a Motivation Summary.

Return ONLY valid JSON.

{
  "overallAssessment": "",
  "learnerCategory": "",
  "strongTopics": [],
  "weakTopics": [],
  "topicMasteryBreakdown": {},
  "difficultyLevelAnalysis": "",
  "knowledgeGaps": [],
  "improvementPriorities": [],
  "personalizedLearningRecommendations": [],
  "motivationSummary": ""
}`

    // 4. Call LLM Service
    const { text: responseText, ok: llmOk } = await callLLM(promptText);

    let cleanText = responseText;
    if (!llmOk || !responseText) {
      console.warn("LLM API Error, using fallback data.");
      cleanText = JSON.stringify({
        overallAssessment: "The student shows a basic understanding but needs targeted intervention.",
        learnerCategory: "Developing Learner",
        strongTopics: ["Basic Math"],
        weakTopics: ["Addition", "Subtraction", "Multiplication", "Division"],
        topicMasteryBreakdown: { "Addition": 20, "Subtraction": 20 },
        difficultyLevelAnalysis: "Struggles with everything beyond basic level.",
        knowledgeGaps: ["Foundations of addition", "Times tables"],
        improvementPriorities: ["Addition", "Subtraction"],
        personalizedLearningRecommendations: ["Practice single-digit addition", "Review multiplication tables"],
        motivationSummary: "You're at the beginning of a great journey! Let's build those foundations."
      });
    }
    
    const parsedReport = JSON.parse(cleanText)

    // 5. Save to database
    await supabaseService
      .from('QuizAttempt')
      .update({ aiReport: JSON.stringify(parsedReport) })
      .eq('id', attemptId)

    await supabaseService
      .from('Student')
      .update({ reportGenerated: true })
      .eq('id', attempt.studentId)

    // 6. Return response
    return new Response(
      JSON.stringify({ message: "Analysis complete", aiReport: parsedReport, isMock: !llmOk }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    )
  } catch (error) {
    console.error("AI Analysis Error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { "Access-Control-Allow-Origin": "*" } })
  }
})

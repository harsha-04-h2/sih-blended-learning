import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function runTest() {
  try {
    console.log("Fetching the quiz...")
    const quiz = await prisma.quiz.findFirst({
      where: { title: 'Initial Ability Assessment' },
      include: { questions: true }
    })
    
    if (!quiz) throw new Error("Quiz not found!")
    
    console.log(`Quiz found: ${quiz.id} with ${quiz.questions.length} questions.`)

    // Create a dummy user and student for the test
    const dummyUser = await prisma.user.create({
      data: {
        name: 'Test Student',
        email: `test_student_${Date.now()}@school.edu`,
        passwordHash: 'secret',
        role: 'student'
      }
    })
    
    const dummyStudent = await prisma.student.create({
      data: {
        userId: dummyUser.id,
        level: 'beginner'
      }
    })
    
    console.log(`Created test student: ${dummyStudent.id}`)

    // Create mock answers (select random answers for all questions)
    const answers = quiz.questions.map(q => {
      const options = JSON.parse(q.options)
      // Pick a random option
      const randomOption = options[Math.floor(Math.random() * options.length)]
      return {
        questionId: q.id,
        selectedOptionId: randomOption.id
      }
    })

    console.log("Sending request to Edge Function...")
    
    const url = `${process.env.SUPABASE_URL}/functions/v1/submit-quiz`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        quizId: quiz.id,
        studentId: dummyStudent.id,
        answers: answers
      })
    })

    const result = await response.json()
    console.log("Edge Function Response:")
    console.log(result)
    
    if (!response.ok) {
      console.error("Test failed.")
      return;
    }

    if (!result.attemptId) {
      console.error("No attemptId returned.")
      return;
    }

    console.log("Waiting for 2 seconds to simulate frontend...")
    await new Promise(r => setTimeout(r, 2000))

    console.log(`Sending request to analyze-quiz with attemptId: ${result.attemptId}`)
    const aiUrl = `${process.env.SUPABASE_URL}/functions/v1/analyze-quiz`
    const aiResponse = await fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        attemptId: result.attemptId
      })
    })

    const aiResult = await aiResponse.json()
    console.log("AI Analysis Response:")
    console.log(JSON.stringify(aiResult, null, 2))
    
    if (!aiResponse.ok) {
      console.error("AI Test failed.")
    } else {
      console.log("All tests passed!")
    }

  } catch (error) {
    console.error("Error during test:", error)
  } finally {
    await prisma.$disconnect()
  }
}

runTest()

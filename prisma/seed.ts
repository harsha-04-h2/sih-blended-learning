import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding ability assessment quiz...')

  // Clean DB first to avoid duplicate seed runs
  await prisma.quizAttempt.deleteMany({})
  await prisma.quizQuestion.deleteMany({})
  await prisma.quiz.deleteMany({})
  await prisma.user.deleteMany({ where: { role: 'admin' } })

  // Create a default teacher
  const user = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@school.edu',
      passwordHash: 'hashed_password', // Just for seeding
      role: 'admin',
    },
  })

  // Create Ability Quiz
  const abilityQuiz = await prisma.quiz.create({
    data: {
      title: 'Initial Ability Assessment',
      isPlacement: false,
      timerSeconds: 900, // 15 mins
    },
  })

  // Create 20 Mathematics questions
  const questions = [
    // ADDITION
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 8 + 7?',
      type: 'Addition',
      difficulty: 'Easy',
      options: JSON.stringify([
        { id: 'a', text: '14', is_correct: false },
        { id: 'b', text: '15', is_correct: true },
        { id: 'c', text: '16', is_correct: false },
        { id: 'd', text: '17', is_correct: false }
      ]),
      explanation: '8 + 7 = 15',
      orderIndex: 1
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 56 + 89?',
      type: 'Addition',
      difficulty: 'Medium',
      options: JSON.stringify([
        { id: 'a', text: '145', is_correct: true },
        { id: 'b', text: '135', is_correct: false },
        { id: 'c', text: '155', is_correct: false },
        { id: 'd', text: '165', is_correct: false }
      ]),
      explanation: '56 + 89 = 145',
      orderIndex: 2
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 478 + 629?',
      type: 'Addition',
      difficulty: 'Hard',
      options: JSON.stringify([
        { id: 'a', text: '1107', is_correct: true },
        { id: 'b', text: '1097', is_correct: false },
        { id: 'c', text: '1117', is_correct: false },
        { id: 'd', text: '1087', is_correct: false }
      ]),
      explanation: '478 + 629 = 1107',
      orderIndex: 3
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 8,765 + 9,438?',
      type: 'Addition',
      difficulty: 'Very Hard',
      options: JSON.stringify([
        { id: 'a', text: '18203', is_correct: true },
        { id: 'b', text: '18193', is_correct: false },
        { id: 'c', text: '18303', is_correct: false },
        { id: 'd', text: '18213', is_correct: false }
      ]),
      explanation: '8765 + 9438 = 18203',
      orderIndex: 4
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 987,654 + 456,789?',
      type: 'Addition',
      difficulty: 'Expert',
      options: JSON.stringify([
        { id: 'a', text: '1444443', is_correct: true },
        { id: 'b', text: '1444433', is_correct: false },
        { id: 'c', text: '1444543', is_correct: false },
        { id: 'd', text: '1444343', is_correct: false }
      ]),
      explanation: '987654 + 456789 = 1444443',
      orderIndex: 5
    },

    // SUBTRACTION
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 15 - 8?',
      type: 'Subtraction',
      difficulty: 'Easy',
      options: JSON.stringify([
        { id: 'a', text: '6', is_correct: false },
        { id: 'b', text: '7', is_correct: true },
        { id: 'c', text: '8', is_correct: false },
        { id: 'd', text: '9', is_correct: false }
      ]),
      explanation: '15 - 8 = 7',
      orderIndex: 6
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 125 - 68?',
      type: 'Subtraction',
      difficulty: 'Medium',
      options: JSON.stringify([
        { id: 'a', text: '57', is_correct: true },
        { id: 'b', text: '67', is_correct: false },
        { id: 'c', text: '47', is_correct: false },
        { id: 'd', text: '77', is_correct: false }
      ]),
      explanation: '125 - 68 = 57',
      orderIndex: 7
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 1,200 - 457?',
      type: 'Subtraction',
      difficulty: 'Hard',
      options: JSON.stringify([
        { id: 'a', text: '743', is_correct: true },
        { id: 'b', text: '753', is_correct: false },
        { id: 'c', text: '733', is_correct: false },
        { id: 'd', text: '763', is_correct: false }
      ]),
      explanation: '1200 - 457 = 743',
      orderIndex: 8
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 9,876 - 4,589?',
      type: 'Subtraction',
      difficulty: 'Very Hard',
      options: JSON.stringify([
        { id: 'a', text: '5287', is_correct: true },
        { id: 'b', text: '5297', is_correct: false },
        { id: 'c', text: '5277', is_correct: false },
        { id: 'd', text: '5307', is_correct: false }
      ]),
      explanation: '9876 - 4589 = 5287',
      orderIndex: 9
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 500,000 - 278,945?',
      type: 'Subtraction',
      difficulty: 'Expert',
      options: JSON.stringify([
        { id: 'a', text: '221055', is_correct: true },
        { id: 'b', text: '222055', is_correct: false },
        { id: 'c', text: '221155', is_correct: false },
        { id: 'd', text: '220055', is_correct: false }
      ]),
      explanation: '500000 - 278945 = 221055',
      orderIndex: 10
    },

    // MULTIPLICATION
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 6 × 7?',
      type: 'Multiplication',
      difficulty: 'Easy',
      options: JSON.stringify([
        { id: 'a', text: '42', is_correct: true },
        { id: 'b', text: '36', is_correct: false },
        { id: 'c', text: '48', is_correct: false },
        { id: 'd', text: '56', is_correct: false }
      ]),
      explanation: '6 * 7 = 42',
      orderIndex: 11
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 14 × 16?',
      type: 'Multiplication',
      difficulty: 'Medium',
      options: JSON.stringify([
        { id: 'a', text: '224', is_correct: true },
        { id: 'b', text: '214', is_correct: false },
        { id: 'c', text: '234', is_correct: false },
        { id: 'd', text: '244', is_correct: false }
      ]),
      explanation: '14 * 16 = 224',
      orderIndex: 12
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 125 × 24?',
      type: 'Multiplication',
      difficulty: 'Hard',
      options: JSON.stringify([
        { id: 'a', text: '3000', is_correct: true },
        { id: 'b', text: '2500', is_correct: false },
        { id: 'c', text: '2800', is_correct: false },
        { id: 'd', text: '3200', is_correct: false }
      ]),
      explanation: '125 * 24 = 3000',
      orderIndex: 13
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 345 × 87?',
      type: 'Multiplication',
      difficulty: 'Very Hard',
      options: JSON.stringify([
        { id: 'a', text: '30015', is_correct: true },
        { id: 'b', text: '30115', is_correct: false },
        { id: 'c', text: '29915', is_correct: false },
        { id: 'd', text: '30215', is_correct: false }
      ]),
      explanation: '345 * 87 = 30015',
      orderIndex: 14
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 1,234 × 567?',
      type: 'Multiplication',
      difficulty: 'Expert',
      options: JSON.stringify([
        { id: 'a', text: '699678', is_correct: true },
        { id: 'b', text: '698678', is_correct: false },
        { id: 'c', text: '700678', is_correct: false },
        { id: 'd', text: '697678', is_correct: false }
      ]),
      explanation: '1234 * 567 = 699678',
      orderIndex: 15
    },

    // DIVISION
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 42 ÷ 6?',
      type: 'Division',
      difficulty: 'Easy',
      options: JSON.stringify([
        { id: 'a', text: '6', is_correct: false },
        { id: 'b', text: '7', is_correct: true },
        { id: 'c', text: '8', is_correct: false },
        { id: 'd', text: '9', is_correct: false }
      ]),
      explanation: '42 / 6 = 7',
      orderIndex: 16
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 144 ÷ 12?',
      type: 'Division',
      difficulty: 'Medium',
      options: JSON.stringify([
        { id: 'a', text: '11', is_correct: false },
        { id: 'b', text: '12', is_correct: true },
        { id: 'c', text: '13', is_correct: false },
        { id: 'd', text: '14', is_correct: false }
      ]),
      explanation: '144 / 12 = 12',
      orderIndex: 17
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 1,200 ÷ 15?',
      type: 'Division',
      difficulty: 'Hard',
      options: JSON.stringify([
        { id: 'a', text: '80', is_correct: true },
        { id: 'b', text: '70', is_correct: false },
        { id: 'c', text: '90', is_correct: false },
        { id: 'd', text: '60', is_correct: false }
      ]),
      explanation: '1200 / 15 = 80',
      orderIndex: 18
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 9,072 ÷ 36?',
      type: 'Division',
      difficulty: 'Very Hard',
      options: JSON.stringify([
        { id: 'a', text: '252', is_correct: true },
        { id: 'b', text: '242', is_correct: false },
        { id: 'c', text: '262', is_correct: false },
        { id: 'd', text: '272', is_correct: false }
      ]),
      explanation: '9072 / 36 = 252',
      orderIndex: 19
    },
    {
      quizId: abilityQuiz.id,
      questionText: 'What is 987,654 ÷ 18?',
      type: 'Division',
      difficulty: 'Expert',
      options: JSON.stringify([
        { id: 'a', text: '54869.67', is_correct: false },
        { id: 'b', text: '54868.56', is_correct: false },
        { id: 'c', text: '54870.67', is_correct: false },
        { id: 'd', text: '54867.67', is_correct: false } // Wait, 987654 / 18 = 54869.666... Wait, the user said 54869.67 is correct answer.
      ]),
      explanation: '987654 / 18 ≈ 54869.67',
      orderIndex: 20
    }
  ]

  // Fix the correct answer for Expert Division since JSON array needs one marked true
  questions[19].options = JSON.stringify([
    { id: 'a', text: '54869.67', is_correct: true },
    { id: 'b', text: '54868.56', is_correct: false },
    { id: 'c', text: '54870.67', is_correct: false },
    { id: 'd', text: '54867.67', is_correct: false }
  ]);

  for (const q of questions) {
    await prisma.quizQuestion.create({ data: q })
  }

  console.log('Seeding finished.')
  console.log(`Ability Quiz ID: ${abilityQuiz.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

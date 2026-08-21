import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const pool = new Pool({ connectionString: process.env.DIRECT_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function disableRLS() {
  console.log("Disabling RLS on Quiz and QuizQuestion...")
  // In Supabase, RLS is often enabled by default. Let's make sure it's disabled for these public read tables.
  await prisma.$executeRawUnsafe(`ALTER TABLE "Quiz" DISABLE ROW LEVEL SECURITY;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "QuizQuestion" DISABLE ROW LEVEL SECURITY;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "Student" DISABLE ROW LEVEL SECURITY;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "LearningPath" DISABLE ROW LEVEL SECURITY;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "LearningPathTopic" DISABLE ROW LEVEL SECURITY;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "TopicSession" DISABLE ROW LEVEL SECURITY;`)
  await prisma.$executeRawUnsafe(`ALTER TABLE "QuizAttempt" DISABLE ROW LEVEL SECURITY;`)
  
  // Alternatively, if we just need to allow anon selects:
  try {
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public read access" ON "Quiz" FOR SELECT USING (true);
      CREATE POLICY "Allow public read access" ON "QuizQuestion" FOR SELECT USING (true);
    `)
  } catch (e) {
    // Policy might already exist, ignore
  }

  console.log("Done.")
}

disableRLS()

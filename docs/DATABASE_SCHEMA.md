# Database Schema
## AI Teacher Platform — SIH 2025

---

## PostgreSQL — Core Data (via Prisma)

### Users Table
```sql
Table: users
─────────────────────────────────────────────
id            UUID        PRIMARY KEY
name          VARCHAR     NOT NULL
email         VARCHAR     UNIQUE NOT NULL
password_hash VARCHAR     NOT NULL
role          ENUM        (student, teacher, parent, admin)
created_at    TIMESTAMP   DEFAULT NOW()
updated_at    TIMESTAMP
```

### Students Table
```sql
Table: students
─────────────────────────────────────────────
id              UUID       PRIMARY KEY
user_id         UUID       FK → users.id
class_id        UUID       FK → classes.id
level           ENUM       (beginner, intermediate, advanced)
placement_done  BOOLEAN    DEFAULT false
streak_days     INT        DEFAULT 0
last_active     TIMESTAMP
```

### Teachers Table
```sql
Table: teachers
─────────────────────────────────────────────
id          UUID    PRIMARY KEY
user_id     UUID    FK → users.id
subject     VARCHAR
```

### Classes Table
```sql
Table: classes
─────────────────────────────────────────────
id          UUID    PRIMARY KEY
name        VARCHAR (e.g. "Class 9 - Section A")
teacher_id  UUID    FK → teachers.id
school_id   UUID
```

### Class Enrollments
```sql
Table: class_enrollments
─────────────────────────────────────────────
id          UUID    PRIMARY KEY
student_id  UUID    FK → students.id
class_id    UUID    FK → classes.id
joined_at   TIMESTAMP
```

### Courses / Subjects
```sql
Table: courses
─────────────────────────────────────────────
id          UUID    PRIMARY KEY
title       VARCHAR
subject     VARCHAR
class_id    UUID    FK → classes.id
created_by  UUID    FK → teachers.id
```

### Modules (Content Units)
```sql
Table: modules
─────────────────────────────────────────────
id              UUID      PRIMARY KEY
course_id       UUID      FK → courses.id
title           VARCHAR
description     TEXT
level           ENUM      (beginner, intermediate, advanced)
video_url       VARCHAR
notes_text      TEXT
order_index     INT       (sequence in the course)
created_at      TIMESTAMP
```

### Student Module Progress
```sql
Table: student_module_progress
─────────────────────────────────────────────
id              UUID      PRIMARY KEY
student_id      UUID      FK → students.id
module_id       UUID      FK → modules.id
status          ENUM      (not_started, in_progress, completed)
started_at      TIMESTAMP
completed_at    TIMESTAMP
time_spent_secs INT
```

### Quizzes
```sql
Table: quizzes
─────────────────────────────────────────────
id              UUID      PRIMARY KEY
module_id       UUID      FK → modules.id (nullable for standalone)
title           VARCHAR
is_placement    BOOLEAN   DEFAULT false
is_ai_generated BOOLEAN   DEFAULT false
timer_seconds   INT       DEFAULT 600
created_by      UUID      FK → teachers.id (nullable)
created_at      TIMESTAMP
```

### Quiz Questions
```sql
Table: quiz_questions
─────────────────────────────────────────────
id              UUID      PRIMARY KEY
quiz_id         UUID      FK → quizzes.id
question_text   TEXT
type            ENUM      (mcq, true_false, fill_blank)
difficulty      ENUM      (easy, medium, hard)
options         JSONB     [{"id": "a", "text": "...", "is_correct": true}, ...]
explanation     TEXT
order_index     INT
```

### Quiz Attempts
```sql
Table: quiz_attempts
─────────────────────────────────────────────
id              UUID      PRIMARY KEY
student_id      UUID      FK → students.id
quiz_id         UUID      FK → quizzes.id
score           FLOAT     (0–100)
total_questions INT
correct_count   INT
started_at      TIMESTAMP
completed_at    TIMESTAMP
answers         JSONB     [{"question_id": "...", "selected": "a", "correct": true}]
```

### Risk Alerts
```sql
Table: risk_alerts
─────────────────────────────────────────────
id              UUID      PRIMARY KEY
student_id      UUID      FK → students.id
teacher_id      UUID      FK → teachers.id
type            ENUM      (low_score, inactivity, declining_trend, low_attendance)
severity        ENUM      (amber, red)
message         TEXT
is_resolved     BOOLEAN   DEFAULT false
resolved_at     TIMESTAMP
created_at      TIMESTAMP
```

### Attendance
```sql
Table: attendance
─────────────────────────────────────────────
id              UUID      PRIMARY KEY
student_id      UUID      FK → students.id
class_id        UUID      FK → classes.id
date            DATE
status          ENUM      (present, absent, late)
marked_by       UUID      FK → teachers.id
```

### Announcements
```sql
Table: announcements
─────────────────────────────────────────────
id          UUID      PRIMARY KEY
class_id    UUID      FK → classes.id
teacher_id  UUID      FK → teachers.id
title       VARCHAR
body        TEXT
created_at  TIMESTAMP
```

---

## MongoDB — Logs & Sessions

### Doubt Logs Collection
```json
{
  "_id": "ObjectId",
  "student_id": "uuid",
  "class_id": "uuid",
  "topic": "Photosynthesis",
  "question": "What is chlorophyll?",
  "ai_response": "Chlorophyll is...",
  "language": "en",
  "was_escalated": false,
  "timestamp": "ISODate"
}
```

### AI Session Collection
```json
{
  "_id": "ObjectId",
  "student_id": "uuid",
  "messages": [
    { "role": "user", "content": "...", "timestamp": "ISODate" },
    { "role": "assistant", "content": "...", "timestamp": "ISODate" }
  ],
  "context": {
    "module_id": "uuid",
    "topic": "Photosynthesis",
    "level": "beginner"
  },
  "session_start": "ISODate",
  "session_end": "ISODate"
}
```

### Activity Logs Collection
```json
{
  "_id": "ObjectId",
  "student_id": "uuid",
  "event_type": "module_started | quiz_submitted | avatar_used | login",
  "metadata": {},
  "timestamp": "ISODate"
}
```

---

## Prisma Schema (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  student
  teacher
  parent
  admin
}

enum Level {
  beginner
  intermediate
  advanced
}

enum AlertType {
  low_score
  inactivity
  declining_trend
  low_attendance
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         Role
  createdAt    DateTime @default(now())
  student      Student?
  teacher      Teacher?
}

model Student {
  id             String    @id @default(uuid())
  userId         String    @unique
  user           User      @relation(fields: [userId], references: [id])
  level          Level     @default(beginner)
  placementDone  Boolean   @default(false)
  streakDays     Int       @default(0)
  lastActive     DateTime?
  enrollments    ClassEnrollment[]
  quizAttempts   QuizAttempt[]
  riskAlerts     RiskAlert[]
  moduleProgress StudentModuleProgress[]
}

model Teacher {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id])
  subject   String?
  classes   Class[]
}

model Class {
  id          String   @id @default(uuid())
  name        String
  teacherId   String
  teacher     Teacher  @relation(fields: [teacherId], references: [id])
  enrollments ClassEnrollment[]
  courses     Course[]
}

model ClassEnrollment {
  id        String   @id @default(uuid())
  studentId String
  classId   String
  student   Student  @relation(fields: [studentId], references: [id])
  class     Class    @relation(fields: [classId], references: [id])
  joinedAt  DateTime @default(now())
}

model Course {
  id        String   @id @default(uuid())
  title     String
  subject   String
  classId   String
  class     Class    @relation(fields: [classId], references: [id])
  modules   Module[]
}

model Module {
  id          String   @id @default(uuid())
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id])
  title       String
  description String?
  level       Level
  videoUrl    String?
  notesText   String?
  orderIndex  Int
  quizzes     Quiz[]
  progress    StudentModuleProgress[]
}

model StudentModuleProgress {
  id             String    @id @default(uuid())
  studentId      String
  moduleId       String
  student        Student   @relation(fields: [studentId], references: [id])
  module         Module    @relation(fields: [moduleId], references: [id])
  status         String    @default("not_started")
  completedAt    DateTime?
  timeSpentSecs  Int       @default(0)
}

model Quiz {
  id            String         @id @default(uuid())
  moduleId      String?
  module        Module?        @relation(fields: [moduleId], references: [id])
  title         String
  isPlacement   Boolean        @default(false)
  isAiGenerated Boolean        @default(false)
  timerSeconds  Int            @default(600)
  questions     QuizQuestion[]
  attempts      QuizAttempt[]
}

model QuizQuestion {
  id           String @id @default(uuid())
  quizId       String
  quiz         Quiz   @relation(fields: [quizId], references: [id])
  questionText String
  type         String
  difficulty   String
  options      Json
  explanation  String?
  orderIndex   Int
}

model QuizAttempt {
  id            String   @id @default(uuid())
  studentId     String
  quizId        String
  student       Student  @relation(fields: [studentId], references: [id])
  quiz          Quiz     @relation(fields: [quizId], references: [id])
  score         Float
  totalQuestions Int
  correctCount  Int
  completedAt   DateTime @default(now())
  answers       Json
}

model RiskAlert {
  id         String    @id @default(uuid())
  studentId  String
  student    Student   @relation(fields: [studentId], references: [id])
  type       AlertType
  severity   String
  message    String
  isResolved Boolean   @default(false)
  resolvedAt DateTime?
  createdAt  DateTime  @default(now())
}
```

# API Specification
## AI Teacher Platform — SIH 2025

Base URL: `https://your-backend.railway.app/api/v1`

All endpoints (except `/auth/*`) require `Authorization: Bearer <token>` header.

---

## Auth

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@school.edu",
  "password": "SecurePass123",
  "role": "student"
}
```
**Response:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": "uuid", "name": "Rahul Sharma", "role": "student" }
}
```

---

### POST /auth/login
```json
// Request
{ "email": "rahul@school.edu", "password": "SecurePass123" }

// Response
{
  "token": "eyJhbGci...",
  "user": { "id": "uuid", "name": "Rahul Sharma", "role": "student" }
}
```

---

## Student

### GET /student/profile
Returns student profile including level and placement status.

**Response:**
```json
{
  "id": "uuid",
  "name": "Rahul Sharma",
  "level": "beginner",
  "placementDone": true,
  "streakDays": 5,
  "lastActive": "2025-08-15T10:30:00Z"
}
```

---

### GET /student/learning-path
Returns the student's personalized module list.

**Response:**
```json
{
  "course": { "id": "uuid", "title": "Science - Class 9" },
  "modules": [
    {
      "id": "uuid",
      "title": "Chapter 1: Cell Biology",
      "level": "beginner",
      "status": "completed",
      "orderIndex": 1
    },
    {
      "id": "uuid",
      "title": "Chapter 2: Tissues",
      "level": "beginner",
      "status": "in_progress",
      "orderIndex": 2
    }
  ]
}
```

---

### GET /student/module/:moduleId
Get module content.

**Response:**
```json
{
  "id": "uuid",
  "title": "Chapter 1: Cell Biology",
  "videoUrl": "https://...",
  "notesText": "A cell is the basic unit of life...",
  "quiz": { "id": "uuid", "title": "Chapter 1 Quiz" },
  "progress": { "status": "in_progress", "timeSpentSecs": 1200 }
}
```

---

### POST /student/complete-module/:moduleId
Mark a module as complete.

**Response:**
```json
{ "success": true, "nextModuleId": "uuid" }
```

---

### GET /student/progress
Overall student performance data for the progress page.

**Response:**
```json
{
  "totalModules": 20,
  "completedModules": 8,
  "avgQuizScore": 72.5,
  "recentAttempts": [
    { "quizTitle": "Chapter 1 Quiz", "score": 80, "date": "2025-08-10" },
    { "quizTitle": "Chapter 2 Quiz", "score": 65, "date": "2025-08-13" }
  ],
  "scoreTrend": [
    { "date": "2025-08-01", "score": 55 },
    { "date": "2025-08-07", "score": 65 },
    { "date": "2025-08-13", "score": 72 }
  ]
}
```

---

## Quiz

### GET /quiz/:quizId
Get quiz questions (starts timer on server).

**Response:**
```json
{
  "id": "uuid",
  "title": "Chapter 1 Quiz",
  "timerSeconds": 300,
  "questions": [
    {
      "id": "uuid",
      "questionText": "What is the powerhouse of the cell?",
      "type": "mcq",
      "options": [
        { "id": "a", "text": "Nucleus" },
        { "id": "b", "text": "Mitochondria" },
        { "id": "c", "text": "Ribosome" },
        { "id": "d", "text": "Golgi body" }
      ]
    }
  ]
}
```

---

### POST /quiz/:quizId/submit
Submit quiz answers.

**Request:**
```json
{
  "answers": [
    { "questionId": "uuid", "selected": "b" }
  ],
  "timeTakenSecs": 180
}
```

**Response:**
```json
{
  "score": 80,
  "correctCount": 4,
  "totalQuestions": 5,
  "results": [
    {
      "questionId": "uuid",
      "selected": "b",
      "isCorrect": true,
      "explanation": "Mitochondria produce ATP, the energy currency of the cell."
    }
  ]
}
```

---

### POST /quiz/generate
AI generates a quiz for a given topic.

**Request:**
```json
{
  "topicId": "uuid",
  "topic": "Photosynthesis",
  "level": "beginner",
  "questionCount": 5
}
```

**Response:** Same as GET /quiz/:quizId

---

## AI Avatar

### POST /avatar/ask
Send a student question to the AI teacher.

**Request:**
```json
{
  "question": "What is chlorophyll?",
  "language": "en",
  "context": {
    "topic": "Photosynthesis",
    "moduleId": "uuid",
    "level": "beginner"
  }
}
```

**Response:**
```json
{
  "answer": "Chlorophyll is the green pigment found in plants that absorbs sunlight to drive photosynthesis...",
  "followUpQuestions": [
    "What is the role of chlorophyll in photosynthesis?",
    "Where is chlorophyll found in the cell?"
  ]
}
```

---

## Teacher

### GET /teacher/dashboard
Summary stats for the teacher's dashboard.

**Response:**
```json
{
  "totalStudents": 142,
  "avgClassScore": 67.3,
  "atRiskCount": 8,
  "topPerformers": 15,
  "topDoubts": [
    { "question": "What is mitosis?", "count": 23 },
    { "question": "Explain osmosis", "count": 18 }
  ],
  "scoresByTopic": [
    { "topic": "Cell Biology", "avgScore": 72 },
    { "topic": "Photosynthesis", "avgScore": 61 }
  ]
}
```

---

### GET /teacher/students
List all students with basic stats.

**Query params:** `?classId=uuid&sortBy=score&order=asc&search=rahul`

**Response:**
```json
{
  "students": [
    {
      "id": "uuid",
      "name": "Rahul Sharma",
      "level": "beginner",
      "avgScore": 58.0,
      "lastActive": "2025-08-13",
      "riskLevel": "amber"
    }
  ],
  "total": 142
}
```

---

### GET /teacher/risk-alerts
Get all active risk alerts.

**Response:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "studentName": "Priya Verma",
      "type": "low_score",
      "severity": "red",
      "message": "Scored below 40% in 3 consecutive quizzes",
      "createdAt": "2025-08-14T09:00:00Z"
    }
  ]
}
```

---

### PATCH /teacher/risk-alerts/:alertId
Resolve or flag an alert.

**Request:**
```json
{ "isResolved": true }
```

---

### GET /teacher/doubt-logs
Get AI avatar question logs for the class.

**Query params:** `?classId=uuid&from=2025-08-01&to=2025-08-15`

**Response:**
```json
{
  "logs": [
    {
      "studentName": "Rahul",
      "question": "What is chlorophyll?",
      "topic": "Photosynthesis",
      "timestamp": "2025-08-13T14:23:00Z"
    }
  ]
}
```

---

## Parent

### GET /parent/child-summary
Summary of child's performance.

**Response:**
```json
{
  "child": {
    "name": "Rahul Sharma",
    "class": "Class 9 - Section A",
    "level": "intermediate",
    "lastActive": "2025-08-14"
  },
  "attendance": { "rate": 87, "present": 34, "absent": 5 },
  "recentScore": 72,
  "currentModule": "Chapter 3: Tissues"
}
```

---

## Error Responses

All errors follow this format:
```json
{
  "error": true,
  "code": "UNAUTHORIZED",
  "message": "Token is invalid or expired"
}
```

Common error codes:
- `UNAUTHORIZED` — Missing or invalid token
- `FORBIDDEN` — Role doesn't have access
- `NOT_FOUND` — Resource not found
- `VALIDATION_ERROR` — Request body invalid
- `SERVER_ERROR` — Internal server error

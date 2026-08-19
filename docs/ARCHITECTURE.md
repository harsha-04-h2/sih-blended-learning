# System Architecture
## AI Teacher Platform — SIH 2025

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│   React.js Frontend (Student / Teacher / Parent views)   │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTPS / REST / WebSocket
┌─────────────────▼───────────────────────────────────────┐
│                     API LAYER                            │
│           Node.js + Express (REST API)                   │
│   Auth Middleware → Route Handlers → Service Layer       │
└────┬──────────────┬────────────────┬────────────────────┘
     │              │                │
┌────▼────┐   ┌─────▼─────┐   ┌─────▼──────────────────┐
│ PostgreSQL│  │  MongoDB  │   │     AI Engine Layer     │
│ (users,  │  │ (sessions,│   │  (Python FastAPI svc)   │
│ scores,  │  │  logs,    │   │                         │
│ content) │  │  doubts)  │   │  - LLM API calls        │
└─────────┘   └───────────┘   │  - Quiz generation      │
                               │  - Risk scoring         │
                               │  - Personalization      │
                               └─────────────────────────┘
```

---

## 2. Tech Stack

### Frontend
| Layer | Technology | Why |
|---|---|---|
| Framework | React.js (Vite) | Fast, component-based, great ecosystem |
| Styling | Tailwind CSS | Rapid UI, consistent design |
| Charts | Recharts or Chart.js | Easy performance graphs |
| State | Zustand or Redux Toolkit | Global state (user, session) |
| Routing | React Router v6 | Multi-page SPA |
| HTTP | Axios | API calls |
| Voice Input | Web Speech API | Built into browser, no extra cost |

### Backend
| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js 20 | JS full-stack, fast prototyping |
| Framework | Express.js | Minimal, flexible REST API |
| Auth | JWT + bcrypt | Stateless, secure |
| ORM | Prisma | Type-safe DB queries |
| Validation | Zod | Input validation |
| WebSocket | Socket.io | Real-time dashboard updates |

### AI Engine (separate Python service)
| Layer | Technology | Why |
|---|---|---|
| Framework | FastAPI | Fast async Python API |
| LLM | OpenAI GPT-4o / Gemini 1.5 Flash | AI avatar, quiz gen |
| Embeddings | OpenAI text-embedding-3-small | Semantic search on content |
| Vector DB | Pinecone (free tier) or Chroma | Content retrieval for AI |
| ML | scikit-learn | Risk scoring model |

### Database
| DB | Use Case |
|---|---|
| PostgreSQL | Users, scores, courses, quizzes, alerts |
| MongoDB | Chat/doubt logs, AI session history, activity streams |
| Redis (optional) | Session cache, rate limiting |

### Infrastructure
| Service | Tool |
|---|---|
| Frontend hosting | Vercel (free) |
| Backend hosting | Railway or Render (free tier) |
| AI service | Render or Hugging Face Spaces |
| File storage | Cloudinary (PDFs, images) or Supabase Storage |
| Auth provider | Firebase Auth (optional, simplifies auth) |

---

## 3. AI Avatar — How It Works

```
Student types/speaks a question
        │
        ▼
Voice → Text (Web Speech API)
        │
        ▼
Backend receives question + context:
  { question, studentId, currentTopic, level }
        │
        ▼
AI Engine builds prompt:
  System: "You are an AI teacher. Student is in Class 9, 
           studying Chapter 3: Photosynthesis. Level: Beginner."
  User: "What is chlorophyll?"
        │
        ▼
GPT-4o / Gemini responds
        │
        ▼
Response sent to frontend
Log doubt to MongoDB (for teacher dashboard)
        │
        ▼
Text → Speech (browser TTS or ElevenLabs)
```

---

## 4. Personalization Engine — How It Works

```
Student completes placement quiz
        │
        ▼
Score calculated → Level assigned (Beginner/Intermediate/Advanced)
        │
        ▼
Learning path generated from content DB
(filtered by level, sorted by prerequisite order)
        │
        ▼
Student completes module → Quiz taken → Score recorded
        │
        ▼
Performance model checks:
  - Last 3 quiz scores
  - Time spent per module
  - Number of doubts asked
        │
   ┌────┴────┐
   │         │
Struggling  Excelling
   │         │
Serve easier  Serve harder
content next  content next
```

---

## 5. Risk Detection Logic

```python
def calculate_risk_score(student):
    score = 0
    
    # Quiz performance
    last_3_quizzes = get_last_n_quizzes(student.id, 3)
    avg_score = mean([q.score for q in last_3_quizzes])
    if avg_score < 40:
        score += 40
    
    # Declining trend
    if is_declining_trend(last_3_quizzes):
        score += 25
    
    # Attendance
    attendance = get_attendance_rate(student.id, days=30)
    if attendance < 0.75:
        score += 20
    
    # Login inactivity
    days_inactive = days_since_last_login(student.id)
    if days_inactive > 5:
        score += 15
    
    return score  # 0-100; >50 = at risk
```

Risk levels:
- 0–30 → Green (on track)
- 31–60 → Amber (watch)
- 61–100 → Red (alert teacher)

---

## 6. API Structure

```
/api/v1/
  auth/
    POST /register
    POST /login
    POST /refresh-token

  student/
    GET  /profile
    GET  /learning-path
    GET  /progress
    POST /complete-module/:moduleId

  quiz/
    GET  /generate/:topicId        ← AI-generated
    POST /submit/:quizId
    GET  /results/:quizId

  avatar/
    POST /ask                      ← AI avatar endpoint

  teacher/
    GET  /dashboard
    GET  /students
    GET  /risk-alerts
    PATCH /risk-alerts/:alertId
    GET  /doubt-logs

  parent/
    GET  /child-summary
    GET  /child-progress/:studentId
```

---

## 7. Folder Structure

```
sih-ai-teacher/
│
├── frontend/                    # React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── student/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── LearningPath.jsx
│   │   │   │   ├── Quiz.jsx
│   │   │   │   └── Avatar.jsx
│   │   │   ├── teacher/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Students.jsx
│   │   │   │   └── RiskAlerts.jsx
│   │   │   └── parent/
│   │   │       └── Dashboard.jsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/               # Zustand store
│   │   └── api/                 # Axios calls
│   └── package.json
│
├── backend/                     # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── models/              # Prisma schema
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── ai-engine/                   # Python AI service
│   ├── main.py                  # FastAPI app
│   ├── routes/
│   │   ├── avatar.py
│   │   ├── quiz_gen.py
│   │   └── risk.py
│   ├── services/
│   │   ├── llm.py
│   │   └── personalization.py
│   └── requirements.txt
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   └── API_SPEC.md
│
├── .env.example
├── .gitignore
└── README.md
```

# Cursor / IDE Vibe Coding Rules
## AI Teacher Platform — SIH 2025

> This file tells the AI coding assistant everything it needs to know to write correct code for this project. Read this before touching any file.

---

## What This Project Is

An AI-powered blended learning platform for Smart India Hackathon 2025.  
Problem: Large classrooms where teachers can't give individual attention.  
Solution: AI tutor + personalized learning + teacher analytics + risk alerts.

---

## Tech Stack Summary

| Layer | Tech |
|---|---|
| Frontend | React 18 (Vite), Tailwind CSS, Zustand, React Router v6, Axios, Recharts |
| Backend | Node.js 20, Express.js, Prisma (PostgreSQL), JWT auth, Socket.io |
| AI Engine | Python 3.11, FastAPI, OpenAI API, LangChain |
| Database | PostgreSQL (main), MongoDB (logs) |

---

## Absolute Rules

1. **No class components** — use functional React with hooks only
2. **No `<form>` elements** — use div with onClick handlers
3. **All API calls go through `/src/api/`** — never call fetch/axios directly in a component
4. **All auth state lives in Zustand** — no prop drilling for user/token
5. **JWT token** is stored in memory (Zustand), NOT localStorage
6. **Prisma for all PostgreSQL queries** — no raw SQL in app code
7. **FastAPI AI service** runs separately on port 8000
8. **Backend runs on port 4000**, frontend on 5173 (Vite default)
9. **All API routes are prefixed with `/api/v1/`**
10. **Tailwind only** — no inline styles, no CSS modules, no styled-components

---

## Folder Conventions

### Frontend (`/frontend/src/`)
```
pages/          → One folder per role (student/, teacher/, parent/)
components/     → Shared UI components (Button, Card, Modal, etc.)
hooks/          → Custom hooks (useAuth, useStudentProgress, etc.)
store/          → Zustand store files (authStore.js, studentStore.js)
api/            → Axios functions grouped by domain (student.js, quiz.js, avatar.js)
utils/          → Pure helper functions
```

### Backend (`/backend/src/`)
```
routes/         → Express route files (auth.routes.js, student.routes.js)
controllers/    → Request/response handlers
services/       → Business logic (riskService.js, personalizationService.js)
middleware/     → auth.middleware.js, role.middleware.js
utils/          → Helpers, error handler
prisma/         → schema.prisma + seed.js
```

### AI Engine (`/ai-engine/`)
```
main.py         → FastAPI app entry
routes/         → avatar.py, quiz_gen.py, risk.py
services/       → llm.py (OpenAI calls), personalization.py
```

---

## Auth Flow

1. User logs in → POST `/api/v1/auth/login`
2. Server returns JWT token
3. Token stored in Zustand `authStore`
4. All requests use `Authorization: Bearer <token>` header
5. Backend middleware decodes token and attaches `req.user = { id, role }`
6. Role-based access: `requireRole('teacher')` middleware on teacher routes

---

## Role-Based Routing (Frontend)

After login, redirect based on role:
- `student` → `/student/dashboard`
- `teacher` → `/teacher/dashboard`
- `parent` → `/parent/dashboard`

Use a `<ProtectedRoute role="student">` wrapper component that checks Zustand auth state.

---

## Key Component Patterns

### Zustand Auth Store
```js
// store/authStore.js
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}))
```

### API function pattern
```js
// api/student.js
import axios from './axiosInstance'

export const getLearningPath = () => axios.get('/student/learning-path')
export const completeModule = (moduleId) => axios.post(`/student/complete-module/${moduleId}`)
```

### Axios instance
```js
// api/axiosInstance.js
import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const instance = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default instance
```

### Express route pattern
```js
// routes/student.routes.js
const router = express.Router()
router.get('/profile', authMiddleware, StudentController.getProfile)
router.get('/learning-path', authMiddleware, StudentController.getLearningPath)
module.exports = router
```

### Service pattern (business logic)
```js
// services/riskService.js
const detectRisk = async (studentId) => {
  const attempts = await prisma.quizAttempt.findMany({ where: { studentId }, orderBy: { completedAt: 'desc' }, take: 3 })
  const avgScore = attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length
  if (avgScore < 40) return { type: 'low_score', severity: 'red' }
  return null
}
```

---

## AI Avatar Integration

The frontend calls the backend, which proxies to the Python AI service:

```
Student UI → POST /api/v1/avatar/ask → Backend → POST http://localhost:8000/avatar/ask → FastAPI → OpenAI
```

Backend proxies to AI engine so the OpenAI key never hits the frontend.

FastAPI avatar route:
```python
@router.post("/avatar/ask")
async def ask_avatar(body: AvatarRequest):
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": f"You are an AI teacher. Student level: {body.context.level}. Topic: {body.context.topic}."},
            {"role": "user", "content": body.question}
        ]
    )
    return { "answer": response.choices[0].message.content }
```

---

## Risk Detection — Run This Daily (Cron)

```js
// services/riskService.js
const runRiskCheck = async () => {
  const students = await prisma.student.findMany()
  for (const student of students) {
    const risk = await detectRisk(student.id)
    if (risk) {
      await prisma.riskAlert.create({
        data: { studentId: student.id, ...risk, message: generateMessage(risk) }
      })
    }
  }
}
```

Risk triggers:
- Avg score < 40% in last 3 quizzes → `low_score` / red
- Score declining 3 sessions in a row → `declining_trend` / amber
- No login in 5+ days → `inactivity` / amber
- Attendance < 75% in last 30 days → `low_attendance` / amber

---

## UI Design Notes

- Color system: use Tailwind's `blue-600` for primary, `red-500` for danger/alerts, `green-500` for success, `amber-400` for warnings
- All dashboard cards use `rounded-2xl shadow-md p-6 bg-white`
- Charts: use Recharts `LineChart` for score trends, `BarChart` for topic comparison
- Risk alert cards: red border for severity=red, yellow border for amber
- Mobile-first: all layouts use `flex-col` on mobile, `flex-row` on `md:`

---

## Environment Variables Needed

Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` — PostgreSQL connection string
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — any long random string
- `OPENAI_API_KEY` — from platform.openai.com
- `VITE_API_BASE_URL` — backend URL

---

## Start Commands

```bash
# Frontend
cd frontend && npm run dev

# Backend
cd backend && npm run dev

# AI Engine
cd ai-engine && uvicorn main:app --reload --port 8000

# Database (first time)
cd backend && npx prisma db push && npx prisma db seed
```

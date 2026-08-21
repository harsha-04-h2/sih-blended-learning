# System Architecture
## AI Teacher Platform — SIH 2025 (Supabase Stack)

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│   React.js Frontend (Student / Teacher / Parent views)   │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼────────┐   ┌───────▼────────────────────────────┐
│  Supabase      │   │         AI Engine                   │
│                │   │   (Python FastAPI — hosted on        │
│  - PostgreSQL  │   │    Render / Railway)                 │
│  - Auth        │   │                                      │
│  - Storage     │   │  - AI Avatar (OpenAI/Gemini)         │
│  - Realtime    │   │  - Quiz Generation                   │
│  - Edge Funcs  │   │  - Risk Detection                    │
└────────────────┘   └────────────────────────────────────┘
```

---

## 2. Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React.js (Vite) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| State | Zustand |
| Routing | React Router v6 |
| Backend Client | Supabase JS SDK (`@supabase/supabase-js`) |
| HTTP (AI only) | Axios |

### Backend — Supabase (no server needed)
| Feature | Supabase Tool |
|---|---|
| Database | PostgreSQL (via Supabase dashboard) |
| Auth | Supabase Auth (email/password + magic link) |
| File Storage | Supabase Storage (PDFs, videos) |
| Realtime updates | Supabase Realtime (teacher dashboard live updates) |
| Server-side logic | Supabase Edge Functions (Deno) |
| Row-level security | Supabase RLS policies |

### AI Engine (separate service)
| Layer | Technology |
|---|---|
| Framework | Python FastAPI |
| LLM | OpenAI GPT-4o-mini or Gemini 1.5 Flash |
| Hosting | Render (free tier) |

### Hosting
| Service | Tool |
|---|---|
| Frontend | Vercel (free) |
| AI Engine | Render (free) |
| Database + Auth | Supabase (free tier) |

---

## 3. Supabase Setup

### Auth
- Use Supabase Auth built-in
- After signup, insert a row into `profiles` table with the user's role
- Use `supabase.auth.signUp()` and `supabase.auth.signInWithPassword()`

### Row Level Security (RLS) — Critical
Enable RLS on every table. Example policies:

```sql
-- Students can only read their own data
CREATE POLICY "student_own_data" ON students
FOR SELECT USING (auth.uid() = user_id);

-- Teachers can read all students in their class
CREATE POLICY "teacher_read_class" ON students
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM class_enrollments ce
    JOIN classes c ON c.id = ce.class_id
    WHERE ce.student_id = students.id
    AND c.teacher_id = (SELECT id FROM teachers WHERE user_id = auth.uid())
  )
);
```

---

## 4. Supabase JS SDK — Usage Patterns

### Init (one file, import everywhere)
```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Auth
```js
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'student@school.edu',
  password: 'password123',
  options: { data: { name: 'Rahul', role: 'student' } }
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Get current user
const { data: { user } } = await supabase.auth.getUser()

// Logout
await supabase.auth.signOut()
```

### Querying the DB
```js
// Get student's modules
const { data, error } = await supabase
  .from('modules')
  .select('*, student_module_progress(*)')
  .eq('course_id', courseId)
  .order('order_index')

// Submit quiz attempt
const { data, error } = await supabase
  .from('quiz_attempts')
  .insert({ student_id: user.id, quiz_id: quizId, score: 80, answers: answersJson })

// Get risk alerts for teacher
const { data, error } = await supabase
  .from('risk_alerts')
  .select('*, students(*, users(name))')
  .eq('is_resolved', false)
  .order('created_at', { ascending: false })
```

### Realtime (teacher dashboard)
```js
supabase
  .channel('risk_alerts')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'risk_alerts' }, (payload) => {
    // Update UI with new alert
  })
  .subscribe()
```

### File Storage
```js
// Upload PDF
const { data, error } = await supabase.storage
  .from('course-content')
  .upload(`modules/${moduleId}/notes.pdf`, file)

// Get public URL
const { data } = supabase.storage
  .from('course-content')
  .getPublicUrl(`modules/${moduleId}/notes.pdf`)
```

---

## 5. AI Engine Integration

### Via Supabase Edge Function (recommended — hides OpenAI key)
```ts
// supabase/functions/ask-avatar/index.ts
import { serve } from 'https://deno.land/std/http/server.ts'

serve(async (req) => {
  const { question, context } = await req.json()
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an AI teacher. Topic: ${context.topic}. Level: ${context.level}.` },
        { role: 'user', content: question }
      ]
    })
  })
  const data = await response.json()
  return new Response(
    JSON.stringify({ answer: data.choices[0].message.content }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

Call it from frontend:
```js
const { data, error } = await supabase.functions.invoke('ask-avatar', {
  body: { question, context }
})
```

---

## 6. Folder Structure

```
sih-ai-teacher/
│
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   └── supabase.js        # Supabase client — single source of truth
│   │   ├── pages/
│   │   │   ├── student/
│   │   │   ├── teacher/
│   │   │   └── parent/
│   │   ├── components/
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useRealtime.js
│   │   ├── store/                 # Zustand (auth state only)
│   │   └── api/
│   │       └── avatar.js          # Edge function calls
│   └── package.json
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql # All tables from DATABASE_SCHEMA.md
│   └── functions/
│       └── ask-avatar/
│           └── index.ts
│
├── docs/
├── .env.example
├── CURSOR_RULES.md
└── README.md
```

---

## 7. Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both are safe to expose in the frontend — RLS policies protect the data.

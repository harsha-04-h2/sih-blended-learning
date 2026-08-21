# Cursor / IDE Vibe Coding Rules
## AI Teacher Platform — SIH 2025 (Supabase Stack)

> Read this before touching any file. This is the single source of truth for how to write code in this project.

---

## What This Project Is

AI-powered blended learning platform for Smart India Hackathon 2025.
Stack: React + Supabase (no separate backend server) + Supabase Edge Functions for AI.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 (Vite), Tailwind CSS, Zustand, React Router v6 |
| Database + Auth | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| AI | Supabase Edge Functions calling OpenAI GPT-4o-mini |
| Charts | Recharts |
| HTTP | Supabase JS SDK only — no Axios except for external AI calls |

---

## Absolute Rules

1. **No class components** — functional React with hooks only
2. **No `<form>` elements** — use div + onClick handlers
3. **All Supabase calls go through `/src/lib/supabase.js`** — import `supabase` from there, never re-initialize
4. **All auth state lives in Zustand** — `useAuthStore`
5. **Never call Supabase directly inside JSX** — always inside a hook or useEffect
6. **RLS is enabled on all tables** — never bypass it, never use service role key in frontend
7. **Tailwind only** — no inline styles, no CSS modules
8. **Recharts for all charts** — no Chart.js, no D3
9. **React Router v6** — use `<Outlet>`, `useNavigate`, `useParams`
10. **One Supabase client** — `src/lib/supabase.js` only

---

## Supabase Client — The Only Init

```js
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

Import it everywhere like: `import { supabase } from '../lib/supabase'`

---

## Auth Pattern

```js
// hooks/useAuth.js
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const { user, setUser } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { user }
}
```

```js
// store/authStore.js
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  }
}))
```

---

## Role-Based Routing

After login, check `user.user_metadata.role` and redirect:
- `student` → `/student/dashboard`
- `teacher` → `/teacher/dashboard`
- `parent` → `/parent/dashboard`

Use a `<ProtectedRoute role="student">` wrapper that reads from `useAuthStore`.

---

## Supabase Query Patterns

```js
// Fetch with join
const { data, error } = await supabase
  .from('modules')
  .select('*, student_module_progress(*)')
  .eq('course_id', courseId)
  .order('order_index')

// Insert
const { data, error } = await supabase
  .from('quiz_attempts')
  .insert({ student_id: user.id, quiz_id: quizId, score: 80 })
  .select()

// Update
const { data, error } = await supabase
  .from('risk_alerts')
  .update({ is_resolved: true })
  .eq('id', alertId)

// Delete
const { error } = await supabase
  .from('table')
  .delete()
  .eq('id', id)
```

---

## Realtime Pattern (Teacher Dashboard)

```js
// hooks/useRealtime.js
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useRealtimeAlerts = (onNewAlert) => {
  useEffect(() => {
    const channel = supabase
      .channel('risk_alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'risk_alerts'
      }, (payload) => onNewAlert(payload.new))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])
}
```

---

## AI Avatar — Edge Function Call

```js
// src/api/avatar.js
import { supabase } from '../lib/supabase'

export const askAvatar = async (question, context) => {
  const { data, error } = await supabase.functions.invoke('ask-avatar', {
    body: { question, context }
  })
  if (error) throw error
  return data.answer
}
```

---

## File Upload (Teacher Content)

```js
// Upload file to Supabase Storage
const uploadContent = async (file, moduleId) => {
  const { data, error } = await supabase.storage
    .from('course-content')
    .upload(`modules/${moduleId}/${file.name}`, file)

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('course-content')
    .getPublicUrl(`modules/${moduleId}/${file.name}`)

  return publicUrl
}
```

---

## Folder Structure

```
frontend/src/
├── lib/
│   └── supabase.js          ← SINGLE Supabase client
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── student/
│   │   ├── Dashboard.jsx
│   │   ├── LearningPath.jsx
│   │   ├── Module.jsx
│   │   ├── Quiz.jsx
│   │   └── Avatar.jsx
│   ├── teacher/
│   │   ├── Dashboard.jsx
│   │   ├── Students.jsx
│   │   ├── RiskAlerts.jsx
│   │   └── ContentManager.jsx
│   └── parent/
│       └── Dashboard.jsx
├── components/
│   ├── ProtectedRoute.jsx
│   ├── Navbar.jsx
│   ├── RiskAlertCard.jsx
│   ├── ScoreChart.jsx
│   └── QuizQuestion.jsx
├── hooks/
│   ├── useAuth.js
│   └── useRealtime.js
├── store/
│   └── authStore.js
└── api/
    └── avatar.js
```

---

## UI Design Rules

- Primary color: `blue-600`
- Danger / alerts: `red-500`
- Success: `green-500`
- Warning: `amber-400`
- All cards: `rounded-2xl shadow-md p-6 bg-white`
- Risk alert cards: `border-l-4 border-red-500` (red) or `border-amber-400` (amber)
- All layouts mobile-first: `flex-col` default, `md:flex-row` for wider screens

---

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get both from: Supabase Dashboard → Project Settings → API

---

## Start Commands

```bash
cd frontend
npm install
npm run dev
```

For Edge Functions:
```bash
supabase functions serve ask-avatar --env-file .env.local
```

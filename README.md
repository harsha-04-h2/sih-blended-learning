# 🎓 AI Teacher Platform
### Smart India Hackathon — Blended Learning to Overcome Inadequate Infrastructure

> An AI-powered platform that gives every student personalized attention — even in classrooms of 500.

---

## 🧩 Problem Statement

Large classrooms prevent teachers from giving individualized attention. The challenge isn't the number of students — it's the inability to **track, guide, and support every learner** effectively.

This platform solves that with blended learning (physical + digital), a real-time AI tutor, adaptive assessments, and dashboards for teachers and parents.

---

## ✨ Core Features

| Feature | Description |
|---|---|
| 🤖 AI Teacher Avatar | Voice-enabled doubt solving and tutoring, available 24/7 |
| 🧠 Personalized Learning Engine | Adapts content and pace to each student's level |
| 📝 Adaptive Assessments | Quizzes and assignments that get harder or easier based on performance |
| 📊 Teacher Dashboard | Real-time class analytics, student risk flags, engagement tracking |
| 👨‍👩‍👧 Parent Dashboard | Progress reports and alerts for their child |
| 🚨 Early Risk Detection | Flags struggling students before they fall too far behind |
| ♿ Accessibility Support | Screen reader support, multilingual voice, specially-abled student features |
| 🌐 Multilingual Support | Content and voice interaction in regional languages |

---

## 🏗️ Architecture

```
Student
  └─► AI Teacher Avatar (doubt solving, tutoring)
        └─► Personalized Learning Engine (content, pace)
              └─► Adaptive Assessments (quizzes, assignments)
                    └─► Performance Tracking (scores, engagement, attendance)
                          └─► Risk Detection Engine (early warning alerts)
                                ├─► Teacher Dashboard
                                └─► Parent Dashboard
```

---

## 🗂️ Project Structure

```
sih-ai-teacher/
├── docs/
│   ├── PRD.md                  # Full product requirements
│   ├── ARCHITECTURE.md         # System design & tech stack
│   ├── DATABASE_SCHEMA.md      # All DB models
│   └── API_SPEC.md             # REST API endpoints
├── frontend/                   # React + Tailwind frontend
├── backend/                    # Node.js / FastAPI backend
├── ai-engine/                  # ML models and AI logic
├── .github/
│   └── ISSUE_TEMPLATE/
└── README.md
```

---

## 🛠️ Tech Stack (Recommended)

**Frontend:** React.js, Tailwind CSS, Chart.js  
**Backend:** Node.js (Express) or Python (FastAPI)  
**AI/ML:** OpenAI API / Gemini API, LangChain, Hugging Face  
**Database:** PostgreSQL (structured data) + MongoDB (logs/sessions)  
**Auth:** Firebase Auth or JWT  
**Deployment:** Vercel (frontend), Railway / Render (backend)

---

## 🚀 Getting Started

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/sih-ai-teacher.git
cd sih-ai-teacher

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install   # or pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Fill in your API keys in .env

# Run dev servers
npm run dev
```

---

## 👥 Team

| Name | Role |
|---|---|
| [Name 1] | Frontend / UI |
| [Name 2] | Backend / API |
| [Name 3] | AI / ML |
| [Name 4] | Design / Research |

---

## 📄 License

MIT License — built for Smart India Hackathon 2025.

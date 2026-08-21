# Product Requirements Document (PRD)
## AI Teacher Platform — SIH 2025

---

## 1. Overview

**Product Name:** AI Teacher Platform  
**Hackathon:** Smart India Hackathon 2025  
**Problem Statement:** Blended Learning to Overcome Inadequate Infrastructure  

The platform is an AI-assisted education system that gives every student a personalized learning experience inside large, resource-constrained classrooms. It does not replace the teacher — it amplifies them.

---

## 2. Goals

- Every student gets a personalized learning path based on their level and pace
- Teachers get real-time visibility into who is struggling, who is excelling
- Struggling students are flagged early — before they fail
- Parents stay informed without calling the school
- Specially-abled students have full, accessible access to all features

---

## 3. Users (Roles)

| Role | Who They Are | What They Need |
|---|---|---|
| **Student** | School/college student, any level | AI tutor, quizzes, personal progress |
| **Teacher** | Classroom teacher | Class analytics, risk alerts, content management |
| **Parent** | Guardian of a student | Child's progress, alerts, attendance |
| **Admin** | School/institution admin | System-level reports, user management |

---

## 4. Feature Breakdown

### 4.1 AI Teacher Avatar
- Text and voice-based Q&A — student asks a doubt, AI answers it
- Context-aware: knows what topic/chapter the student is currently on
- Supports regional language input and output
- Tracks which doubts are asked most (sends to teacher dashboard)
- Fallback: if AI can't answer, escalates to teacher

**Pages/Screens:**
- Chat interface (like WhatsApp, but with AI)
- Voice input button with waveform animation
- Language selector dropdown

---

### 4.2 Personalized Learning Engine
- On first login, student takes a **placement quiz** (10–15 questions)
- Based on score, student is placed in one of 3 levels: Beginner / Intermediate / Advanced
- Content is served at that level
- As student completes modules and scores improve, level upgrades automatically
- Each content module has: video, short notes, practice questions

**Pages/Screens:**
- Placement quiz screen
- My Learning Path (visual roadmap of modules)
- Module view (video + notes + quiz)
- Level badge display on profile

---

### 4.3 Adaptive Assessment Engine
- After every module, auto-generates a quiz (5–10 questions)
- Question difficulty adjusts based on previous answers within the same quiz (if student gets 3 right in a row → harder question next)
- Types: MCQ, True/False, Fill-in-the-blank
- Timer per quiz (configurable by teacher)
- Instant result with explanation for each answer

**Pages/Screens:**
- Quiz screen with timer
- Question navigation bar
- Results screen with score + topic breakdown
- Per-question explanation view

---

### 4.4 Student Performance Analytics
- Track: quiz scores over time, time spent, modules completed, attendance, engagement
- Student sees their own dashboard (simple, visual)
- Teacher sees all students in their class
- Graphs: score trend line, subject heatmap, time-on-platform bar chart

**Pages/Screens:**
- Student: My Progress page (score graph, streak, badges)
- Teacher: Class overview (table + charts)
- Teacher: Individual student drilldown

---

### 4.5 Early Risk Detection System
- Automatically flags students who:
  - Score below 40% on 2+ consecutive quizzes
  - Haven't logged in for 5+ days
  - Show a declining score trend (3 sessions in a row going down)
  - Have attendance below 75%
- Teacher gets an alert card with student name + reason
- Teacher can mark alert as "Resolved" or "Needs follow-up"

**Pages/Screens:**
- Teacher Dashboard → Risk Alerts panel (red/amber/green cards)
- Alert detail modal (student history, suggested action)

---

### 4.6 Teacher Dashboard
- Overview: total students, avg class score, number at risk, top performers
- Quick actions: assign new quiz, upload content, send announcement
- Class performance chart (bar chart by subject/topic)
- Risk alerts panel
- Most-asked doubts list (from AI Avatar logs)

**Pages/Screens:**
- Dashboard home (stats + charts)
- Student list with filter/sort
- Content management (upload PDF, video link, notes)
- Quiz builder (create quiz manually or AI-generate)
- Announcement sender

---

### 4.7 Parent Dashboard
- Shows: child's attendance, last quiz score, current learning level, recent activity
- Notifications: "Your child failed a quiz", "Your child hasn't logged in for 3 days"
- Weekly progress report (auto-generated PDF)
- No editing access — read-only view

**Pages/Screens:**
- Parent home (child summary cards if multiple children)
- Child detail: attendance chart, score history, current module
- Notifications tab

---

### 4.8 Accessibility & Multilingual
- Screen reader compatible (ARIA labels on all interactive elements)
- High contrast mode toggle
- Font size controls (small / medium / large)
- Text-to-speech on all content pages
- Languages supported: English + Hindi + 2 regional languages (based on institution)
- Subtitles/captions on all videos

---

## 5. User Flows

### Student — First Login
1. Sign up / login
2. Take placement quiz
3. Get assigned learning level
4. View learning path
5. Start first module (video → notes → quiz)
6. See results → continue to next module

### Teacher — Daily Use
1. Login → Dashboard home
2. Check risk alerts → take action
3. View class performance chart
4. Upload new content or assign quiz
5. Check AI Avatar doubt logs

### Parent — Weekly Check
1. Login
2. See child's summary card
3. Tap to see score history and attendance
4. Download/view weekly report

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page load time | < 2 seconds |
| AI response time | < 3 seconds |
| Mobile responsive | Yes — all screens |
| Offline support | Basic content viewing (PWA cache) |
| Concurrent users | Supports 500+ per school instance |
| Accessibility | WCAG 2.1 AA compliant |
| Data privacy | Student data encrypted at rest and in transit |

---

## 7. Out of Scope (for Hackathon MVP)

- Native mobile apps (iOS/Android) — web only
- Video calling with teacher
- Payment/subscription system
- School ERP integration

---

## 8. MVP Priority Order

1. ✅ Personalized Learning Engine (core flow)
2. ✅ Teacher Dashboard (demo impact)
3. ✅ Risk Detection & Alerts (judge differentiator)
4. ✅ AI Teacher Avatar (wow factor)
5. ⬜ Parent Dashboard (nice to have)
6. ⬜ Accessibility Features (add last)

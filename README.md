# Zeron & Careon — Collaborative Learning Platform

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
```
Server runs at: **http://localhost:5000**

### 2. Start Frontend
```bash
cd frontend  
npm install
npm run dev
```
App runs at: **http://localhost:5173**

---

## 🔑 Default Credentials

| User | Username | Password |
|------|----------|----------|
| Zeron | `zeron` | `zeron123` |
| Careon | `careon` | `careon123` |

---

## 🧠 AI Setup (Free — Google Gemini)

1. Go to **https://aistudio.google.com/**
2. Sign in with `PROJECTOM2820@GMAIL.COM`
3. Click **Get API Key** → **Create API Key**
4. Copy the key
5. Edit `backend/.env` → set `GEMINI_API_KEY=your_key_here`
6. Restart backend

The AI works with smart fallback even without a key!

---

## 📧 Email Reminders

Configured for Gmail in `backend/.env`.
If emails fail, you may need to:
1. Enable 2-Step Verification on Gmail
2. Generate an **App Password**: https://myaccount.google.com/apppasswords
3. Use the 16-char App Password in `EMAIL_PASS`

---

## 🏗️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express + Socket.io
- **Database**: SQLite (zero configuration!)
- **AI**: Google Gemini API (free tier)
- **Email**: Nodemailer + Gmail SMTP
- **Real-time**: Socket.io WebSockets

---

## ✨ Features

- 🔐 Secure login (JWT + bcrypt)
- 📊 Progress tracking with GitHub-style heatmaps
- 👥 Dual workspace (view partner's progress)
- 📅 Smart AI Study Planner
- 📧 Email reminders (cron jobs)
- 🧾 Notes upload + AI processing
- 🎨 Real-time collaborative drawing
- 🧑‍💻 VS Code-style progress commits
- 📈 Analytics with charts
- 🔔 Real-time notifications
- 📚 24-topic predefined library
- 🤖 AI chat assistant
- ⏱️ Daily task system with auto-reschedule
- 🌙 Dark/light mode toggle
# ZERON

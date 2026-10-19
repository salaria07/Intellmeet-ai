# IntellMeet AI — Local Setup & Development Guide

Welcome to **IntellMeet AI**, an enterprise-grade AI-powered meeting and collaboration platform built on the MERN stack.

---

## 1. Prerequisites

Before running the application locally, ensure you have:
- **Node.js**: `v18.0.0` or higher (tested on Node `v24.x`)
- **npm**: `v9.0.0` or higher
- **MongoDB** (Optional for local persistent storage): Local MongoDB daemon or MongoDB Atlas connection URI. If no MongoDB server is present, IntellMeet AI seamlessly operates in **Resilient In-Memory Fallback Mode** with realistic seed data pre-populated.
- **OpenAI API Key** (Optional): Provide `OPENAI_API_KEY` in `backend/.env` for live OpenAI GPT-4o-mini summarization and action-item extraction. If absent, the platform automatically activates a labeled **High-Fidelity Demo Mode**.

---

## 2. Project Directory Overview

```
Intellmeet/
├── backend/            # Express, Mongoose, Socket.io, JWT auth & OpenAI services
├── frontend/           # React 18, Vite, Tailwind CSS, Lucide icons, Recharts
├── docs/               # Architecture, API & Deployment documentation
├── .gitignore          # Git exclusion rules
└── README.md           # Master project overview
```

---

## 3. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure the following settings in `backend/.env`:
   ```ini
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/intellmeet
   JWT_SECRET=intellmeet_enterprise_jwt_super_secret_key_2026_xyz
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```

4. **Start the backend server:**
   ```bash
   # Production / standard mode
   npm start

   # Development auto-reloading mode
   npm run dev
   ```
   The backend will be live at: `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`).

---

## 4. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Content of `frontend/.env`:
   ```ini
   VITE_API_URL=/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   The frontend will be available at: `http://localhost:5173`.

5. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 5. Demo Credentials

IntellMeet AI comes pre-seeded with enterprise accounts ready for instant 1-click evaluation:

| User | Email | Password | Role | Features |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Morgan** | `alex@intellmeet.ai` | `Password123!` | **Admin** | Workspace Owner, full permissions, cancel meetings, manage roles |
| **David Chen** | `david.chen@intellmeet.ai` | `Password123!` | **Manager** | AI Lead, invite members, host conference rooms |
| **Sarah Jenkins** | `sarah.j@intellmeet.ai` | `Password123!` | **Member** | Full Stack Engineer, task management, live meeting participant |
| **Marcus Vance** | `marcus.v@intellmeet.ai` | `Password123!` | **Member** | Cloud & Security Lead, task assigner |

---

## 6. Verification Steps

1. Visit `http://localhost:5173/login`.
2. Notice the glassmorphic split-screen login page inspired by the reference design.
3. Click **👑 Alex (Admin)** quick fill button and click **Sign In to IntellMeet**.
4. Explore all six primary navigation tabs on the left sidebar:
   - **Dashboard**: High-level telemetry, upcoming meetings, AI summary previews.
   - **Meetings**: Live meetings, scheduling modal, code invitations, details drawer.
   - **Team**: Collaborative member directory and role management.
   - **Tasks**: Interactive Kanban board and AI-extracted action-item conversion.
   - **Analytics**: Real-time charts powered by Recharts.
   - **Settings**: Profile avatar selection, theme toggle, and hardware defaults.
5. Launch or join a meeting room at `/meeting/:code` to test real-time WebRTC media controls, speech transcription, chat, and in-meeting AI summary processing!

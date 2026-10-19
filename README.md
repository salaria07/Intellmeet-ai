# IntellMeet AI — Enterprise AI Meeting & Collaboration Platform

> **Meet smarter. Move faster.**  
> *"Every meeting. One intelligent workspace."*

![IntellMeet AI Enterprise Architecture](https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80)

**IntellMeet AI** is a production-grade enterprise collaboration and meeting intelligence platform built on the **MERN stack**. Designed for distributed and hybrid engineering teams, IntellMeet AI unifies ultra-low latency WebRTC audio/video conferencing, real-time collaboration, automatic speech-to-text transcription, AI-powered meeting summaries, smart action-item extraction, and interactive Kanban task management.

---

## 🌟 Key Platform Highlights

### 1. Premium Blue-and-Gold Glassmorphism Authentication
- Inspired by enterprise-grade SaaS design principles: deep navy (`#060913`, `#0a0f24`) and midnight-blue surfaces with electric blue (`#38bdf8`), indigo, violet, and subtle warm gold (`#f59e0b`) accents.
- Split-screen layout featuring an interactive product-preview mockup, verified security badges, fine grid lines, and orbital rings.
- Fully functional authentication flows: **Login**, **Registration**, **Forgot Password**, and **Reset Password**.
- Pre-filled 1-click demo login buttons for rapid local evaluation.

### 2. Six Primary Persistent Dashboard Tabs
- **Tab 1: Dashboard (`/dashboard`)**: Personalized executive welcome banner, instant meeting launcher, room join bar, upcoming and recent sessions, latest AI summary preview, and assigned action items.
- **Tab 2: Meetings (`/meetings`)**: Meeting scheduling with time picker, ad-hoc instant rooms, invitation link copying, filter tabs (All, Upcoming, Live, Past), meeting cancellation, and an AI intelligence inspection drawer.
- **Tab 3: Team (`/team`)**: Collaborative member directory, rich profile cards, member status indicators (Online, Away, In Meeting), role-based permissions (Admin, Manager, Member), and member invitations.
- **Tab 4: Tasks (`/tasks`)**: Action item board with Kanban view (To Do, In Progress, Completed) and List view. One-click conversion of AI-extracted meeting action items into formal workspace tasks with links back to the originating meeting.
- **Tab 5: Analytics (`/analytics`)**: Enterprise productivity charts built with **Recharts** (Meeting hours over time, team participation trends, action items status breakdown, and JSON telemetry export).
- **Tab 6: Settings (`/settings`)**: Profile display name, avatar selector, password updater, dark/light appearance theme toggle, and default camera/microphone hardware preferences.

### 3. Dedicated WebRTC & Socket.io Meeting Room (`/meeting/:code`)
- **Peer-to-Peer Media**: Ultra-low latency video and audio conferencing using WebRTC `RTCPeerConnection` and Google public STUN infrastructure.
- **Interactive Controls**: Camera toggle, microphone mute/unmute, and display screen sharing.
- **Collaborative Sidebars**: Real-time room text chat, participant roster with host badges, and in-meeting live speech captions.
- **Direct AI Synthesis**: Trigger AI summary generation directly inside an active or concluded session.

### 4. AI Meeting Intelligence
- **OpenAI Integration**: Uses `gpt-4o-mini` with structured JSON output:
  - Executive Overview
  - Main Discussion Points
  - Explicit Decisions
  - Critical Takeaways
  - Unresolved Questions
  - Chronological Next Steps
  - Action Items (Title, Description, Assignee, Priority, Due Date)
- **High-Fidelity Demo Mode**: If an OpenAI API key is unavailable or quota is exceeded, IntellMeet automatically runs in a clearly labeled demo mode with realistic synthesized enterprise meeting summaries—ensuring zero broken UI states.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, Tailwind CSS, React Router DOM v6, Axios, Socket.io Client, Lucide React, Recharts |
| **Backend** | Node.js, Express.js, Socket.io, JWT (HTTP-only cookies + Bearer), bcryptjs, express-rate-limit |
| **Database** | MongoDB & Mongoose (with fail-safe automatic in-memory persistence fallback for zero-config testing) |
| **AI Engine** | OpenAI API (`gpt-4o-mini`) + Intelligent Context-Aware Synthesis Engine |
| **Real-time** | WebRTC (Mesh topology with STUN discovery) + Socket.io signaling server |

---

## 🚀 Quickstart Guide

### 1. Clone & Setup Backend
```bash
cd backend
npm install
cp .env.example .env
npm start
```
*Backend runs on `http://localhost:5000`*
*Health Check: `http://localhost:5000/api/health`*
*Interactive Swagger UI: `http://localhost:5000/api/docs`*

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🔑 Pre-Seeded Demo Credentials

| Name | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Alex Morgan** | `alex@intellmeet.ai` | `Password123!` | **Admin (Workspace Owner)** |
| **David Chen** | `david.chen@intellmeet.ai` | `Password123!` | **Manager (AI Lead)** |
| **Sarah Jenkins** | `sarah.j@intellmeet.ai` | `Password123!` | **Member (Full Stack)** |
| **Marcus Vance** | `marcus.v@intellmeet.ai` | `Password123!` | **Member (DevOps)** |

---

## 📁 Repository Structure

```
Intellmeet/
├── backend/
│   ├── src/
│   │   ├── config/             # Database connection & graceful fallback
│   │   ├── controllers/        # Auth, Meetings, Teams, Tasks, Analytics
│   │   ├── middleware/         # JWT protect, role authorization, error handler
│   │   ├── models/             # Mongoose schemas (User, Meeting, Task, etc.)
│   │   ├── routes/             # REST endpoints
│   │   ├── services/ai/        # OpenAI service & demo mode synthesis
│   │   ├── sockets/            # Socket.io WebRTC signaling & chat handler
│   │   ├── utils/              # Memory fallback store & token generator
│   │   ├── app.js              # Express app definition & CORS
│   │   └── server.js           # Server bootstrap & WebSocket server
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # AppLayout, ProtectedRoute
│   │   ├── context/            # AuthContext & Theme manager
│   │   ├── pages/              # Landing, Login, Register, 6 Dashboard Tabs
│   │   ├── services/           # Axios API client
│   │   ├── App.jsx             # React Router hierarchy
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Glassmorphism & ambient lighting tokens
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── package.json
│
├── docs/
│   ├── SETUP.md                # Detailed local setup instructions
│   ├── API.md                  # REST endpoints & Socket protocol specs
│   └── DEPLOYMENT.md           # Vercel, Node host, Atlas & STUN/TURN guide
│
├── .gitignore
└── README.md
```

---

## 📖 Further Documentation

- [Setup & Configuration Guide](docs/SETUP.md)
- [REST API & WebSocket Specifications](docs/API.md)
- [Production Cloud Deployment Guide](docs/DEPLOYMENT.md)

---

## 📄 License
This project is licensed under the MIT License — see the LICENSE file for details.

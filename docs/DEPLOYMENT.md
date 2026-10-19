# IntellMeet AI — Production Deployment Guide

This guide details how to deploy **IntellMeet AI** to production across cloud environments.

---

## 1. Cloud Architecture Overview

```
[ User Browser ]
       │
       ├── (HTTPS) ──────────> [ Vercel / Netlify ] (React + Vite Frontend)
       │                              │ (API Requests / JWT Cookie)
       │                              ▼
       ├── (HTTPS / WSS) ────> [ Render / Railway / AWS ] (Node.js Backend & Socket.io)
       │                              │
       │                              ├──> [ MongoDB Atlas ] (Encrypted Database)
       │                              └──> [ OpenAI API ] (GPT-4o-mini Summarization)
       │
       └── (WebRTC Media) ────> [ STUN / TURN Infrastructure ] (P2P Audio/Video Mesh)
```

---

## 2. Frontend Deployment (Vercel)

1. **Connect Repository to Vercel:**
   - Root directory: Select `frontend`.
   - Framework preset: `Vite`.
   - Build command: `npm run build`.
   - Output directory: `dist`.

2. **Environment Variables on Vercel:**
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://api.yourdomain.com/api` | Your production backend API endpoint |
   | `VITE_SOCKET_URL` | `https://api.yourdomain.com` | Production WebSocket server URL |

3. **Vercel Single Page App Rewrites:**
   Create or verify `frontend/vercel.json`:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 3. Backend Deployment (Render / Railway / Node.js Host)

1. **Service Configuration:**
   - Root directory: `backend`.
   - Runtime: `Node.js 20+`.
   - Build command: `npm install`.
   - Start command: `node src/server.js`.

2. **Backend Production Environment Variables:**
   ```ini
   PORT=5000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/intellmeet?retryWrites=true&w=majority
   JWT_SECRET=your_super_strong_cryptographic_jwt_secret_key_at_least_32_chars
   JWT_EXPIRES_IN=7d
   CLIENT_URL=https://your-frontend.vercel.app
   OPENAI_API_KEY=sk-proj-your-real-openai-api-key
   OPENAI_MODEL=gpt-4o-mini
   ```

3. **CORS & Cookie Configuration in Production:**
   - In production (`NODE_ENV=production`), `setAuthCookie` sets `secure: true` and `sameSite: 'strict'`.
   - Ensure your client and server are configured with HTTPS.

---

## 4. MongoDB Atlas Setup

1. Create a free or dedicated cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user with read/write privileges.
3. In **Network Access**, whitelist your backend IP or `0.0.0.0/0` (with strong user credentials).
4. Copy the connection string and paste it into `MONGODB_URI` on your backend host.

---

## 5. WebRTC STUN / TURN Infrastructure

In production enterprise corporate networks (behind symmetric NATs or strict firewalls), standard direct P2P connections may fail without a **TURN** (Traversal Using Relays around NAT) relay server.

### Recommended Providers:
- **Twilio Network Traversal Service**
- **Xirsys**
- **Cloudflare Calls**
- **Coturn** (Self-hosted Open Source TURN server)

### Updating STUN/TURN Servers:
In `frontend/src/pages/MeetingRoomPage.jsx`, update the `rtcConfig` object with your production credentials:
```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-service.com:3478',
      username: 'production-user',
      credential: 'production-password',
    },
  ],
};
```

---

## 6. Pre-Flight Production Checklist

- [x] All 6 dashboard tabs verified and tested.
- [x] Production build passes (`npm run build` generates optimized bundle).
- [x] JWT cookie configured with `httpOnly: true`.
- [x] MongoDB Atlas connection verified with fail-safe fallback.
- [x] OpenAI API key verified with labeled Demo Mode fallback.
- [x] WebRTC media permissions tested over HTTPS.

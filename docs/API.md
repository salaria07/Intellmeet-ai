# IntellMeet AI — REST API & WebSocket Documentation

- **Interactive Swagger UI**: [`http://localhost:5000/api/docs`](http://localhost:5000/api/docs)
- **OpenAPI 3.0 Specification (JSON)**: [`http://localhost:5000/api/docs.json`](http://localhost:5000/api/docs.json)
- **Base API URL**: `http://localhost:5000/api`  
- **Real-time Socket.io Endpoint**: `ws://localhost:5000`

---

## 1. Authentication & Session Management

All private endpoints require authentication via an HTTP-only JWT cookie (`token`) or an `Authorization: Bearer <token>` header.

### `POST /api/auth/register`
Create a new user account.
- **Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@company.com",
    "password": "Password123!",
    "role": "Member",
    "jobTitle": "Product Designer",
    "department": "UX & Research"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account created successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "_id": "65a000...",
      "name": "Jane Doe",
      "email": "jane@company.com",
      "role": "Member",
      "jobTitle": "Product Designer"
    }
  }
  ```

### `POST /api/auth/login`
Authenticate user credentials and set secure HTTP-only cookie.
- **Body:**
  ```json
  {
    "email": "alex@intellmeet.ai",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):** Returns user object, sets cookie `token`.

### `POST /api/auth/logout`
Clears session cookie.

### `GET /api/auth/me`
Returns current authenticated user details and preferences.

### `PUT /api/auth/profile`
Updates current user's display name, avatar, job title, department, or preferences.

### `PUT /api/auth/password`
Updates password after verifying `currentPassword`.

### `POST /api/auth/forgot-password`
Generates a secure password reset token.

### `POST /api/auth/reset-password/:token`
Resets password using valid reset token.

---

## 2. Meetings & Video Conferencing

### `GET /api/meetings`
Query user's meetings.
- **Query Params:**
  - `status`: `all` | `upcoming` | `live` | `past`
  - `limit`: number (default: 50)

### `GET /api/meetings/:code`
Retrieves meeting details, host, participant roster, transcript, and AI summary by meeting code or MongoDB `_id`.

### `POST /api/meetings/instant`
Instantly provisions a live WebRTC collaboration room with unique code (e.g. `mtg-xxx-yyy`).
- **Body:**
  ```json
  {
    "title": "Ad-Hoc Architecture Sync"
  }
  ```

### `POST /api/meetings/schedule`
Schedules a future meeting session.
- **Body:**
  ```json
  {
    "title": "Q4 OKR Review",
    "description": "Cross-functional team alignment.",
    "scheduledStartTime": "2026-10-25T14:00:00.000Z",
    "durationMinutes": 60,
    "invitedEmails": ["david.chen@intellmeet.ai", "sarah.j@intellmeet.ai"]
  }
  ```

### `POST /api/meetings/:code/join`
Adds user to meeting room participants and marks meeting as `live`.

### `PUT /api/meetings/:code/end`
Terminates a live meeting, records actual end time, and calculates duration in minutes.

### `DELETE /api/meetings/:id`
Cancels a scheduled meeting (restricted to host or Admin).

### `POST /api/meetings/:code/transcript`
Appends a real-time speech-to-text transcript segment.
- **Body:**
  ```json
  {
    "speaker": "David Chen",
    "text": "The WebRTC signaling handshake latency has dropped below 80ms.",
    "offsetSeconds": 145
  }
  ```

### `POST /api/meetings/:code/summary`
Triggers OpenAI GPT-4o-mini structured summary extraction from meeting transcripts (or labeled high-fidelity demo synthesis when API key is not configured).
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "summary": {
      "overview": "Executive summary of the session...",
      "discussionPoints": ["Point 1", "Point 2"],
      "decisions": ["Decision 1"],
      "takeaways": ["Takeaway 1"],
      "unresolvedQuestions": ["Question 1"],
      "nextSteps": ["Step 1"],
      "actionItems": [
        {
          "title": "Deploy audio pipeline benchmarks",
          "assigneeName": "Sarah Jenkins",
          "priority": "High",
          "dueDate": "2026-10-28T00:00:00.000Z"
        }
      ],
      "isAIGenerated": true,
      "isDemoMode": false,
      "modelUsed": "gpt-4o-mini"
    }
  }
  ```

---

## 3. Team Workspace Management

### `GET /api/teams`
Fetches primary workspace team, member directory, availability statuses, and roles.
- **Query Params:** `search`, `role`, `status`

### `POST /api/teams/invite` *(Admin or Manager only)*
Invites a new member to the workspace.
- **Body:**
  ```json
  {
    "name": "Jordan Hayes",
    "email": "jordan@company.com",
    "role": "Member",
    "jobTitle": "Security Architect"
  }
  ```

### `PUT /api/teams/members/:id/role` *(Admin only)*
Promotes or modifies a member's role (`Admin`, `Manager`, `Member`).

---

## 4. Task & Action-Item Management

### `GET /api/tasks`
Lists all workspace tasks with optional filtering (`status`, `priority`, `search`).

### `GET /api/tasks/stats`
Returns aggregated task KPIs: total tasks, completed, in progress, overdue count, and completion rate.

### `POST /api/tasks`
Creates a manual task.
- **Body:**
  ```json
  {
    "title": "Audit WebRTC ICE servers",
    "description": "Verify STUN/TURN failover in production.",
    "assigneeName": "Marcus Vance",
    "priority": "Critical",
    "dueDate": "2026-10-27T00:00:00.000Z"
  }
  ```

### `POST /api/tasks/convert-action-item`
Converts an AI meeting summary action item into a formal workspace task, linking it back to the originating meeting.

### `PUT /api/tasks/:id`
Updates task status (`To Do`, `In Progress`, `Completed`), title, priority, or assignee.

### `DELETE /api/tasks/:id`
Deletes a task from the board.

---

## 5. Analytics Telemetry

### `GET /api/analytics`
Calculates aggregated meeting hours, average session length, weekly meeting frequencies, task completion velocity, and individual participation hours.

---

## 6. Real-Time Socket.io Protocol

Connected client connects to `ws://localhost:5000`.

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-room` | Client -> Server | `{ meetingCode, user }` | Joins room and requests existing participants |
| `existing-participants`| Server -> Client | `[ { socketId, user, mediaStatus } ]` | Informs newly joined peer of peers in room |
| `user-joined` | Server -> Client | `{ socketId, user, mediaStatus }` | Notifies room peers of new participant |
| `signal-offer` | Client <-> Server | `{ toSocketId, offer, fromUser }` | WebRTC SDP offer negotiation |
| `signal-answer`| Client <-> Server | `{ toSocketId, answer }` | WebRTC SDP answer negotiation |
| `signal-ice` | Client <-> Server | `{ toSocketId, candidate }` | WebRTC ICE candidate discovery |
| `send-chat` | Client -> Server | `{ meetingCode, message }` | Sends in-meeting text chat |
| `new-chat` | Server -> Client | `{ id, sender, message, timestamp }` | Broadcasts new chat message to room |
| `toggle-media` | Client -> Server | `{ meetingCode, mediaType, enabled }` | Notifies peers of mic/camera/screen changes |
| `live-transcript-chunk`| Client -> Server| `{ meetingCode, segment }` | Broadcasts real-time spoken captions |
| `user-left` | Server -> Client | `{ socketId, user }` | Notifies peers when participant disconnects |

# 🛡️ Emerald Chat — Backend Server & Real-Time Engine

> **Secure REST API & Real-Time WebSocket Engine**  
> Powered by Node.js (ESM), Express, MongoDB (Mongoose), Socket.io, and Cloudinary. Features zero-API-key automated content moderation and spam heuristics.

---

## 📖 Overview

The **Emerald Chat** server powers all communication, user authentication, channel management, media uploads, and administrative control. It features an integrated heuristics engine that screens messages in real time for profanity, scams, suspicious shortlinks, and abusive cross-message flooding without requiring external third-party moderation APIs.

---

## 🏗️ Architectural Core

```
chatapp-server-master/
├── constants/
│   ├── config.js               # CORS origins & cookie configurations
│   └── events.js               # WebSocket event definitions
│
├── controllers/
│   ├── admin.js                # Admin analytics, moderation scan, chat & user controls
│   ├── chat.js                 # Channels, group management, messaging, attachments
│   ├── status.js               # 24-hour status stories & view tracking
│   └── user.js                 # Authentication, search, friend requests
│
├── middlewares/
│   ├── auth.js                 # JWT verification (Cookie & Bearer fallback) & adminOnly guard
│   ├── error.js                # Global error middleware & TryCatch wrapper
│   └── multer.js               # Multi-part file buffer handling
│
├── models/
│   ├── chat.js                 # Chat schema (group chats, membership, creator)
│   ├── message.js              # Message schema (content, attachments, sender, chat ref)
│   ├── request.js              # Friend requests & status transitions
│   ├── status.js               # 24h ephemeral stories & viewers array
│   └── user.js                 # User schema with bcrypt password hashing
│
├── routes/
│   ├── admin.js                # /api/v1/admin/*
│   ├── chat.js                 # /api/v1/chat/*
│   ├── status.js               # /api/v1/status/*
│   └── user.js                 # /api/v1/user/*
│
├── utils/
│   ├── features.js             # Cloudinary upload & deletion utilities
│   ├── moderation.js           # Multi-layered content moderation & flood detection
│   └── utility.js              # Custom ErrorHandler class
│
├── app.js                      # Express setup, HTTP server, & Socket.io listeners
└── package.json                # Dependencies, scripts, & overrides
```

---

## 🛡️ Content Moderation & Flood Engine ([`utils/moderation.js`](utils/moderation.js))

The moderation subsystem runs entirely locally on the server without external API overhead or billing dependencies:

### 1. Multi-Engine Profanity Detection
- **`leo-profanity`**: Performs instant plain-dictionary matching against English vulgarities.
- **`glin-profanity`**: Evaluates leetspeak and substituted characters (`b!tch`, `sh1t`, `f*ck`). Initialized with `allowObfuscatedMatch: false` to prevent cross-word false positives.
- **Single-Letter Deobfuscation Tokenizer** (`deobfuscateTokens`): Collapses intentionally fragmented text (`f.u.c.k`, `f u c k`, `f-u-c-k`) into unified tokens before evaluation.

### 2. Threat & Hate Speech Escalation
- Explicit phrase matching for severe threats (`kill yourself`, `kys`, `i will kill you`, `bomb threat`, `terrorist`, `rape`).
- Violations are immediately assigned `severity: "high"` with a risk score weighting of $\ge 80/100$.

### 3. Phishing, Scam, & Domain Filters
- Scans for crypto solicitation keywords (`free crypto`, `crypto giveaway`, `send btc`, `guaranteed profit`).
- Flags dangerous URL shorteners and untrusted TLDs (`bit.ly`, `tinyurl.com`, `.xyz`, `.top`, `.click`, `.ru`, `.buzz`).
- Flags link flooding ($\ge 3$ URLs in a single payload) and contact harvesting patterns (phone numbers paired with "whatsapp me" / "call me").

### 4. Cross-Message Flood Pattern Detection (`detectFloodPatterns`)
- Evaluates recent messages within a rolling 60-second window per sender:
  - **Duplicate Message Flood**: Flags senders repeating identical content $\ge 3$ times within 60s.
  - **Burst Rate Flood**: Flags senders exceeding $\ge 8$ messages within 60s.
- Aggregated dynamically into both `allMessages` and `getDashboardStats` in [`controllers/admin.js`](controllers/admin.js).

---

## 🔐 Security & Authentication

- **Dual-Mode JWT Verification**:
  1. Checks `Authorization: Bearer <token>` header (preferred for cross-site deployments).
  2. Falls back to secure, HTTP-only cookie (`chattu-token`).
- **Algorithm Pinning**: Explicitly validates signatures using `{ algorithms: ["HS256"] }` to eliminate algorithm downgrade vulnerabilities.
- **Access Control**: Role-based `adminOnly` middleware validates admin credentials against `ADMIN_SECRET_KEY`.
- **Infrastructure Defense**: Protected by `helmet` for secure HTTP headers, `cors` for origin restriction, and `express-rate-limit` to prevent brute-force attacks.

---

## 📡 WebSocket Protocols & Real-Time Signaling

The Socket.io server coordinates real-time events and WebRTC peer connection signaling:

| Event Name | Direction | Description |
| :--- | :--- | :--- |
| `NEW_MESSAGE` | Server $\to$ Client | Broadcasts newly dispatched message to chat room members |
| `NEW_MESSAGE_ALERT` | Server $\to$ Client | Dispatches push/badge counter to inactive chat members |
| `START_TYPING` | Client $\to$ Server | Notifies recipients that the user is composing a message |
| `STOP_TYPING` | Client $\to$ Server | Clears the active typing indicator |
| `ONLINE_USERS` | Server $\to$ Client | Emits array of active user IDs currently connected |
| `CALL_USER` | Client $\leftrightarrow$ Server | Initiates WebRTC call offer to a remote peer |
| `CALL_ACCEPTED` | Client $\leftrightarrow$ Server | Delivers WebRTC SDP answer to complete peer connection |
| `CALL_ENDED` | Client $\leftrightarrow$ Server | Terminates active peer connection and tears down media tracks |
| `ICE_CANDIDATE` | Client $\leftrightarrow$ Server | Exchanges network candidates for NAT traversal (STUN/TURN) |

---

## 🌐 API Route Reference

### Authentication & Users (`/api/v1/user`)
- `POST /new` — Register new user account (with avatar file upload).
- `POST /login` — Authenticate credentials and receive JWT.
- `GET /me` — Retrieve current authenticated user profile.
- `GET /logout` — Invalidate session and clear auth cookies.
- `GET /search?name=` — Search registered users by name or username.
- `PUT /sendrequest` — Send a friend invitation to another user.
- `PUT /acceptrequest` — Accept or reject an incoming friend request.
- `GET /notifications` — Retrieve pending friend requests.
- `GET /friends` — Fetch list of confirmed friends.

### Chats & Messaging (`/api/v1/chat`)
- `POST /new` — Create a new group chat channel with specified members.
- `GET /my` — Fetch all direct and group conversations for the logged-in user.
- `GET /message/:id?page=1` — Retrieve paginated messages for a conversation.
- `POST /message` — Send media attachments and document files with captions.
- `PUT /message/:id/read` — Mark conversation messages as read.
- `PUT /addmembers` — Add members to an existing group chat.
- `PUT /removemember` — Remove a member from a group (creator only).
- `DELETE /leave/:id` — Leave a group chat.
- `DELETE /:id` — Delete an entire chat conversation.

### Ephemeral Stories (`/api/v1/status`)
- `GET /` — Fetch active statuses from friends within the 24-hour expiration window.
- `POST /` — Publish a new status story (text slide with background or media file upload).
- `PUT /:id/view/:slideId` — Mark a status slide as viewed by the current user.
- `DELETE /:id/slide/:slideId` — Delete a specific slide from the user's status story.

### Administration (`/api/v1/admin`)
- `POST /verify` — Authenticate as Administrator with secret key.
- `GET /` — Verify active admin token session.
- `GET /stats` — Retrieve high-level KPI telemetry, 7-day charts, and moderation counters.
- `GET /users` — View all registered user dossiers and statistics.
- `DELETE /users/:id` — Ban/delete user and clean up their memberships.
- `GET /chats` — List all conversations with member rosters.
- `DELETE /chats/:id` — Force purge a chat channel and associated media.
- `GET /messages` — List all database messages with real-time moderation analysis.
- `DELETE /messages/:id` — Permanently delete a message and purge files from Cloudinary.

---

## ⚙️ Environment Variables

Create a `.env` file in the root of `chatapp-server-master/`:

```env
# Server Network Settings
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database Connection
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/emerald_chat?retryWrites=true&w=majority

# Security Secrets
JWT_SECRET=super_secret_jwt_random_key_here
ADMIN_SECRET_KEY=admin_master_access_key_here

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev
```
Starts the server with automatic restart via `nodemon` on `http://localhost:3000`.

### 3. Run in Production
```bash
npm start
```

---

## ☁️ Deployment (Render)

1. Connect your GitHub repository to [Render](https://render.com).
2. Create a new **Web Service** with the Root Directory set to `chatapp-server-master`.
3. Set **Runtime** to `Node`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `npm start`.
6. Add all keys from the `.env` file into Render's **Environment Variables** dashboard.

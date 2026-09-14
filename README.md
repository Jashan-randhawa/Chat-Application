# 💎 Emerald Chat

> **Modern, Executive Real-Time Messaging & Encrypted Collaboration Platform**  
> Engineered with React 18, TypeScript, Tailwind CSS, Node.js, Express, Socket.io, and WebRTC. Styled in **Imperial Emerald**.

---

## 🌟 Highlights

- **💎 Imperial Emerald Design System** — Tailored luxury emerald palette (`#10b981`), glassmorphism, responsive navigation rail, and dark/light modes.
- **⚡ Real-Time Messaging Mesh** — Sub-millisecond WebSocket communication powered by Socket.io, online presence tracking, typing indicators, and read receipts.
- **📎 WhatsApp-Style Selective Media & Document Sharing** — Multi-file selective document preview, list-manner inspection, custom captions, and Cloudinary media processing.
- **🛡️ Automated Content Moderation & Spam Engine** — Zero-API-key heuristics with `leo-profanity` & `glin-profanity` for leetspeak/obfuscation, crypto scams, phishing links, and cross-message burst/duplicate flood detection.
- **📞 Peer-to-Peer Calls** — Real-time audio and video calling powered by WebRTC mesh signaling.
- **📸 24-Hour Stories / Status** — Rich text and multimedia status sharing with auto-expiration and viewed indicators.
- **🔒 Admin Control Center** — Comprehensive admin portal with security telemetry, live content safety scoring, user dossiers, channel inspection, and 1-click message purge.

---

## 🛠️ Tech Stack

### Frontend (`chatapp-frontend-master`)
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + Lucide Icons + Framer Motion
- **State**: Zustand (`appStore`)
- **Networking**: Axios + Socket.io Client
- **Charts**: Chart.js + React-Chartjs-2
- **Testing**: Vitest

### Backend (`chatapp-server-master`)
- **Runtime**: Node.js (ESM) + Express
- **Database**: MongoDB + Mongoose
- **Real-Time**: Socket.io Server
- **Security & Auth**: JWT (HS256) + bcrypt + Helmet + Express Rate Limit
- **Moderation**: `leo-profanity` + `glin-profanity` + Custom Token Deobfuscator
- **Storage**: Cloudinary + Multer

---

## 📁 Repository Layout

```
Chat-Application/
├── chatapp-frontend-master/     # React 18 + Vite client
│   ├── public/                  # Emerald logo.svg & favicon.svg
│   └── src/
│       ├── components/          # AppLogo, ChatArea, Sidebar, AdminLayout
│       ├── pages/               # Index, Login, Groups, Admin (Dashboard, Messages, Users, Chats)
│       ├── store/               # Zustand state store
│       └── services/            # Axios API endpoints
│
└── chatapp-server-master/       # Express + Socket.io backend
    ├── controllers/             # chat.js, user.js, admin.js, status.js
    ├── utils/                   # moderation.js (spam heuristics & flood engine)
    ├── middlewares/             # auth.js, error.js, multer.js
    ├── models/                  # User, Message, Chat, Request, Status
    └── app.js                   # Server entrypoint & WebSocket handler
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd chatapp-server-master
npm install
```

Create `.env` in `chatapp-server-master/`:

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
ADMIN_SECRET_KEY=your_admin_master_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Start the server:
```bash
npm start
```

### 2. Frontend Setup

```bash
cd chatapp-frontend-master
npm install
```

Create `.env` in `chatapp-frontend-master/`:

```env
VITE_SERVER=http://localhost:3000
```

Start the frontend development server:
```bash
npm run dev
```

Visit `http://localhost:5173` to launch **Emerald Chat**.

---

## 🛡️ Content Moderation & Security Engine

The server includes an automated moderation engine ([`utils/moderation.js`](chatapp-server-master/utils/moderation.js)):

1. **Abusive Language & Profanity**: Dual-engine detection via `leo-profanity` and `glin-profanity`, combined with single-letter token deobfuscation (`f.u.c.k` / `f u c k` $\to$ `fuck`).
2. **Threats & Hate Speech**: Immediate high-severity escalation for critical threat phrases.
3. **Spam & Phishing**: Filters crypto giveaways, investment scams, and suspicious URL shorteners (`bit.ly`, `tinyurl.com`, `.xyz`, etc.).
4. **Flood Pattern Detection**:
   - **Duplicate Message Flood**: Flags senders posting the same message $\ge 3$ times within 60s.
   - **Burst Rate Flood**: Flags senders sending $\ge 8$ messages within 60s.
5. **Admin Moderation Queue**: 1-click filtering (`Flagged`, `Spam`, `Inappropriate`) and immediate message/media deletion from MongoDB and Cloudinary.

---

## 📦 Production Deployment

- **Frontend (Vercel)**: Import `chatapp-frontend-master/`, set `VITE_SERVER=https://your-backend.onrender.com`.
- **Backend (Render)**: Deploy `chatapp-server-master/` as a Node Web Service, set `.env` variables, and build with `npm install && npm start`.

---

## 📄 License

This project is licensed under the MIT License — open for personal and commercial development.

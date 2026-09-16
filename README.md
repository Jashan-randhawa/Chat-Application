<div align="center">

# 💎 Emerald Chat

### Modern Real-Time Messaging & Encrypted Collaboration Platform

An executive full-stack chat application built with **React 18**, **TypeScript**, **Socket.io**, and **WebRTC**. Styled in **Imperial Emerald** glassmorphism with automated spam heuristics and rich multimedia sharing.

<br/>

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-00dfa2?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![GitHub](https://img.shields.io/badge/GitHub-Jashan--randhawa-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Jashan-randhawa/Chat-Application)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P_Calls-333333?style=flat-square&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Emerald-10B981?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-443e38?style=flat-square)](https://github.com/pmndrs/zustand)

</div>

---

## ✨ Key Capabilities

- ⚡ **Real-Time Mesh** — Sub-millisecond WebSocket delivery via Socket.io with typing indicators, online presence, and read receipts.
- 📞 **P2P Audio & Video Calls** — Crystal-clear peer-to-peer calling powered by WebRTC mesh signaling.
- 📎 **WhatsApp-Style Media & Documents** — Selective multi-file inspection, custom captions, and Cloudinary media processing.
- 🛡️ **Automated Content Moderation** — Zero-key heuristics for profanity, crypto scams, phishing links, and message flood/burst protection.
- 📸 **24-Hour Stories** — Multimedia and text status updates with automatic 24-hour expiration.
- 💎 **Imperial Emerald Theme** — Luxury emerald palette (`#10b981`), dark/light mode toggle, and responsive glassmorphic navigation rail.
- 🔒 **Admin Command Center** — Security telemetry, safety scoring, user dossiers, and 1-click message purge.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies | Role |
| :--- | :--- | :--- |
| **Frontend** | **React 18**, Vite, TypeScript, Tailwind CSS, shadcn/ui | Glassmorphic UI, responsive layouts, client routing |
| **State & Flow** | **Zustand**, Axios, Framer Motion | Lightweight reactive store & smooth UI micro-interactions |
| **Real-Time & Calls** | **Socket.io Client**, WebRTC API | Event-driven WebSocket chat & peer-to-peer calling |
| **Backend API** | **Node.js (ESM)**, Express.js | REST routing, JWT authentication, and rate limiting |
| **Data & Storage** | **MongoDB Atlas** (Mongoose), Cloudinary CDN | Persistent documents, conversation logs & cloud media CDN |
| **Content Safety** | `leo-profanity`, `glin-profanity`, Token Deobfuscator | In-flight content sanitization and anti-spam shields |

---

## 🚀 Quick Start

### 1. Backend Server
```bash
cd chatapp-server-master
npm install

# Configure environment (create .env)
# PORT=3000, MONGO_URI, JWT_SECRET, CLOUDINARY_*

npm start          # Runs on http://localhost:3000
```

### 2. Frontend Client
```bash
# In a separate terminal
cd chatapp-frontend-master
npm install

# Configure environment (create .env)
# VITE_SERVER=http://localhost:3000

npm run dev        # Runs on http://localhost:5173
```

---

## 📁 Project Structure

```
Chat-Application/
├── chatapp-frontend-master/     # React 18 + TypeScript Client
│   ├── src/components/          # ChatArea, Sidebar, AdminLayout, AppLogo
│   ├── src/pages/               # Chat, Groups, Stories, Admin Dashboard
│   └── src/store/               # Zustand state management
└── chatapp-server-master/       # Express + Socket.io Server
    ├── controllers/             # chat.js, user.js, admin.js, status.js
    ├── utils/                   # moderation.js (heuristics & anti-flood)
    └── models/                  # User, Message, Chat, Request, Status
```

---

## 👨‍💻 Creator & Maintainer

<div align="center">

**Jashanpreet Singh**  
*Full Stack & AI Developer*

[![Portfolio](https://img.shields.io/badge/Portfolio-jashan2978.vercel.app-00dfa2?style=flat-square&logo=vercel&logoColor=white)](https://jashan2978.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Jashan--randhawa-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Jashan-randhawa)

<br/>

<sub>Distributed under the [MIT License](./LICENSE). Made with 💎 for seamless real-time collaboration.</sub>

</div>

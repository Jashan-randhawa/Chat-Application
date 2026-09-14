# 💎 Emerald Chat — Frontend Client

> **Executive Real-Time Messaging & Collaboration Web Application**  
> Built with React 18, TypeScript, Vite, Tailwind CSS, Zustand, and Socket.io Client. Styled exclusively in **Imperial Emerald**.

---

## 📖 Overview

The **Emerald Chat** frontend provides a modern web communication experience. Engineered for speed, security, and fluid aesthetics, it combines instant messaging with WebRTC peer-to-peer calling, WhatsApp-style selective document sharing, 24-hour status stories, and a moderation-enabled Admin Control Center.

---

## ✨ Core Features & Modules

### 1. 💎 Imperial Emerald Design System
- **Luxury Theme Tokens**: Tailored palette centered on deep emerald (`#10b981`), luminous mint (`#34d399`), and dark slate/obsidian canvas backdrops.
- **Glassmorphism & Micro-interactions**: Smooth transitions powered by Framer Motion, backdrop blurs, tactile button responses, and responsive layouts across mobile and desktop.
- **Brand Identity**: Custom vector logo component ([`AppLogo.tsx`](src/components/common/AppLogo.tsx)) and SVG favicon rendering across all viewports.
- **Dark/Light Mode**: Full theme switching supported via [`ThemeToggle.tsx`](src/components/ThemeToggle.tsx).

### 2. ⚡ Real-Time Messaging Mesh
- **WebSocket Synchronization**: Connects to the backend Socket.io server with automatic reconnection and heartbeat pinging.
- **Interactive Chat Interface** ([`ChatArea.tsx`](src/components/chat/ChatArea.tsx)):
  - Instant delivery and rendering of sent and received messages.
  - Inline reply parsing with parent message snippet quoting ([`replyUtils.ts`](src/lib/replyUtils.ts)).
  - Real-time typing indicators (`START_TYPING` / `STOP_TYPING`).
  - Read receipts with dynamic visual check indicators.
  - Automatic smooth scroll to bottom with manual jump button when reviewing older logs.

### 3. 📎 WhatsApp-Style Selective Document & Media Sharing
- **Attachment Modal**: Multi-file picker supporting images, videos, audio, PDFs, spreadsheets, and archives.
- **Selective List Inspection**: Selected files are presented in an editable list-manner view allowing users to preview thumbnails, review filenames, delete unwanted items before sending, and compose custom message captions.
- **Optimized Rendering**: Dynamic media bubble rendering with audio visualizers, video player controls, and full-screen image inspection.

### 4. 📞 WebRTC Audio & Video Calling
- **P2P Mesh Calling** ([`useWebRTC.ts`](src/hooks/useWebRTC.ts) & [`CallModal.tsx`](src/components/chat/CallModal.tsx)):
  - Direct 1-on-1 audio and video calls over WebRTC.
  - Socket.io signaling protocol handles call offers, answers, and ICE candidate exchanges.
  - In-call controls: mute microphone, disable camera, switch camera, and full-screen video view.

### 5. 📸 24-Hour Ephemeral Status Stories
- **Story Hub** ([`StatusList.tsx`](src/components/status/StatusList.tsx)):
  - Publish text statuses with custom color backgrounds or image/video media slides.
  - Real-time viewed indicators with unread status ring highlights on contacts.
  - Auto-advancing story carousel viewer ([`StatusViewer.tsx`](src/components/status/StatusViewer.tsx)).

### 6. 🛡️ Executive Admin Control Center
- **Security Dashboard** ([`Dashboard.tsx`](src/pages/admin/Dashboard.tsx)):
  - Telemetry graphs (messages over 7 days, user signups, chat type distribution).
  - Live system health metrics (server uptime, memory heap, online socket connections).
  - **Content Moderation Banner**: Displays real-time counts for flagged content, spam signals, and high-severity violations.
- **Messages & Moderation Log** ([`MessageManagement.tsx`](src/pages/admin/MessageManagement.tsx)):
  - Multi-tab filtering: `All`, `⚠️ Flagged`, `🛡️ Spam & Scams`, `🚫 Inappropriate`, `📎 Media`, `📝 Text Only`.
  - Color-coded severity alert badges (`High Alert`, `Flagged`).
  - **Message Payload & Moderation Inspector**: Breakdown of risk score (0–100), policy violations, matched keywords, and 1-click permanent deletion.
- **User & Chat Management**:
  - User dossiers with ban/delete controls ([`UserManagement.tsx`](src/pages/admin/UserManagement.tsx)).
  - Group channel inspection and admin purge ([`ChatManagement.tsx`](src/pages/admin/ChatManagement.tsx)).

---

## 📁 Source Directory Layout

```
chatapp-frontend-master/
├── public/
│   ├── favicon.svg             # Browser tab favicon
│   └── logo.svg                # Emerald Chat vector logo
│
├── src/
│   ├── components/
│   │   ├── admin/              # AdminLayout & navigation
│   │   ├── chat/               # ChatArea, ChatInput, MessageBubble, Sidebar, CallModal
│   │   ├── common/             # AppLogo.tsx vector component
│   │   ├── status/             # StatusList, StatusViewer, AddStatusModal
│   │   └── ui/                 # Accessible UI components (Dialog, Input, Tooltip, Alert)
│   │
│   ├── config/
│   │   ├── constants.ts        # Socket event names & app configs
│   │   └── palette.ts          # Imperial Emerald color definitions
│   │
│   ├── context/
│   │   └── SocketContext.tsx   # Global Socket.io provider & event emitter
│   │
│   ├── hooks/
│   │   └── useWebRTC.ts        # PeerConnection lifecycle & signaling hook
│   │
│   ├── lib/
│   │   ├── features.ts         # Formatting helpers (date, file icons)
│   │   ├── replyUtils.ts       # Reply format encoding/decoding
│   │   └── utils.ts            # Tailwind class merger (clsx + twMerge)
│   │
│   ├── pages/
│   │   ├── Index.tsx           # Main workspace entry (chat layout)
│   │   ├── Login.tsx           # Authentication & signup portal
│   │   ├── Groups.tsx          # Group conversation workspace
│   │   └── admin/              # Dashboard, MessageManagement, UserManagement, ChatManagement
│   │
│   ├── services/
│   │   └── api.ts              # Axios client with JWT interceptor & API endpoints
│   │
│   ├── store/
│   │   └── appStore.ts         # Zustand global application state
│   │
│   ├── App.tsx                 # Client-side router & route guards
│   └── main.tsx                # React root entry
│
├── index.html                  # HTML template with metadata & logo links
├── vite.config.ts              # Vite bundler configuration
└── package.json                # Dependencies & scripts
```

---

## 🛠️ Environment Configuration

Create a `.env` file in the root of `chatapp-frontend-master/`:

```env
# Backend server URL (Express + Socket.io)
VITE_SERVER=http://localhost:3000
```

> **Production Note**: When deploying on Vercel, set `VITE_SERVER` to your production backend URL (e.g. `https://your-api.onrender.com`).

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```
The optimized bundle will be compiled into the `dist/` directory.

### 4. Run Unit Tests
```bash
npm run test
```
Executes the Vitest test suite.

---

## 📦 Key Dependencies

| Package | Purpose |
| :--- | :--- |
| `react` & `react-dom` | UI component foundation (v18) |
| `vite` | Next-generation build tool & dev server |
| `zustand` | Lightweight global store for chat state & notifications |
| `socket.io-client` | Real-time bidirectional WebSocket transport |
| `tailwindcss` | Utility-first styling framework |
| `framer-motion` | Smooth UI transitions & modal animations |
| `chart.js` & `react-chartjs-2` | Telemetry & analytics visualizations in Admin |
| `lucide-react` | Crisp modern vector iconography |
| `sonner` | Toast notification system |
| `axios` | HTTP client with automatic auth header injection |

# 💬 Chat Application

A full-stack, real-time chat application built with React + TypeScript on the frontend and Node.js + Express on the backend. Supports private messaging, group chats, voice messages, status updates, video/audio calls, and an admin dashboard.

🚀 **Live Demo**: [https://chat-application-five-kappa.vercel.app/](https://chat-application-five-kappa.vercel.app/)

---

## ✨ Features

- 🔐 **JWT Authentication** — Secure login/signup with token-based auth
- 💬 **Real-Time Messaging** — Instant messaging via Socket.io
- 👥 **Group Chats** — Create and manage group conversations
- 🎙️ **Voice Messages** — Record and send audio messages
- 📸 **Status Updates** — Share photo/video statuses (WhatsApp-style)
- 📞 **Voice & Video Calls** — In-app calling via WebRTC
- 🌐 **Media Uploads** — Image and file sharing via Cloudinary
- 🛡️ **Admin Dashboard** — Manage users, chats, and messages
- 🌗 **Dark / Light Mode** — Theme support via `next-themes`
- 📱 **Responsive UI** — Works on desktop and mobile

---

## 🛠️ Tech Stack

### Frontend (`chatapp-frontend-master/`)

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS + shadcn/ui | Styling & UI components |
| Zustand | Global state management |
| Socket.io-client | Real-time communication |
| Axios | HTTP requests |
| Framer Motion | Animations |
| React Router v6 | Client-side routing |
| React Hook Form + Zod | Forms & validation |
| TanStack Query | Server state & caching |
| Recharts / Chart.js | Admin analytics charts |

### Backend (`chatapp-server-master/`)

| Technology | Purpose |
|---|---|
| Node.js + Express | Server framework |
| MongoDB + Mongoose | Database & ODM |
| Socket.io | Real-time WebSocket server |
| JWT | Authentication |
| Cloudinary | Media file storage |
| Multer | File upload middleware |

---

## 📁 Project Structure

```
Chat-Application-main/
├── chatapp-frontend-master/       # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/              # ChatArea, Sidebar, MessageBubble, ChatInput, etc.
│   │   │   ├── status/            # StatusList, StatusViewer, AddStatusModal
│   │   │   ├── admin/             # AdminLayout
│   │   │   └── ui/                # shadcn/ui base components
│   │   ├── pages/
│   │   │   ├── Index.tsx          # Main chat page
│   │   │   ├── Login.tsx          # Auth page
│   │   │   ├── Groups.tsx         # Group chats
│   │   │   └── admin/             # Dashboard, UserMgmt, ChatMgmt, MessageMgmt
│   │   ├── context/
│   │   │   └── SocketContext.tsx  # Socket.io provider
│   │   ├── store/
│   │   │   └── appStore.ts        # Zustand global store
│   │   └── App.tsx                # Routes & protected routes
│   ├── public/
│   └── package.json
│
├── chatapp-server-master/         # Node.js backend
│   ├── controllers/
│   │   ├── user.js                # Auth & user endpoints
│   │   ├── chat.js                # Chat & message logic
│   │   ├── status.js              # Status updates
│   │   └── admin.js               # Admin endpoints
│   ├── models/                    # Mongoose schemas
│   ├── middlewares/
│   │   ├── auth.js                # JWT middleware
│   │   ├── multer.js              # File upload middleware
│   │   └── error.js               # Error handler
│   ├── constants/
│   │   ├── config.js              # App config
│   │   └── events.js              # Socket event names
│   ├── lib/
│   │   ├── helper.js
│   │   └── validators.js
│   └── app.js                     # Express app entry point
│
└── vercel.json                    # Vercel deployment config
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (Atlas or local)
- Cloudinary account

---

### Backend Setup

```bash
cd chatapp-server-master
npm install
```

Create a `.env` file:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
ADMIN_SECRET_KEY=your_admin_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=3000
```

Start the server:

```bash
npm start
```

The backend will be running at `http://localhost:3000`.

---

### Frontend Setup

```bash
cd chatapp-frontend-master
npm install
```

Create a `.env` file:

```env
VITE_SERVER=http://localhost:3000
```

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 📜 Available Scripts

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests (Vitest) |

### Backend

| Command | Description |
|---|---|
| `npm start` | Start the server |

---

## ☁️ Deployment

### Frontend → Vercel

1. Push the `chatapp-frontend-master/` folder to GitHub
2. Import the repo into [Vercel](https://vercel.com)
3. Set the environment variable:
   ```
   VITE_SERVER=https://your-backend-url.onrender.com
   ```
4. Deploy

### Backend → Render

1. Push `chatapp-server-master/` to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set all `.env` variables in Render's environment settings
4. Set start command to `npm start`

---

## 🔌 Key Socket Events

| Event | Direction | Description |
|---|---|---|
| `NEW_MESSAGE` | Server → Client | New message received |
| `NEW_MESSAGE_ALERT` | Server → Client | Notification for new message |
| `REFETCH_CHATS` | Server → Client | Refresh chat list |
| `ONLINE_USERS` | Server → Client | List of online users |
| `START_TYPING` | Client → Server | User started typing |
| `STOP_TYPING` | Client → Server | User stopped typing |

---

## 🛡️ Admin Panel

Access the admin dashboard at `/admin`. Features include:

- View all users and their activity
- Monitor all chats and conversations
- Manage messages
- Analytics charts

---

## 📄 License

This project is open-source and available for personal and educational use.

---

## 🙌 Acknowledgements

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Socket.io](https://socket.io/) for real-time capabilities
- [Cloudinary](https://cloudinary.com/) for media management

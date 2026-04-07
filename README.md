# 💬 Real-Time Chat Application

A full-stack real-time chat application built with **React + Vite** (frontend) and **Node.js + Express + Socket.IO** (backend). Supports 1:1 messaging, group chats, file sharing, and an admin dashboard.

---

## 🚀 Live Demo

- **Frontend:** [https://chat-application-rho-mauve.vercel.app](https://chat-application-rho-mauve.vercel.app)
- **Backend:** [https://chat-application-production-aa42.up.railway.app](https://chat-application-production-aa42.up.railway.app)

---

## ✨ Features

- 🔐 JWT-based authentication with secure HTTP-only cookies
- 💬 Real-time messaging powered by Socket.IO
- 👥 Group chat creation and management
- 📁 File & media sharing via Cloudinary
- ✍️ Typing indicators
- 🟢 Online/offline user status
- 🔔 Friend requests & notifications
- 🛡️ Admin dashboard (user, chat & message management)
- 📱 Fully responsive UI with Material UI

---

## 🏗️ Project Structure

```
Chat-Application/
├── chatapp-frontend-master/     # React + Vite frontend
│   ├── src/
│   │   ├── components/          # UI components
│   │   ├── pages/               # Route pages
│   │   ├── redux/               # State management (RTK)
│   │   ├── constants/           # Config & colors
│   │   ├── hooks/               # Custom hooks
│   │   └── socket.jsx           # Socket.IO client
│   └── vercel.json              # Vercel SPA config
│
└── chatapp-server-master/       # Node.js backend
    ├── controllers/             # Route handlers
    ├── models/                  # Mongoose models
    ├── routes/                  # API routes
    ├── middlewares/             # Auth, error, multer
    ├── utils/                   # DB, JWT, Cloudinary
    └── app.js                   # Entry point
```

---

## ⚙️ Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/Chat-Application.git
cd Chat-Application
```

### 2. Setup Backend

```bash
cd chatapp-server-master
npm install
```

Create a `.env` file:

```env
PORT=3000
NODE_ENV=DEVELOPMENT
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chatapp
JWT_SECRET=your_jwt_secret
ADMIN_SECRET_KEY=your_admin_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLIENT_URL=http://localhost:5173
```

Run the server:

```bash
npm run dev
```

### 3. Setup Frontend

```bash
cd ../chatapp-frontend-master
npm install
```

Create a `.env` file:

```env
VITE_SERVER=http://localhost:3000
```

Run the frontend:

```bash
npm run dev
```

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/user/new` | Register new user |
| POST | `/api/v1/user/login` | Login |
| GET | `/api/v1/user/logout` | Logout |
| GET | `/api/v1/user/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/user/search` | Search users |
| PUT | `/api/v1/user/sendrequest` | Send friend request |
| PUT | `/api/v1/user/acceptrequest` | Accept friend request |
| GET | `/api/v1/user/notifications` | Get notifications |

### Chats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/chat/my` | Get my chats |
| POST | `/api/v1/chat/new` | Create group chat |
| GET | `/api/v1/chat/my/groups` | Get my groups |
| PUT | `/api/v1/chat/addmembers` | Add group members |
| DELETE | `/api/v1/chat/leave/:id` | Leave group |

---

## 🔌 Socket.IO Events

| Event | Description |
|-------|-------------|
| `NEW_MESSAGE` | Send/receive a new message |
| `NEW_MESSAGE_ALERT` | Notify about unread message |
| `START_TYPING` | User started typing |
| `STOP_TYPING` | User stopped typing |
| `CHAT_JOINED` | User joined a chat |
| `CHAT_LEAVED` | User left a chat |
| `ONLINE_USERS` | Broadcast online users list |

---

## ☁️ Deployment

### Frontend → Vercel
1. Push `chatapp-frontend-master` to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variable: `VITE_SERVER=https://your-railway-url.up.railway.app`
4. Deploy

### Backend → Railway
1. Push `chatapp-server-master` to GitHub
2. Import in [railway.app](https://railway.app)
3. Set root directory to `chatapp-server-master`
4. Add all environment variables
5. Deploy

### Deployment Troubleshooting
- If you see `Uncaught SyntaxError: Unexpected token '<'` on Vercel, ensure frontend deploys from `chatapp-frontend-master` (this folder already includes `vercel.json` SPA fallback).
- Set frontend env `VITE_SERVER` to your Railway backend URL, e.g. `https://chat-application-production-aa42.up.railway.app` (trailing slash is automatically trimmed by frontend config).
- For backend CORS/socket access, set `CLIENT_URL` (or `CLIENT_URLS` as comma-separated origins) to include your frontend domain, e.g. `CLIENT_URL=https://chat-application-rho-mauve.vercel.app`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Material UI, Redux Toolkit |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Real-time | Socket.IO |
| Auth | JWT + HTTP-only cookies |
| File Storage | Cloudinary |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## 👤 Admin Access

Visit `/admin` on the frontend and use your `ADMIN_SECRET_KEY` to access the admin dashboard.

---

## 📝 License

MIT

# Chat Application

A full-stack real-time chat application with a modern TypeScript + React frontend and a Node.js backend.

## Tech Stack

### Frontend (`chatapp-frontend/`)
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Socket.io-client (real-time)
- Axios (API calls)
- Framer Motion (animations)
- React Router v6

### Backend (`chatapp-server/`)
- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- JWT Authentication
- Cloudinary (file uploads)

## Getting Started

### Backend
```bash
cd chatapp-server
npm install
# Create .env file (see below)
npm start
```

**Server `.env`:**
```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
ADMIN_SECRET_KEY=your_admin_key
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
CLIENT_URL=http://localhost:5173
NODE_ENV=development
PORT=3000
```

### Frontend
```bash
cd chatapp-frontend
npm install
# Create .env file
echo "VITE_SERVER=http://localhost:3000" > .env
npm run dev
```

## Deployment

- **Frontend**: Deploy `chatapp-frontend` to Vercel
- **Backend**: Deploy `chatapp-server` to Render

Set `VITE_SERVER` to your deployed backend URL on Vercel.

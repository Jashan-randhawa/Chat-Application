📱💬 Real-Time Chat Application

A 1:1 real-time chat app built with React Native (frontend) and Node.js (Express + Socket.IO) backend.
Messages are stored in a MongoDB database, and authentication is JWT-based.

🚀 Features (MVP)

🔐 Authentication: Register & Login with JWT

👥 User List: Show all users, tap to start chat

💬 Real-Time Messaging: Powered by Socket.IO

🗂 Persistent Messages: Stored in MongoDB

✍️ Typing Indicator: See when the other user is typing

🟢 Online/Offline Status: Track active users

✅ Message Delivery & Read Receipts

📱 Mobile UI:

Auth screens

Home (user list + last message)

Chat screen (scrollable messages, input, typing, ticks)

🏗 Project Structure
Chat-Application/
│── mobile/             # React Native app
│   ├── src/
│   │   ├── screens/    # Auth, Home, Chat
│   │   ├── components/
│   │   ├── services/   # API & socket services
│   │   └── store/      # State management
│
│── server/             # Node.js backend
│   ├── src/
│   │   ├── models/     # User, Message
│   │   ├── routes/     # auth, users, messages
│   │   ├── controllers/
│   │   ├── sockets/
│   │   └── app.js
│   └── .env
│
└── README.md

⚙️ Setup
1. Clone the repo
git clone https://github.com/YOUR_USERNAME/Chat-Application.git
cd Chat-Application

2. Setup backend
cd server
npm install


Create a .env file:

PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=supersecret


Run the server:

npm run dev

3. Setup mobile
cd ../mobile
npm install
npm start

🌐 REST API Endpoints
Auth

POST /auth/register → Register new user

POST /auth/login → Login & get JWT

Users

GET /users → Get all users (except self)

Conversations

GET /conversations/:id/messages → Get chat history with user id

🔌 Socket.IO Events
Event	Payload	Description
message:send	{receiverId, text}	Send new message
message:new	message	Receive new message
typing:start	{to}	Notify typing started
typing:stop	{to}	Notify typing stopped
message:read	{messageId}	Mark message as read
user:online	{userId}	Mark user online
disconnect	–	Mark user offline
👥 Sample Users

Register via POST /auth/register or use dummy users:

[
  { "username": "alice", "password": "123456" },
  { "username": "bob", "password": "123456" }
]

📝 Deliverables

/mobile → React Native frontend

/server → Node.js backend with Express + Socket.IO

README.md → setup, env vars, sample users

💡 Future Improvements:

Push notifications

Group chats

Profile pictures & media sharing

Deployment on cloud (Heroku/Render + Expo EAS)

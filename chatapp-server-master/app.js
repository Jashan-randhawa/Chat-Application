import express from "express";
import { connectDB } from "./utils/features.js";
import dotenv from "dotenv";
import { errorMiddleware } from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import {
  CALL_ANSWER,
  CALL_ENDED,
  CALL_OFFER,
  CHAT_JOINED,
  CHAT_LEAVED,
  ICE_CANDIDATE,
  MESSAGE_DELIVERED,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  ONLINE_USERS,
  START_TYPING,
  STOP_TYPING,
} from "./constants/events.js";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";
import { Chat } from "./models/chat.js";
import { corsOptions } from "./constants/config.js";
import { socketAuthenticator } from "./middlewares/auth.js";

import userRoute from "./routes/user.js";
import chatRoute from "./routes/chat.js";
import adminRoute from "./routes/admin.js";
import { createUser } from "./seeders/user.js";

dotenv.config({
  path: "./.env",
});

const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3000;
const envMode = process.env.NODE_ENV.trim() || "PRODUCTION";
const adminSecretKey = process.env.ADMIN_SECRET_KEY || "adsasdsdfsdfsdfd";
const userSocketIDs = new Map();
const onlineUsers = new Set();
const typingRateLimiter = new Map();
const typingAutoStopTimeouts = new Map();

connectDB(mongoURI);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

// Using Middlewares Here
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);

app.get("/", (req, res) => {
  res.send("Hello World");
});

io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticator(err, socket, next)
  );
});

io.on("connection", (socket) => {
  const user = socket.user;
  userSocketIDs.set(user._id.toString(), socket.id);

  socket.on(NEW_MESSAGE, async ({ chatId, message }) => {
    try {
      if (!chatId || !message?.trim()) return;

      const chat = await Chat.findById(chatId).select("members");
      if (!chat) return;

      const isMember = chat.members.some(
        (member) => member.toString() === user._id.toString()
      );
      if (!isMember) return;

      const recipients = chat.members.filter(
        (member) => member.toString() !== user._id.toString()
      );
      const onlineRecipients = recipients.filter((member) =>
        userSocketIDs.has(member.toString())
      );

      const messageForDB = await Message.create({
        content: message,
        sender: user._id,
        chat: chatId,
        deliveredTo: onlineRecipients,
      });

      const messageForRealTime = {
        content: message,
        _id: messageForDB._id,
        sender: {
          _id: user._id,
          name: user.name,
        },
        chat: chatId,
        createdAt: messageForDB.createdAt,
        deliveredTo: onlineRecipients,
        readBy: [],
      };

      const membersSocket = getSockets(chat.members);
      io.to(membersSocket).emit(NEW_MESSAGE, {
        chatId,
        message: messageForRealTime,
      });
      io.to(membersSocket).emit(NEW_MESSAGE_ALERT, { chatId });

      const senderSocket = userSocketIDs.get(user._id.toString());
      if (senderSocket && onlineRecipients.length) {
        io.to(senderSocket).emit(MESSAGE_DELIVERED, {
          chatId,
          messageId: messageForDB._id,
          deliveredTo: onlineRecipients,
        });
      }
    } catch (error) {
      console.error("NEW_MESSAGE socket error:", error);
    }
  });

  socket.on(START_TYPING, ({ chatId }) => {
    const handleStartTyping = async () => {
      if (!chatId) return;

      const chat = await Chat.findById(chatId).select("members");
      if (!chat) return;

      const isMember = chat.members.some(
        (member) => member.toString() === user._id.toString()
      );
      if (!isMember) return;

      const socketLimiterKey = `${socket.id}:${chatId}`;
      const lastEventAt = typingRateLimiter.get(socketLimiterKey) || 0;
      const now = Date.now();

      if (now - lastEventAt < 500) return;

      typingRateLimiter.set(socketLimiterKey, now);

      const membersSockets = getSockets(chat.members);
      socket.to(membersSockets).emit(START_TYPING, { chatId });

      const timeoutKey = `${user._id.toString()}:${chatId}`;
      const existingTimeout = typingAutoStopTimeouts.get(timeoutKey);
      if (existingTimeout) clearTimeout(existingTimeout);

      const timeoutId = setTimeout(() => {
        socket.to(membersSockets).emit(STOP_TYPING, { chatId });
        typingAutoStopTimeouts.delete(timeoutKey);
      }, 5000);

      typingAutoStopTimeouts.set(timeoutKey, timeoutId);
    };

    handleStartTyping().catch((error) =>
      console.error("START_TYPING socket error:", error)
    );
  });

  socket.on(STOP_TYPING, ({ chatId }) => {
    const handleStopTyping = async () => {
      if (!chatId) return;

      const chat = await Chat.findById(chatId).select("members");
      if (!chat) return;

      const isMember = chat.members.some(
        (member) => member.toString() === user._id.toString()
      );
      if (!isMember) return;

      const timeoutKey = `${user._id.toString()}:${chatId}`;
      const existingTimeout = typingAutoStopTimeouts.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        typingAutoStopTimeouts.delete(timeoutKey);
      }

      const membersSockets = getSockets(chat.members);
      socket.to(membersSockets).emit(STOP_TYPING, { chatId });
    };

    handleStopTyping().catch((error) =>
      console.error("STOP_TYPING socket error:", error)
    );
  });

  socket.on(CHAT_JOINED, ({ userId, members }) => {
    onlineUsers.add(userId.toString());

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on(CHAT_LEAVED, ({ userId, members }) => {
    onlineUsers.delete(userId.toString());

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on(CALL_OFFER, async ({ chatId, offer }) => {
    try {
      if (!chatId || !offer) return;
      const chat = await Chat.findById(chatId).select("members");
      if (!chat) return;

      const isMember = chat.members.some(
        (member) => member.toString() === user._id.toString()
      );
      if (!isMember) return;

      const recipientSockets = getSockets(
        chat.members.filter((member) => member.toString() !== user._id.toString())
      );

      socket.to(recipientSockets).emit(CALL_OFFER, {
        chatId,
        offer,
        from: { _id: user._id, name: user.name },
      });
    } catch (error) {
      console.error("CALL_OFFER socket error:", error);
    }
  });

  socket.on(CALL_ANSWER, async ({ chatId, answer, toUserId }) => {
    try {
      if (!chatId || !answer || !toUserId) return;
      const chat = await Chat.findById(chatId).select("members");
      if (!chat) return;

      const isMember = chat.members.some(
        (member) => member.toString() === user._id.toString()
      );
      if (!isMember) return;

      const targetSocketId = userSocketIDs.get(toUserId.toString());
      if (!targetSocketId) return;

      socket.to(targetSocketId).emit(CALL_ANSWER, {
        chatId,
        answer,
        fromUserId: user._id,
      });
    } catch (error) {
      console.error("CALL_ANSWER socket error:", error);
    }
  });

  socket.on(ICE_CANDIDATE, async ({ chatId, candidate, toUserId }) => {
    try {
      if (!chatId || !candidate || !toUserId) return;
      const chat = await Chat.findById(chatId).select("members");
      if (!chat) return;

      const isMember = chat.members.some(
        (member) => member.toString() === user._id.toString()
      );
      if (!isMember) return;

      const targetSocketId = userSocketIDs.get(toUserId.toString());
      if (!targetSocketId) return;

      socket.to(targetSocketId).emit(ICE_CANDIDATE, {
        chatId,
        candidate,
        fromUserId: user._id,
      });
    } catch (error) {
      console.error("ICE_CANDIDATE socket error:", error);
    }
  });

  socket.on(CALL_ENDED, async ({ chatId }) => {
    try {
      if (!chatId) return;
      const chat = await Chat.findById(chatId).select("members");
      if (!chat) return;

      const isMember = chat.members.some(
        (member) => member.toString() === user._id.toString()
      );
      if (!isMember) return;

      const recipientSockets = getSockets(
        chat.members.filter((member) => member.toString() !== user._id.toString())
      );

      socket.to(recipientSockets).emit(CALL_ENDED, {
        chatId,
        fromUserId: user._id,
      });
    } catch (error) {
      console.error("CALL_ENDED socket error:", error);
    }
  });

  socket.on("disconnect", () => {
    userSocketIDs.delete(user._id.toString());
    onlineUsers.delete(user._id.toString());
    for (const key of typingRateLimiter.keys()) {
      if (key.startsWith(`${socket.id}:`)) typingRateLimiter.delete(key);
    }
    for (const key of typingAutoStopTimeouts.keys()) {
      if (key.startsWith(`${user._id.toString()}:`)) {
        clearTimeout(typingAutoStopTimeouts.get(key));
        typingAutoStopTimeouts.delete(key);
      }
    }
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
  });
});

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`Server is running on port ${port} in ${envMode} Mode`);
});

export { envMode, adminSecretKey, userSocketIDs };

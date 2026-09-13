import jwt from "jsonwebtoken";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Message } from "../models/message.js";
import { User } from "../models/user.js";
import { Request } from "../models/request.js";
import { Status } from "../models/status.js";
import { ErrorHandler } from "../utils/utility.js";
import { cookieOptions, deletFilesFromCloudinary } from "../utils/features.js";
import { adminSecretKey, onlineUsers } from "../app.js";

const adminLogin = TryCatch(async (req, res, next) => {
  const { secretKey } = req.body;

  const isMatched = secretKey === adminSecretKey;

  if (!isMatched) return next(new ErrorHandler("Invalid Admin Key", 401));

  const token = jwt.sign({ secretKey }, process.env.JWT_SECRET, {
    expiresIn: "15m",
    algorithm: "HS256",
  });

  return res
    .status(200)
    .cookie("chattu-admin-token", token, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 15,
    })
    .json({
      success: true,
      token, // send token in body for cross-site clients
      message: "Authenticated Successfully, Welcome BOSS",
    });
});

const adminLogout = TryCatch(async (req, res, next) => {
  return res
    .status(200)
    .cookie("chattu-admin-token", "", {
      ...cookieOptions,
      maxAge: 0,
    })
    .json({
      success: true,
      message: "Logged Out Successfully",
    });
});

const getAdminData = TryCatch(async (req, res, next) => {
  return res.status(200).json({
    admin: true,
  });
});

const allUsers = TryCatch(async (req, res) => {
  const users = await User.find({}).sort({ createdAt: -1 });

  const transformedUsers = await Promise.all(
    users.map(async ({ name, username, avatar, bio, createdAt, _id }) => {
      const [groups, friends, messagesCount] = await Promise.all([
        Chat.countDocuments({ groupChat: true, members: _id }),
        Chat.countDocuments({ groupChat: false, members: _id }),
        Message.countDocuments({ sender: _id }),
      ]);

      const isOnline = onlineUsers ? onlineUsers.has(_id.toString()) : false;

      return {
        _id,
        name,
        username,
        bio: bio || "",
        avatar: avatar?.url || "",
        groups,
        friends,
        messagesCount,
        isOnline,
        createdAt,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    users: transformedUsers,
  });
});

const allChats = TryCatch(async (req, res) => {
  const chats = await Chat.find({})
    .sort({ updatedAt: -1, createdAt: -1 })
    .populate("members", "name username avatar")
    .populate("creator", "name username avatar");

  const transformedChats = await Promise.all(
    chats.map(async ({ members, _id, groupChat, name, creator, createdAt, updatedAt }) => {
      const totalMessages = await Message.countDocuments({ chat: _id });
      const safeMembers = Array.isArray(members) ? members : [];

      return {
        _id,
        groupChat,
        name: name || "Unnamed Group",
        avatar: safeMembers
          .slice(0, 3)
          .map((member) => member?.avatar?.url)
          .filter(Boolean),
        members: safeMembers.map(({ _id, name, username, avatar }) => ({
          _id,
          name,
          username: username || "",
          avatar: avatar?.url || "",
        })),
        creator: {
          name: creator?.name || "None",
          avatar: creator?.avatar?.url || "",
        },
        totalMembers: safeMembers.length,
        totalMessages,
        createdAt,
        updatedAt,
      };
    })
  );

  return res.status(200).json({
    status: "success",
    chats: transformedChats,
  });
});

const allMessages = TryCatch(async (req, res) => {
  const messages = await Message.find({})
    .sort({ createdAt: -1 })
    .populate("sender", "name username avatar")
    .populate("chat", "groupChat name");

  const transformedMessages = messages.map(
    ({ content, attachments, _id, sender, createdAt, chat }) => ({
      _id,
      attachments: attachments || [],
      content: content || "",
      createdAt,
      chat: chat?._id || "",
      chatName: chat?.name || "",
      groupChat: chat?.groupChat ?? false,
      sender: {
        _id: sender?._id || "",
        name: sender?.name || "Deleted User",
        username: sender?.username || "",
        avatar: sender?.avatar?.url || "",
      },
    })
  );

  return res.status(200).json({
    success: true,
    messages: transformedMessages,
  });
});

const getDashboardStats = TryCatch(async (req, res) => {
  const [
    groupsCount,
    usersCount,
    messagesCount,
    totalChatsCount,
    totalRequestsCount,
    pendingRequestsCount,
    activeStatusesCount,
    messagesWithMediaCount,
  ] = await Promise.all([
    Chat.countDocuments({ groupChat: true }),
    User.countDocuments(),
    Message.countDocuments(),
    Chat.countDocuments(),
    Request.countDocuments(),
    Request.countDocuments({ status: "pending" }),
    Status.countDocuments({ expiresAt: { $gt: new Date() } }),
    Message.countDocuments({ attachments: { $exists: true, $ne: [] } }),
  ]);

  const onlineUsersCount = onlineUsers ? onlineUsers.size : 0;

  const today = new Date();
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);

  const [last7DaysMessages, last7DaysUsers] = await Promise.all([
    Message.find({
      createdAt: { $gte: last7Days, $lte: today },
    }).select("createdAt"),
    User.find({
      createdAt: { $gte: last7Days, $lte: today },
    }).select("createdAt"),
  ]);

  const messagesChart = new Array(7).fill(0);
  const usersChart = new Array(7).fill(0);
  const dayInMs = 1000 * 60 * 60 * 24;

  last7DaysMessages.forEach((msg) => {
    const diffDays = Math.floor((today.getTime() - msg.createdAt.getTime()) / dayInMs);
    if (diffDays >= 0 && diffDays < 7) {
      messagesChart[6 - diffDays]++;
    }
  });

  last7DaysUsers.forEach((usr) => {
    const diffDays = Math.floor((today.getTime() - usr.createdAt.getTime()) / dayInMs);
    if (diffDays >= 0 && diffDays < 7) {
      usersChart[6 - diffDays]++;
    }
  });

  const stats = {
    groupsCount,
    usersCount,
    messagesCount,
    totalChatsCount,
    directChatsCount: totalChatsCount - groupsCount,
    onlineUsersCount,
    totalRequestsCount,
    pendingRequestsCount,
    activeStatusesCount,
    messagesWithMediaCount,
    messagesChart,
    usersChart,
    serverUptime: Math.floor(process.uptime()),
    nodeVersion: process.version,
    memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  };

  return res.status(200).json({
    success: true,
    stats,
  });
});

const deleteUserByAdmin = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  // Find user's chats
  const chats = await Chat.find({ members: id });

  for (const chat of chats) {
    if (chat.groupChat && chat.creator.toString() === id.toString()) {
      // If user is group creator, assign new creator or delete if no members
      const remaining = chat.members.filter((m) => m.toString() !== id.toString());
      if (remaining.length < 2) {
        await chat.deleteOne();
        await Message.deleteMany({ chat: chat._id });
      } else {
        chat.creator = remaining[0];
        chat.members = remaining;
        await chat.save();
      }
    } else {
      chat.members = chat.members.filter((m) => m.toString() !== id.toString());
      await chat.save();
    }
  }

  // Delete requests and statuses
  await Promise.all([
    Request.deleteMany({ $or: [{ sender: id }, { receiver: id }] }),
    Status.deleteMany({ user: id }),
    user.deleteOne(),
  ]);

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

const deleteMessageByAdmin = TryCatch(async (req, res, next) => {
  const { id } = req.params;

  const message = await Message.findById(id);
  if (!message) return next(new ErrorHandler("Message not found", 404));

  if (message.attachments && message.attachments.length > 0) {
    const public_ids = message.attachments.map((a) => a.public_id).filter(Boolean);
    if (public_ids.length > 0) {
      await deletFilesFromCloudinary(public_ids);
    }
  }

  await message.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Message deleted by Admin",
  });
});

export {
  allUsers,
  allChats,
  allMessages,
  getDashboardStats,
  deleteUserByAdmin,
  deleteMessageByAdmin,
  adminLogin,
  adminLogout,
  getAdminData,
};

import { compare } from "bcrypt";
import mongoose from "mongoose";
import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Request } from "../models/request.js";
import { User } from "../models/user.js";
import {
  cookieOptions,
  emitEvent,
  sendToken,
  uploadFilesToCloudinary,
} from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";

// Create a new user and save it to the database and save token in cookie
const newUser = TryCatch(async (req, res, next) => {
  const { name, username, password, bio } = req.body;

  const file = req.file;

  if (!file) return next(new ErrorHandler("Please Upload Avatar"));

  const result = await uploadFilesToCloudinary([file]);

  const avatar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };

  const user = await User.create({
    name,
    bio,
    username,
    password,
    avatar,
  });

  sendToken(res, user, 201, "User created");
});

// Login user and save token in cookie
const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select("+password");

  if (!user) return next(new ErrorHandler("Invalid Username or Password", 404));

  const isMatch = await compare(password, user.password);

  if (!isMatch)
    return next(new ErrorHandler("Invalid Username or Password", 404));

  sendToken(res, user, 200, `Welcome Back, ${user.name}`);
});

const getMyProfile = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.user);

  if (!user) return next(new ErrorHandler("User not found", 404));

  res.status(200).json({
    success: true,
    user,
  });
});

const logout = TryCatch(async (req, res) => {
  return res
    .status(200)
    .cookie("chattu-token", "", { ...cookieOptions, maxAge: 0 })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

const searchUser = TryCatch(async (req, res) => {
  const { name = "" } = req.query;

  // Finding all my direct chats (friends)
  const myChats = await Chat.find({ groupChat: false, members: req.user });
  const friendIds = myChats.flatMap((chat) =>
    chat.members.map((m) => m.toString()).filter((id) => id !== req.user.toString())
  );

  // Finding all users matching name or username (excluding self)
  const allUsers = await User.find({
    _id: { $ne: req.user },
    $or: [
      { name: { $regex: name, $options: "i" } },
      { username: { $regex: name, $options: "i" } },
    ],
  }).select("name username avatar");

  // Fetch pending requests involving current user and these candidates
  const userIds = allUsers.map((u) => u._id);
  const pendingRequests = await Request.find({
    $or: [
      { sender: req.user, receiver: { $in: userIds } },
      { sender: { $in: userIds }, receiver: req.user },
    ],
  });

  const requestMap = new Map();
  for (const r of pendingRequests) {
    if (r.sender.toString() === req.user.toString()) {
      requestMap.set(r.receiver.toString(), { status: "sent", requestId: r._id });
    } else {
      requestMap.set(r.sender.toString(), { status: "received", requestId: r._id });
    }
  }

  const users = allUsers.map((u) => {
    const uIdStr = u._id.toString();
    const isFriend = friendIds.includes(uIdStr);
    const reqInfo = requestMap.get(uIdStr);

    let relationshipStatus = "none";
    if (isFriend) relationshipStatus = "friends";
    else if (reqInfo?.status === "sent") relationshipStatus = "sent";
    else if (reqInfo?.status === "received") relationshipStatus = "received";

    return {
      _id: u._id,
      name: u.name,
      username: u.username || "",
      avatar: u.avatar?.url || "",
      relationshipStatus,
      requestId: reqInfo?.requestId || null,
    };
  });

  return res.status(200).json({
    success: true,
    users,
  });
});

const sendFriendRequest = TryCatch(async (req, res, next) => {
  const { userId } = req.body;

  if (userId.toString() === req.user.toString()) {
    return next(new ErrorHandler("Cannot send request to yourself", 400));
  }

  const isAlreadyFriend = await Chat.findOne({
    groupChat: false,
    members: { $all: [req.user, userId] },
  });
  if (isAlreadyFriend) {
    return next(new ErrorHandler("You are already friends", 400));
  }

  const request = await Request.findOne({
    $or: [
      { sender: req.user, receiver: userId },
      { sender: userId, receiver: req.user },
    ],
  });

  if (request) return next(new ErrorHandler("Request already sent", 400));

  await Request.create({
    sender: req.user,
    receiver: userId,
  });

  emitEvent(req, NEW_REQUEST, [userId]);

  return res.status(200).json({
    success: true,
    message: "Friend Request Sent",
  });
});

const acceptFriendRequest = TryCatch(async (req, res, next) => {
  const { requestId, accept } = req.body;

  const request = await Request.findById(requestId)
    .populate("sender", "name")
    .populate("receiver", "name");

  if (!request) return next(new ErrorHandler("Request not found", 404));

  if (request.receiver._id.toString() !== req.user.toString())
    return next(
      new ErrorHandler("You are not authorized to accept this request", 401)
    );

  if (!accept) {
    await request.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Friend Request Rejected",
    });
  }

  const members = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chat.create({
      members,
      name: `${request.sender.name}-${request.receiver.name}`,
    }),
    request.deleteOne(),
  ]);

  emitEvent(req, REFETCH_CHATS, members);

  return res.status(200).json({
    success: true,
    message: "Friend Request Accepted",
    senderId: request.sender._id,
  });
});

const getMyNotifications = TryCatch(async (req, res) => {
  const requests = await Request.find({ receiver: req.user })
    .populate("sender", "name username avatar")
    .sort({ createdAt: -1 });

  const allRequests = requests.map(({ _id, sender, createdAt }) => ({
    _id,
    sender: {
      _id: sender._id,
      name: sender.name,
      username: sender.username || "",
      avatar: sender.avatar?.url || "",
    },
    createdAt,
  }));

  return res.status(200).json({
    success: true,
    allRequests,
  });
});

const getMyFriends = TryCatch(async (req, res, next) => {
  const chatId = req.query.chatId;

  const chats = await Chat.find({
    members: req.user,
    groupChat: false,
  }).populate("members", "name username avatar");

  const friends = chats.map(({ members }) => {
    const otherUser = getOtherMember(members, req.user);
    if (!otherUser) return null;

    return {
      _id: otherUser._id,
      name: otherUser.name,
      username: otherUser.username || "",
      avatar: otherUser.avatar?.url || "",
    };
  }).filter(Boolean);

  if (chatId) {
    if (!mongoose.isValidObjectId(chatId))
      return next(new ErrorHandler("Invalid Chat ID", 400));

    const chat = await Chat.findById(chatId);
    if (!chat) return next(new ErrorHandler("Chat not found", 404));

    const availableFriends = friends.filter(
      (friend) =>
        !chat.members.some((member) => member.toString() === friend._id.toString())
    );

    return res.status(200).json({
      success: true,
      friends: availableFriends,
    });
  } else {
    return res.status(200).json({
      success: true,
      friends,
    });
  }
});

const updateProfile = TryCatch(async (req, res, next) => {
  const { name, bio } = req.body;
  const file = req.file;

  const user = await User.findById(req.user);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (name && typeof name === "string" && name.trim()) {
    user.name = name.trim();
  }

  if (typeof bio === "string") {
    user.bio = bio.trim();
  }

  if (file) {
    const result = await uploadFilesToCloudinary([file]);
    // Delete old avatar from Cloudinary if exists
    if (user.avatar?.public_id) {
      await deletFilesFromCloudinary([user.avatar.public_id]);
    }
    user.avatar = {
      public_id: result[0].public_id,
      url: result[0].url,
    };
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user,
  });
});

export {
  acceptFriendRequest,
  getMyFriends,
  getMyNotifications,
  getMyProfile,
  login,
  logout,
  newUser,
  searchUser,
  sendFriendRequest,
  updateProfile,
};

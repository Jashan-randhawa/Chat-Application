import { TryCatch } from "../middlewares/error.js";
import { Status } from "../models/status.js";
import { Chat } from "../models/chat.js";
import { User } from "../models/user.js";
import { uploadFilesToCloudinary } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import { STATUS_UPDATED } from "../constants/events.js";
import { emitEvent } from "../utils/features.js";

// POST /api/v1/status  — add a new slide to today's status (or create one)
const addStatus = TryCatch(async (req, res, next) => {
  const { type, content, background } = req.body;

  if (!type || !["text", "image"].includes(type)) {
    return next(new ErrorHandler("Invalid status type", 400));
  }

  // Build slide
  const slide = {
    type,
    content: content || "",
    background: background || "#075e54",
    viewers: [],
    createdAt: new Date(),
  };

  // Handle image upload
  if (type === "image") {
    if (!req.file) return next(new ErrorHandler("Image file required", 400));
    const results = await uploadFilesToCloudinary([req.file]);
    slide.media = {
      public_id: results[0].public_id,
      url: results[0].url,
    };
  }

  // Find or create today's status doc for this user
  const now = new Date();
  let statusDoc = await Status.findOne({
    user: req.user,
    expiresAt: { $gt: now },
  });

  if (statusDoc) {
    statusDoc.slides.push(slide);
    // Extend expiry to 24h from latest slide
    statusDoc.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await statusDoc.save();
  } else {
    statusDoc = await Status.create({
      user: req.user,
      slides: [slide],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }

  // Notify friends via socket
  const friendChats = await Chat.find({
    members: req.user,
    groupChat: false,
  }).select("members");

  const friendIds = friendChats.flatMap((c) =>
    c.members.map((m) => m.toString()).filter((id) => id !== req.user.toString())
  );
  const uniqueFriends = [...new Set(friendIds)];

  emitEvent(req, STATUS_UPDATED, uniqueFriends, {
    userId: req.user.toString(),
  });

  return res.status(201).json({
    success: true,
    message: "Status updated",
    statusId: statusDoc._id,
  });
});

// GET /api/v1/status  — get statuses from friends (+ my own)
const getFriendsStatuses = TryCatch(async (req, res) => {
  const now = new Date();

  // Get all friends (people I have a 1-1 chat with)
  const friendChats = await Chat.find({
    members: req.user,
    groupChat: false,
  }).select("members");

  const friendIds = friendChats.flatMap((c) =>
    c.members.map((m) => m.toString()).filter((id) => id !== req.user.toString())
  );
  const uniqueFriendIds = [...new Set(friendIds)];

  // Include own user too
  const allUserIds = [req.user.toString(), ...uniqueFriendIds];

  const statuses = await Status.find({
    user: { $in: allUserIds },
    expiresAt: { $gt: now },
  })
    .populate("user", "name avatar")
    .sort({ updatedAt: -1 });

  // Format response — mark which slides current user has seen
  const formatted = statuses.map((s) => ({
    _id: s._id,
    user: {
      _id: s.user._id,
      name: s.user.name,
      avatar: s.user.avatar?.url,
    },
    slides: s.slides.map((slide) => ({
      _id: slide._id,
      type: slide.type,
      content: slide.content,
      media: slide.media,
      background: slide.background,
      createdAt: slide.createdAt,
      viewerCount: slide.viewers.length,
      viewedByMe: slide.viewers.some(
        (v) => v.user.toString() === req.user.toString()
      ),
      // Only show viewer list for own status
      viewers:
        s.user._id.toString() === req.user.toString()
          ? slide.viewers
          : undefined,
    })),
    expiresAt: s.expiresAt,
    isOwn: s.user._id.toString() === req.user.toString(),
  }));

  return res.status(200).json({ success: true, statuses: formatted });
});

// PUT /api/v1/status/:statusId/view/:slideId — mark a slide as viewed
const markSlideViewed = TryCatch(async (req, res, next) => {
  const { statusId, slideId } = req.params;

  const statusDoc = await Status.findById(statusId);
  if (!statusDoc) return next(new ErrorHandler("Status not found", 404));

  // Don't record self-views
  if (statusDoc.user.toString() === req.user.toString()) {
    return res.status(200).json({ success: true });
  }

  const slide = statusDoc.slides.id(slideId);
  if (!slide) return next(new ErrorHandler("Slide not found", 404));

  const alreadyViewed = slide.viewers.some(
    (v) => v.user.toString() === req.user.toString()
  );

  if (!alreadyViewed) {
    slide.viewers.push({ user: req.user, viewedAt: new Date() });
    await statusDoc.save();
  }

  return res.status(200).json({ success: true });
});

// DELETE /api/v1/status/:statusId/slide/:slideId — delete one slide
const deleteSlide = TryCatch(async (req, res, next) => {
  const { statusId, slideId } = req.params;

  const statusDoc = await Status.findOne({ _id: statusId, user: req.user });
  if (!statusDoc)
    return next(new ErrorHandler("Status not found or unauthorized", 404));

  statusDoc.slides = statusDoc.slides.filter(
    (s) => s._id.toString() !== slideId
  );

  if (statusDoc.slides.length === 0) {
    await statusDoc.deleteOne();
  } else {
    await statusDoc.save();
  }

  return res.status(200).json({ success: true, message: "Slide deleted" });
});

export { addStatus, getFriendsStatuses, markSlideViewed, deleteSlide };

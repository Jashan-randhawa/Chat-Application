import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import { singleAvatar } from "../middlewares/multer.js";
import {
  addStatus,
  getFriendsStatuses,
  markSlideViewed,
  deleteSlide,
} from "../controllers/status.js";

const router = express.Router();

router.use(isAuthenticated);

// Get all friends' statuses (+ own)
router.get("/", getFriendsStatuses);

// Post a new status slide (text or image)
router.post("/", singleAvatar, addStatus);

// Mark a slide as viewed
router.put("/:statusId/view/:slideId", markSlideViewed);

// Delete a slide
router.delete("/:statusId/slide/:slideId", deleteSlide);

export default router;

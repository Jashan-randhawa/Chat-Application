import multer from "multer";
import { ErrorHandler } from "../utils/utility.js";

const MAX_FILE_SIZE = 1024 * 1024 * 5; // 5MB

// Avatars (registration) and status images are always meant to be images —
// the frontend already restricts its file picker to accept="image/*" for
// both, so the backend should enforce the same thing rather than trust the
// client.
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) return cb(null, true);
  cb(new ErrorHandler(`Only image files are allowed (got ${file.mimetype})`, 400));
};

// Chat attachments intentionally support more than images — the frontend's
// picker (ChatInput.tsx) accepts image/*, video/*, audio/*, .pdf, .doc,
// .docx, .zip, and .txt — so the allowlist here mirrors that instead of
// narrowing it down to images only, which would break real functionality.
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
]);

const attachmentFileFilter = (req, file, cb) => {
  const { mimetype } = file;
  const isMedia =
    mimetype.startsWith("image/") ||
    mimetype.startsWith("video/") ||
    mimetype.startsWith("audio/");

  if (isMedia || ALLOWED_ATTACHMENT_MIME_TYPES.has(mimetype)) return cb(null, true);

  cb(new ErrorHandler(`File type not allowed (got ${mimetype})`, 400));
};

const avatarUpload = multer({
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFileFilter,
});

const attachmentsUpload = multer({
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: attachmentFileFilter,
});

const singleAvatar = avatarUpload.single("avatar");

const attachmentsMulter = attachmentsUpload.array("files", 5);

export { singleAvatar, attachmentsMulter };

import mongoose, { Schema, model } from "mongoose";

const statusSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Each status can have multiple slides (like WhatsApp)
    slides: [
      {
        type: {
          type: String,
          enum: ["text", "image"],
          required: true,
        },
        content: {
          // For text: the text string. For image: caption text (optional)
          type: String,
          default: "",
        },
        media: {
          // For image slides
          public_id: String,
          url: String,
        },
        background: {
          // For text slides (hex color or gradient)
          type: String,
          default: "#075e54",
        },
        viewers: [
          {
            user: { type: Schema.Types.ObjectId, ref: "User" },
            viewedAt: { type: Date, default: Date.now },
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  },
  { timestamps: true }
);

// Auto-expire documents after 24 hours
statusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Status = mongoose.models.Status || model("Status", statusSchema);

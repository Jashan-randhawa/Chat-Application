// ============================================================
// REDESIGNED MessageComponent — WhatsApp-style chat bubbles
// Changes: sent/received color split, tail decoration,
//          sender name color, smooth entry animation,
//          improved timestamp, attachment styling
// ============================================================

import { Box, Typography } from "@mui/material";
import React, { memo } from "react";
import { lightBlue } from "../../constants/color";
import moment from "moment";
import { fileFormat } from "../../lib/features";
import RenderAttachment from "./RenderAttachment";
import { motion } from "framer-motion";

const MessageComponent = ({ message, user }) => {
  const { sender, content, attachments = [], createdAt } = message;

  const sameSender = sender?._id === user?._id;
  const timeAgo = moment(createdAt).fromNow();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        alignSelf: sameSender ? "flex-end" : "flex-start",
        maxWidth: "72%",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
      }}
    >
      {/* Sender name — group chat only */}
      {!sameSender && sender?.name !== "Admin" && (
        <Typography
          sx={{
            color: lightBlue,
            fontWeight: 700,
            fontSize: "0.72rem",
            letterSpacing: "0.01em",
            ml: 1.5,
          }}
        >
          {sender.name}
        </Typography>
      )}

      {/* Bubble */}
      <Box
        sx={{
          backgroundColor: sameSender ? "#0ea5e9" : "#ffffff",
          color: sameSender ? "#ffffff" : "#1e293b",
          borderRadius: sameSender
            ? "18px 18px 4px 18px"
            : "18px 18px 18px 4px",
          padding: "0.6rem 0.9rem",
          boxShadow: sameSender
            ? "0 4px 12px rgba(14,165,233,0.25)"
            : "0 2px 8px rgba(0,0,0,0.08)",
          position: "relative",
          // Alert/admin style
          ...(sender?.name === "Admin" && {
            backgroundColor: "rgba(99,102,241,0.12)",
            color: "#6366f1",
            borderRadius: "12px",
            border: "1px solid rgba(99,102,241,0.2)",
            alignSelf: "center",
            boxShadow: "none",
          }),
        }}
      >
        {/* Text content */}
        {content && (
          <Typography
            sx={{
              fontSize: "0.9rem",
              lineHeight: 1.5,
              wordBreak: "break-word",
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
          >
            {content}
          </Typography>
        )}

        {/* Attachments */}
        {attachments.length > 0 &&
          attachments.map((attachment, index) => {
            const url = attachment.url;
            const file = fileFormat(url);
            return (
              <Box key={index} mt={content ? 0.5 : 0}>
                <a
                  href={url}
                  target="_blank"
                  download
                  style={{ color: sameSender ? "white" : "#0ea5e9" }}
                >
                  {RenderAttachment(file, url)}
                </a>
              </Box>
            );
          })}

        {/* Timestamp */}
        <Typography
          sx={{
            fontSize: "0.65rem",
            color: sameSender ? "rgba(255,255,255,0.65)" : "rgba(100,116,139,0.8)",
            textAlign: "right",
            mt: 0.4,
            lineHeight: 1,
          }}
        >
          {timeAgo}
        </Typography>
      </Box>
    </motion.div>
  );
};

export default memo(MessageComponent);

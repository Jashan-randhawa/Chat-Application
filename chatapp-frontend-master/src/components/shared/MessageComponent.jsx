import { Box, Typography } from "@mui/material";
import React, { memo } from "react";
import moment from "moment";
import { fileFormat } from "../../lib/features";
import RenderAttachment from "./RenderAttachment";
import { motion } from "framer-motion";
import { DoneAll as DoneAllIcon } from "@mui/icons-material";

const MessageComponent = ({ message, user }) => {
  const { sender, content, attachments = [], createdAt } = message;
  const sameSender = sender?._id === user?._id;
  const time = moment(createdAt).format("h:mm A");
  const isAdmin = sender?.name === "Admin";

  if (isAdmin) {
    return (
      <Box sx={{
        display: "flex", justifyContent: "center", my: 0.5,
      }}>
        <Box sx={{
          bgcolor: "#fef9c3",
          color: "#54656f",
          borderRadius: "8px",
          px: 2, py: 0.6,
          fontSize: "0.75rem",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          maxWidth: "80%",
          textAlign: "center",
          boxShadow: "0 1px 1px rgba(0,0,0,0.08)",
        }}>
          {content}
        </Box>
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        alignSelf: sameSender ? "flex-end" : "flex-start",
        maxWidth: "65%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Sender name for group chats */}
      {!sameSender && (
        <Typography sx={{
          color: getColorForName(sender?.name),
          fontWeight: 600,
          fontSize: "0.78rem",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          mb: 0.2,
          ml: 1,
        }}>
          {sender?.name}
        </Typography>
      )}

      {/* WhatsApp bubble */}
      <Box sx={{
        bgcolor: sameSender ? "#d9fdd3" : "#ffffff",
        borderRadius: sameSender ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
        px: 1.25, pt: 0.6, pb: 0.4,
        boxShadow: "0 1px 2px rgba(0,0,0,0.13)",
        position: "relative",
        // Tail
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          ...(sameSender ? {
            right: -7,
            borderLeft: "8px solid #d9fdd3",
            borderBottom: "8px solid transparent",
          } : {
            left: -7,
            borderRight: "8px solid #ffffff",
            borderBottom: "8px solid transparent",
          }),
        },
      }}>
        {/* Text */}
        {content && (
          <Typography sx={{
            fontSize: "0.9375rem",
            lineHeight: 1.45,
            wordBreak: "break-word",
            color: "#111b21",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            pr: 1,
          }}>
            {content}
          </Typography>
        )}

        {/* Attachments */}
        {attachments.length > 0 && attachments.map((attachment, index) => {
          const url = attachment.url;
          const file = fileFormat(url);
          return (
            <Box key={index} mt={content ? 0.5 : 0}>
              <a href={url} target="_blank" download style={{ color: "#027eb5" }}>
                {RenderAttachment(file, url)}
              </a>
            </Box>
          );
        })}

        {/* Timestamp + tick - WA style inline */}
        <Box sx={{
          display: "flex", alignItems: "center", justifyContent: "flex-end",
          gap: 0.3, mt: 0.2, ml: 2,
        }}>
          <Typography sx={{
            fontSize: "0.68rem",
            color: "#8696a0",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            lineHeight: 1,
          }}>
            {time}
          </Typography>
          {sameSender && (
            <DoneAllIcon sx={{ fontSize: 14, color: "#53bdeb" }} />
          )}
        </Box>
      </Box>
    </motion.div>
  );
};

// WA uses different colors per contact name
const NAME_COLORS = ["#e06c75", "#e5c07b", "#98c379", "#56b6c2", "#c678dd", "#61afef", "#d19a66"];
const getColorForName = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return NAME_COLORS[hash % NAME_COLORS.length];
};

export default memo(MessageComponent);

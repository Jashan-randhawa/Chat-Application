import { Box, Typography } from "@mui/material";
import React, { memo } from "react";
import moment from "moment";
import { fileFormat } from "../../lib/features";
import RenderAttachment from "./RenderAttachment";
import { motion } from "framer-motion";

/**
 * MessageComponent
 *
 * Props:
 *  message    – message object
 *  user       – current user
 *  isGrouped  – true when this is a consecutive message from the same sender
 *               (suppresses sender name & bubble tail for a cleaner look)
 *  isLast     – true when this is the last in a consecutive run
 *               (shows timestamp; earlier grouped bubbles hide it)
 *  isMobile   – boolean injected by ResponsiveChatContainer
 */
const MessageComponent = ({ message, user, isGrouped = false, isLast = true, isMobile = false }) => {
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
          fontSize: { xs: "0.72rem", sm: "0.75rem" },
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

  /* Bubble corner radii:
     - First in a run: show tail (sharp corner on sender side)
     - Grouped (not first): all corners rounded (no tail) */
  const ownRadius = isGrouped
    ? "12px"
    : "12px 2px 12px 12px";
  const otherRadius = isGrouped
    ? "12px"
    : "2px 12px 12px 12px";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      style={{
        alignSelf: sameSender ? "flex-end" : "flex-start",
        /* Responsive max-width: wider on small screens (less padding) */
        maxWidth: isMobile ? "min(92%, 420px)" : "min(75%, 520px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Sender name – only for other people, and only on the first bubble in a run */}
      {!sameSender && !isGrouped && (
        <Typography sx={{
          color: getColorForName(sender?.name),
          fontWeight: 600,
          fontSize: { xs: "0.75rem", sm: "0.78rem" },
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
        borderRadius: sameSender ? ownRadius : otherRadius,
        px: { xs: 1, sm: 1.25 },
        pt: { xs: 0.5, sm: 0.6 },
        pb: { xs: 0.3, sm: 0.4 },
        boxShadow: "0 1px 2px rgba(0,0,0,0.13)",
        position: "relative",
        /* Tail: only shown on the first bubble in a run */
        ...(!isGrouped && {
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
        }),
      }}>
        {/* Text */}
        {content && (
          <Typography sx={{
            /* 16px on mobile to prevent iOS auto-zoom if tapped in editable context,
               slightly smaller on desktop for density */
            fontSize: { xs: "1rem", sm: "0.9375rem" },
            lineHeight: { xs: 1.5, sm: 1.45 },
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
            <Box
              key={index}
              mt={content ? 0.5 : 0}
              sx={{
                /* On mobile, attachments fill the bubble width for easier tapping */
                maxWidth: { xs: "100%", sm: "320px" },
                "& img, & video": {
                  borderRadius: "8px",
                  maxWidth: "100%",
                  display: "block",
                },
              }}
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                download
                style={{ color: "#027eb5" }}
              >
                {RenderAttachment(file, url)}
              </a>
            </Box>
          );
        })}

        {/* Timestamp – shown on last bubble in a group run */}
        {isLast && (
          <Box sx={{
            display: "flex", alignItems: "center", justifyContent: "flex-end",
            gap: 0.3, mt: 0.2, ml: 2,
          }}>
            <Typography sx={{
              fontSize: { xs: "0.7rem", sm: "0.68rem" },
              color: "#8696a0",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              lineHeight: 1,
            }}>
              {time}
            </Typography>
          </Box>
        )}
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

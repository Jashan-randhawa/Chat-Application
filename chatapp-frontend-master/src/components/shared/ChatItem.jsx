// ============================================================
// REDESIGNED ChatItem — premium dark sidebar chat entry
// Changes: smooth hover animations, online dot pulse effect,
//          new message badge, staggered entry animation
// ============================================================

import React, { memo } from "react";
import { Link } from "../styles/StyledComponents";
import { Box, Stack, Typography, Avatar } from "@mui/material";
import AvatarCard from "./AvatarCard";
import { motion } from "framer-motion";

const ChatItem = ({
  avatar = [],
  name,
  _id,
  groupChat = false,
  sameSender,
  isOnline,
  newMessageAlert,
  index = 0,
  handleDeleteChat,
}) => {
  return (
    <Link
      to={`/chat/${_id}`}
      onContextMenu={(e) => handleDeleteChat(e, _id, groupChat)}
      sx={{ padding: "0" }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04, duration: 0.3, ease: "easeOut" }}
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          position: "relative",
          padding: "0.75rem 1rem",
          cursor: "pointer",
          transition: "background 0.15s ease",
          // Active chat highlight
          background: sameSender
            ? "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.12))"
            : "transparent",
          borderLeft: sameSender ? "3px solid #0ea5e9" : "3px solid transparent",
        }}
      >
        {/* Avatar with online indicator */}
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <AvatarCard avatar={avatar} />
          {isOnline && (
            <Box
              sx={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                bgcolor: "#22c55e",
                border: "2px solid #0f172a",
                position: "absolute",
                bottom: 2,
                right: 2,
                // Pulse animation for online indicator
                "&::after": {
                  content: '""',
                  position: "absolute",
                  inset: -3,
                  borderRadius: "50%",
                  border: "2px solid #22c55e",
                  animation: "pulse 2s ease-in-out infinite",
                  opacity: 0.5,
                },
                "@keyframes pulse": {
                  "0%, 100%": { opacity: 0.5, transform: "scale(1)" },
                  "50%": { opacity: 0, transform: "scale(1.8)" },
                },
              }}
            />
          )}
        </Box>

        {/* Name + preview */}
        <Stack spacing={0.3} flex={1} minWidth={0}>
          <Typography
            sx={{
              color: sameSender ? "#e2e8f0" : "rgba(226,232,240,0.85)",
              fontWeight: sameSender ? 600 : 500,
              fontSize: "0.88rem",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </Typography>
          {newMessageAlert && (
            <Typography
              sx={{
                color: "#0ea5e9",
                fontSize: "0.72rem",
                fontWeight: 600,
              }}
            >
              {newMessageAlert.count} new message{newMessageAlert.count > 1 ? "s" : ""}
            </Typography>
          )}
        </Stack>

        {/* New message badge */}
        {newMessageAlert && (
          <Box
            sx={{
              minWidth: 20,
              height: 20,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: 0.7,
              flexShrink: 0,
            }}
          >
            <Typography sx={{ color: "white", fontSize: "0.65rem", fontWeight: 700 }}>
              {newMessageAlert.count}
            </Typography>
          </Box>
        )}
      </motion.div>
    </Link>
  );
};

export default memo(ChatItem);

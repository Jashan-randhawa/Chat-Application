import React, { memo } from "react";
import { Link } from "../styles/StyledComponents";
import { Box, Stack, Typography, Avatar } from "@mui/material";
import AvatarCard from "./AvatarCard";
import { DoneAll as DoneAllIcon, Done as DoneIcon } from "@mui/icons-material";

const ChatItem = ({
  avatar = [], name, _id, groupChat = false, sameSender,
  isOnline, newMessageAlert, index = 0, handleDeleteChat,
}) => {
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <Link
      to={`/chat/${_id}`}
      onContextMenu={(e) => handleDeleteChat(e, _id, groupChat)}
      sx={{ padding: "0" }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          py: 1.25,
          position: "relative",
          cursor: "pointer",
          bgcolor: sameSender ? "#f0f2f5" : "transparent",
          borderBottom: "1px solid #f5f6f6",
          transition: "background 0.1s ease",
          minHeight: 68,
          WebkitTapHighlightColor: "transparent",
          "&:hover": {
            bgcolor: sameSender ? "#f0f2f5" : "#f5f6f6",
          },
          // WhatsApp active bar
          "&::before": sameSender ? {
            content: '""',
            position: "absolute",
            left: 0, top: 0, bottom: 0,
            width: 3,
            bgcolor: "#00a884",
            borderRadius: "0 2px 2px 0",
          } : {},
        }}
      >
        {/* Avatar with online indicator */}
        <Box sx={{ position: "relative", flexShrink: 0 }}>
          <AvatarCard avatar={avatar} />
          {isOnline && (
            <Box sx={{
              width: 12, height: 12,
              borderRadius: "50%",
              bgcolor: "#00a884",
              border: "2px solid #ffffff",
              position: "absolute",
              bottom: 1, right: 1,
            }} />
          )}
        </Box>

        {/* Main content */}
        <Box flex={1} minWidth={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.3}>
            <Typography sx={{
              color: "#111b21",
              fontWeight: sameSender ? 600 : 500,
              fontSize: "0.9375rem",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flex: 1,
            }}>
              {name}
            </Typography>
            {/* Timestamp - WA style */}
            <Typography sx={{
              fontSize: "0.72rem",
              color: newMessageAlert ? "#00a884" : "#8696a0",
              ml: 1, flexShrink: 0,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}>
              {timeStr}
            </Typography>
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography sx={{
              color: "#8696a0",
              fontSize: "0.8125rem",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              flex: 1,
              display: "flex", alignItems: "center", gap: 0.3,
            }}>
              {/* Read tick */}
              <DoneAllIcon sx={{ fontSize: 14, color: "#53bdeb", flexShrink: 0 }} />
              {newMessageAlert
                ? <span style={{ color: "#111b21" }}>{newMessageAlert.count} new message{newMessageAlert.count > 1 ? "s" : ""}</span>
                : <span>Tap to open chat</span>
              }
            </Typography>

            {/* Unread badge */}
            {newMessageAlert && (
              <Box sx={{
                minWidth: 20, height: 20,
                borderRadius: "10px",
                bgcolor: "#00a884",
                display: "flex", alignItems: "center", justifyContent: "center",
                px: 0.6, ml: 0.5, flexShrink: 0,
              }}>
                <Typography sx={{ color: "white", fontSize: "0.7rem", fontWeight: 700 }}>
                  {newMessageAlert.count}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Link>
  );
};

export default memo(ChatItem);

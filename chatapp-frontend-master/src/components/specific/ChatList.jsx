// ============================================================
// REDESIGNED ChatList — dark sidebar with search hint + header
// Changes: added section header, smooth scroll, empty state
// ============================================================

import { Box, Stack, Typography } from "@mui/material";
import { ChatBubbleOutline as ChatBubbleOutlineIcon } from "@mui/icons-material";
import React from "react";
import ChatItem from "../shared/ChatItem";

const ChatList = ({
  w = "100%",
  chats = [],
  chatId,
  onlineUsers = [],
  newMessagesAlert = [{ chatId: "", count: 0 }],
  handleDeleteChat,
}) => {
  return (
    <Stack
      width={w}
      direction={"column"}
      height={"100%"}
      sx={{ overflow: "hidden" }}
    >
      {/* Sidebar header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          flexShrink: 0,
        }}
      >
        <Typography
          sx={{
            color: "rgba(148,163,184,0.7)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Messages
        </Typography>
      </Box>

      {/* Chat list */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          // Custom scrollbar
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.1)",
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(255,255,255,0.18)",
          },
        }}
      >
        {chats?.length === 0 ? (
          /* Empty state */
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 1.5,
              p: 4,
            }}
          >
            <ChatBubbleOutlineIcon
              sx={{ fontSize: 40, color: "rgba(255,255,255,0.15)" }}
            />
            <Typography
              sx={{
                color: "rgba(255,255,255,0.3)",
                fontSize: "0.85rem",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              No conversations yet.
              <br />
              Search for friends to start chatting.
            </Typography>
          </Box>
        ) : (
          chats?.map((data, index) => {
            const { avatar, _id, name, groupChat, members } = data;

            const newMessageAlert = newMessagesAlert.find(
              ({ chatId }) => chatId === _id
            );

            const isOnline = members?.some((member) =>
              onlineUsers.includes(member)
            );

            return (
              <ChatItem
                index={index}
                newMessageAlert={newMessageAlert}
                isOnline={isOnline}
                avatar={avatar}
                name={name}
                _id={_id}
                key={_id}
                groupChat={groupChat}
                sameSender={chatId === _id}
                handleDeleteChat={handleDeleteChat}
              />
            );
          })
        )}
      </Box>
    </Stack>
  );
};

export default ChatList;

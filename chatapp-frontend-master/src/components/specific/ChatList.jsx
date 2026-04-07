import { Box, Stack, Typography, InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import React, { useState } from "react";
import ChatItem from "../shared/ChatItem";

const ChatList = ({
  w = "100%", chats = [], chatId, onlineUsers = [],
  newMessagesAlert = [{ chatId: "", count: 0 }], handleDeleteChat,
}) => {
  const [search, setSearch] = useState("");

  const filtered = chats?.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Stack width={w} direction="column" height="100%" sx={{ overflow: "hidden" }}>
      {/* WhatsApp-style search bar */}
      <Box sx={{ px: 1.5, py: 1.25, bgcolor: "#f0f2f5", flexShrink: 0 }}>
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1,
          bgcolor: "#ffffff", borderRadius: "8px",
          px: 1.5, py: 0.75,
          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        }}>
          <SearchIcon sx={{ color: "#8696a0", fontSize: 18, flexShrink: 0 }} />
          <input
            placeholder="Search or start new chat"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: "0.9rem", color: "#111b21", width: "100%",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          />
        </Box>
      </Box>

      {/* Chat list */}
      <Box sx={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        "&::-webkit-scrollbar": { width: 6 },
        "&::-webkit-scrollbar-track": { background: "transparent" },
        "&::-webkit-scrollbar-thumb": { background: "#d1d7db", borderRadius: 3 },
        "&::-webkit-scrollbar-thumb:hover": { background: "#b0b7bc" },
      }}>
        {filtered?.length === 0 ? (
          <Box sx={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            height: "60%", gap: 1.5, p: 4,
          }}>
            <Typography sx={{ color: "#8696a0", fontSize: "0.9rem", textAlign: "center" }}>
              {search ? `No chats matching "${search}"` : "No conversations yet."}
            </Typography>
          </Box>
        ) : (
          filtered?.map((data, index) => {
            const { avatar, _id, name, groupChat, members } = data;
            const newMessageAlert = newMessagesAlert.find(({ chatId }) => chatId === _id);
            const isOnline = members?.some(member => onlineUsers.includes(member));

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

// ============================================================
// REDESIGNED Chat page — modern WhatsApp-like interface
// Changes: chat header with name/online status, improved
//          message area background, redesigned input bar,
//          send button with gradient, smooth scroll behavior
// ============================================================

import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import AppLayout from "../components/layout/AppLayout";
import { IconButton, Skeleton, Stack, Box, Typography, Avatar } from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
} from "@mui/icons-material";
import { InputBox } from "../components/styles/StyledComponents";
import FileMenu from "../components/dialogs/FileMenu";
import MessageComponent from "../components/shared/MessageComponent";
import { getSocket } from "../socket";
import {
  ALERT,
  CHAT_JOINED,
  CHAT_LEAVED,
  NEW_MESSAGE,
  START_TYPING,
  STOP_TYPING,
} from "../constants/events";
import { useChatDetailsQuery, useGetMessagesQuery } from "../redux/api/api";
import { useErrors, useSocketEvents } from "../hooks/hook";
import { useInfiniteScrollTop } from "6pp";
import { useDispatch } from "react-redux";
import { setIsFileMenu } from "../redux/reducers/misc";
import { removeNewMessagesAlert } from "../redux/reducers/chat";
import { TypingLoader } from "../components/layout/Loaders";
import { useNavigate } from "react-router-dom";
import { transformImage } from "../lib/features";

const Chat = ({ chatId, user }) => {
  const socket = getSocket();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [fileMenuAnchor, setFileMenuAnchor] = useState(null);
  const [IamTyping, setIamTyping] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const typingTimeout = useRef(null);

  const chatDetails = useChatDetailsQuery({ chatId, skip: !chatId });
  const oldMessagesChunk = useGetMessagesQuery({ chatId, page });

  const { data: oldMessages, setData: setOldMessages } = useInfiniteScrollTop(
    containerRef,
    oldMessagesChunk.data?.totalPages,
    page,
    setPage,
    oldMessagesChunk.data?.messages
  );

  const errors = [
    { isError: chatDetails.isError, error: chatDetails.error },
    { isError: oldMessagesChunk.isError, error: oldMessagesChunk.error },
  ];

  const members = chatDetails?.data?.chat?.members;
  const chatName = chatDetails?.data?.chat?.name;
  const isGroupChat = chatDetails?.data?.chat?.groupChat;

  const messageOnChange = (e) => {
    setMessage(e.target.value);
    if (!IamTyping) {
      socket.emit(START_TYPING, { members, chatId });
      setIamTyping(true);
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit(STOP_TYPING, { members, chatId });
      setIamTyping(false);
    }, [2000]);
  };

  const handleFileOpen = (e) => {
    dispatch(setIsFileMenu(true));
    setFileMenuAnchor(e.currentTarget);
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    socket.emit(NEW_MESSAGE, { chatId, members, message });
    setMessage("");
  };

  useEffect(() => {
    socket.emit(CHAT_JOINED, { userId: user._id, members });
    dispatch(removeNewMessagesAlert(chatId));
    return () => {
      setMessages([]);
      setMessage("");
      setOldMessages([]);
      setPage(1);
      socket.emit(CHAT_LEAVED, { userId: user._id, members });
    };
  }, [chatId]);

  useEffect(() => {
    if (bottomRef.current)
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatDetails.isError) return navigate("/");
  }, [chatDetails.isError]);

  const newMessagesListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      setMessages((prev) => [...prev, data.message]);
    },
    [chatId]
  );

  const startTypingListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      setUserTyping(true);
    },
    [chatId]
  );

  const stopTypingListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      setUserTyping(false);
    },
    [chatId]
  );

  const alertListener = useCallback(
    (data) => {
      if (data.chatId !== chatId) return;
      const messageForAlert = {
        content: data.message,
        sender: {
          _id: "djasdhajksdhasdsadasdas",
          name: "Admin",
        },
        chat: chatId,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, messageForAlert]);
    },
    [chatId]
  );

  const eventHandler = {
    [ALERT]: alertListener,
    [NEW_MESSAGE]: newMessagesListener,
    [START_TYPING]: startTypingListener,
    [STOP_TYPING]: stopTypingListener,
  };

  useSocketEvents(socket, eventHandler);
  useErrors(errors);

  const allMessages = [...oldMessages, ...messages];

  return chatDetails.isLoading ? (
    <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: "flex",
            justifyContent: i % 2 === 0 ? "flex-start" : "flex-end",
          }}
        >
          <Skeleton
            variant="rounded"
            width={`${Math.random() * 200 + 100}px`}
            height={48}
            sx={{ borderRadius: "18px", bgcolor: "rgba(0,0,0,0.06)" }}
          />
        </Box>
      ))}
    </Box>
  ) : (
    <Fragment>
      {/* Chat area header */}
      <Box
        sx={{
          px: 2,
          py: 1.2,
          bgcolor: "white",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1rem",
            color: "white",
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {chatName?.[0]?.toUpperCase() || "C"}
        </Box>
        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "0.95rem",
              color: "#1e293b",
              lineHeight: 1.2,
            }}
          >
            {chatName || "Chat"}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "#64748b" }}>
            {isGroupChat ? "Group chat" : "Direct message"}
          </Typography>
        </Box>
      </Box>

      {/* Messages area */}
      <Stack
        ref={containerRef}
        boxSizing={"border-box"}
        padding={"1.25rem 1rem"}
        spacing={"0.5rem"}
        height={"calc(100% - 4rem - 70px)"}
        sx={{
          overflowX: "hidden",
          overflowY: "auto",
          // Subtle chat wallpaper pattern
          background: "#f0f2f5",
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(14,165,233,0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(99,102,241,0.03) 0%, transparent 50%)
          `,
          // Custom scrollbar
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0,0,0,0.12)",
            borderRadius: 4,
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(0,0,0,0.2)",
          },
          display: "flex",
          flexDirection: "column",
        }}
      >
        {allMessages.map((i) => (
          <MessageComponent key={i._id} message={i} user={user} />
        ))}

        {userTyping && <TypingLoader />}

        <div ref={bottomRef} />
      </Stack>

      {/* Input bar */}
      <form
        onSubmit={submitHandler}
        style={{
          background: "white",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          padding: "0.6rem 0.75rem",
          flexShrink: 0,
        }}
      >
        <Stack
          direction={"row"}
          alignItems={"center"}
          gap={1}
          sx={{
            bgcolor: "#f0f2f5",
            borderRadius: "2rem",
            px: 1.5,
            py: 0.5,
            position: "relative",
          }}
        >
          {/* Attach button */}
          <IconButton
            onClick={handleFileOpen}
            size="small"
            sx={{
              color: "#64748b",
              flexShrink: 0,
              "&:hover": { color: "#0ea5e9", bgcolor: "transparent" },
              transition: "color 0.2s ease",
            }}
          >
            <AttachFileIcon fontSize="small" sx={{ transform: "rotate(45deg)" }} />
          </IconButton>

          {/* Message input */}
          <InputBox
            placeholder="Type a message..."
            value={message}
            onChange={messageOnChange}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              padding: "0.5rem 0",
              fontSize: "0.92rem",
              color: "#1e293b",
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
            }}
          />

          {/* Send button */}
          <IconButton
            type="submit"
            size="small"
            disabled={!message.trim()}
            sx={{
              flexShrink: 0,
              width: 36,
              height: 36,
              background: message.trim()
                ? "linear-gradient(135deg, #0ea5e9, #6366f1)"
                : "rgba(0,0,0,0.08)",
              color: message.trim() ? "white" : "#94a3b8",
              borderRadius: "50%",
              transition: "all 0.2s ease",
              "&:hover": {
                background: message.trim()
                  ? "linear-gradient(135deg, #0284c7, #4f46e5)"
                  : "rgba(0,0,0,0.08)",
                transform: message.trim() ? "scale(1.08)" : "none",
              },
              "&:disabled": {
                background: "rgba(0,0,0,0.06)",
              },
            }}
          >
            <SendIcon sx={{ fontSize: 16, ml: "1px" }} />
          </IconButton>
        </Stack>
      </form>

      <FileMenu anchorE1={fileMenuAnchor} chatId={chatId} />
    </Fragment>
  );
};

export default AppLayout()(Chat);

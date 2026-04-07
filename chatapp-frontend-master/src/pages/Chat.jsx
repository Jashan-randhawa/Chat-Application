import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { IconButton, Skeleton, Stack, Box, Typography, Avatar, Tooltip } from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
  Videocam as VideoIcon,
} from "@mui/icons-material";
import { InputBox } from "../components/styles/StyledComponents";
import FileMenu from "../components/dialogs/FileMenu";
import MessageComponent from "../components/shared/MessageComponent";
import { getSocket } from "../socket";
import {
  ALERT, CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, START_TYPING, STOP_TYPING,
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
    page, setPage,
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
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatDetails.isError) return navigate("/");
  }, [chatDetails.isError]);

  const newMessagesListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    setMessages((prev) => [...prev, data.message]);
  }, [chatId]);

  const startTypingListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    setUserTyping(true);
  }, [chatId]);

  const stopTypingListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    setUserTyping(false);
  }, [chatId]);

  const alertListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    setMessages((prev) => [...prev, {
      content: data.message,
      sender: { _id: "admin", name: "Admin" },
      chat: chatId,
      createdAt: new Date().toISOString(),
    }]);
  }, [chatId]);

  const eventHandler = {
    [ALERT]: alertListener,
    [NEW_MESSAGE]: newMessagesListener,
    [START_TYPING]: startTypingListener,
    [STOP_TYPING]: stopTypingListener,
  };

  useSocketEvents(socket, eventHandler);
  useErrors(errors);

  const allMessages = [...oldMessages, ...messages];

  if (!chatId) {
    return (
      <Box sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f0f2f5",
        gap: 2,
      }}>
        <Box sx={{
          width: 200, height: 200,
          borderRadius: "50%",
          bgcolor: "#e9edef",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Box sx={{ fontSize: 80 }}>💬</Box>
        </Box>
        <Typography sx={{
          color: "#54656f", fontSize: "1.25rem", fontWeight: 300,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
          WhatsApp Web
        </Typography>
        <Typography sx={{
          color: "#8696a0", fontSize: "0.875rem",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          textAlign: "center", maxWidth: 380,
        }}>
          Send and receive messages without keeping your phone online.<br/>
          Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </Typography>
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1, mt: 2,
          color: "#8696a0", fontSize: "0.8rem",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#00a884" }} />
          End-to-end encrypted
        </Box>
      </Box>
    );
  }

  return chatDetails.isLoading ? (
    <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "#efeae2", height: "100%" }}>
      {Array.from({ length: 7 }).map((_, i) => (
        <Box key={i} sx={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
          <Skeleton variant="rounded" width={`${Math.random() * 200 + 80}px`} height={44}
            sx={{ borderRadius: "12px", bgcolor: i % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(217,253,211,0.8)" }}
          />
        </Box>
      ))}
    </Box>
  ) : (
    <Fragment>
      {/* WhatsApp chat header */}
      <Box sx={{
        px: 2, py: 1,
        bgcolor: "#f0f2f5",
        borderBottom: "1px solid #e9edef",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexShrink: 0,
        minHeight: "3.25rem",
      }}>
        {/* Avatar */}
        <Box sx={{
          width: 40, height: 40, borderRadius: "50%",
          background: "linear-gradient(135deg, #00a884, #008069)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1rem", color: "white", fontWeight: 700, flexShrink: 0,
        }}>
          {chatName?.[0]?.toUpperCase() || "C"}
        </Box>

        {/* Name + status */}
        <Box flex={1}>
          <Typography sx={{
            fontWeight: 600, fontSize: "0.9375rem",
            color: "#111b21", lineHeight: 1.2,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}>
            {chatName || "Chat"}
          </Typography>
          <Typography sx={{
            fontSize: "0.75rem", color: "#8696a0",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}>
            {userTyping ? (
              <span style={{ color: "#00a884" }}>typing...</span>
            ) : (
              isGroupChat ? "Group · Tap for info" : "click here for contact info"
            )}
          </Typography>
        </Box>

        {/* Right actions */}
        <Box display="flex" gap={0.5}>
          {[VideoIcon, PhoneIcon, SearchIcon, MoreVertIcon].map((Icon, i) => (
            <IconButton key={i} size="small" sx={{
              color: "#54656f",
              "&:hover": { bgcolor: "#e9edef" },
              borderRadius: "50%",
            }}>
              <Icon sx={{ fontSize: 20 }} />
            </IconButton>
          ))}
        </Box>
      </Box>

      {/* Messages area - WA chat wallpaper style */}
      <Stack
        ref={containerRef}
        padding={"0.75rem 5%"}
        spacing={"0.25rem"}
        height={"calc(100% - 3.25rem - 3.75rem)"}
        sx={{
          overflowX: "hidden",
          overflowY: "auto",
          // WhatsApp's authentic beige chat background
          background: "#efeae2",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cfc4b0' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 3 },
        }}
      >
        {allMessages.map((i) => (
          <MessageComponent key={i._id} message={i} user={user} />
        ))}
        {userTyping && <TypingLoader />}
        <div ref={bottomRef} />
      </Stack>

      {/* WhatsApp input bar */}
      <Box
        component="form"
        onSubmit={submitHandler}
        sx={{
          bgcolor: "#f0f2f5",
          px: 1.5, py: 0.75,
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexShrink: 0,
          minHeight: "3.75rem",
        }}
      >
        {/* Emoji + Attach */}
        <Box sx={{
          display: "flex",
          bgcolor: "#ffffff",
          borderRadius: "24px",
          flex: 1,
          alignItems: "center",
          px: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          minHeight: "2.625rem",
        }}>
          <IconButton size="small" sx={{ color: "#54656f", flexShrink: 0 }}>
            <EmojiIcon sx={{ fontSize: 22 }} />
          </IconButton>
          <IconButton
            onClick={handleFileOpen}
            size="small"
            sx={{ color: "#54656f", flexShrink: 0, mr: 0.5 }}
          >
            <AttachFileIcon sx={{ fontSize: 20, transform: "rotate(45deg)" }} />
          </IconButton>

          <InputBox
            placeholder="Type a message"
            value={message}
            onChange={messageOnChange}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              padding: "0.4rem 0.25rem",
              fontSize: "0.9375rem",
              color: "#111b21",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          />
        </Box>

        {/* Send / Mic button - WA style */}
        <Box
          component={message.trim() ? "button" : "div"}
          onClick={message.trim() ? submitHandler : undefined}
          sx={{
            width: 42, height: 42,
            borderRadius: "50%",
            bgcolor: "#00a884",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            border: "none",
            flexShrink: 0,
            transition: "all 0.15s ease",
            "&:hover": { bgcolor: "#008069" },
            "&:active": { transform: "scale(0.95)" },
          }}
        >
          {message.trim()
            ? <SendIcon sx={{ fontSize: 20, color: "white", ml: "2px" }} />
            : <MicIcon sx={{ fontSize: 20, color: "white" }} />
          }
        </Box>
      </Box>

      <FileMenu anchorE1={fileMenuAnchor} chatId={chatId} />
    </Fragment>
  );
};

export default AppLayout()(Chat);

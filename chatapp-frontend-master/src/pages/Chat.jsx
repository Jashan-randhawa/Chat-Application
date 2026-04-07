import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { IconButton, Skeleton, Stack, Box, Typography } from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Videocam as VideoIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { InputBox } from "../components/styles/StyledComponents";
import FileMenu from "../components/dialogs/FileMenu";
import MessageComponent from "../components/shared/MessageComponent";
import { getSocket } from "../socket";
import {
  ALERT, CHAT_JOINED, CHAT_LEAVED, MESSAGE_DELIVERED, MESSAGE_READ, NEW_MESSAGE, START_TYPING, STOP_TYPING,
} from "../constants/events";
import { useChatDetailsQuery, useGetMessagesQuery, useMarkMessageReadMutation } from "../redux/api/api";
import { useErrors, useSocketEvents } from "../hooks/hook";
import { useInfiniteScrollTop } from "6pp";
import { useDispatch } from "react-redux";
import { setIsFileMenu } from "../redux/reducers/misc";
import { removeNewMessagesAlert } from "../redux/reducers/chat";
import { TypingLoader } from "../components/layout/Loaders";
import { useNavigate } from "react-router-dom";

const Chat = ({ chatId, user, onBack, isMobile }) => {
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
  const readReceiptQueueRef = useRef(new Set());
  const [markMessageRead] = useMarkMessageReadMutation();

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
    }, 2000);
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

  const addUniqueUsers = (existingUsers = [], usersToAdd = []) => {
    const uniqueIds = new Set(existingUsers.map((id) => id?.toString()));
    usersToAdd.forEach((id) => uniqueIds.add(id?.toString()));
    return Array.from(uniqueIds);
  };

  const updateMessageReceiptInState = (messageId, updater) => {
    if (!messageId) return;
    setMessages((prev) =>
      prev.map((messageItem) =>
        messageItem._id?.toString() === messageId.toString()
          ? updater(messageItem)
          : messageItem
      )
    );
    setOldMessages((prev) =>
      prev.map((messageItem) =>
        messageItem._id?.toString() === messageId.toString()
          ? updater(messageItem)
          : messageItem
      )
    );
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

    if (data.message?.sender?._id !== user?._id && data.message?._id) {
      markMessageRead(data.message._id);
    }
  }, [chatId, markMessageRead, user?._id]);

  const messageDeliveredListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    updateMessageReceiptInState(data.messageId, (messageItem) => ({
      ...messageItem,
      deliveredTo: addUniqueUsers(messageItem.deliveredTo, data.deliveredTo || []),
    }));
  }, [chatId]);

  const messageReadListener = useCallback((data) => {
    if (data.chatId !== chatId) return;
    updateMessageReceiptInState(data.messageId, (messageItem) => ({
      ...messageItem,
      deliveredTo: addUniqueUsers(messageItem.deliveredTo, [data.userId]),
      readBy: addUniqueUsers(messageItem.readBy, [data.userId]),
    }));
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

  useSocketEvents(socket, {
    [ALERT]: alertListener,
    [NEW_MESSAGE]: newMessagesListener,
    [MESSAGE_DELIVERED]: messageDeliveredListener,
    [MESSAGE_READ]: messageReadListener,
    [START_TYPING]: startTypingListener,
    [STOP_TYPING]: stopTypingListener,
  });

  useErrors(errors);

  const allMessages = [...oldMessages, ...messages];

  useEffect(() => {
    const unreadIncoming = allMessages.filter(
      (msg) =>
        msg?._id &&
        msg?.sender?._id !== user?._id &&
        !msg?.readBy?.some((reader) => reader?.toString() === user?._id?.toString())
    );

    unreadIncoming.forEach((msg) => {
      const id = msg._id.toString();
      if (readReceiptQueueRef.current.has(id)) return;
      readReceiptQueueRef.current.add(id);
      markMessageRead(id).finally(() => {
        readReceiptQueueRef.current.delete(id);
      });
    });
  }, [allMessages, markMessageRead, user?._id]);

  // Empty state (no chat selected — desktop only, mobile never shows this)
  if (!chatId) {
    return (
      <Box sx={{
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        bgcolor: "#f0f2f5", gap: 2,
      }}>
        <Box sx={{
          width: 180, height: 180, borderRadius: "50%",
          bgcolor: "#e9edef", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Box sx={{ fontSize: 72 }}>💬</Box>
        </Box>
        <Typography sx={{
          color: "#54656f", fontSize: "1.15rem", fontWeight: 300,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
          WhatsApp Web
        </Typography>
        <Typography sx={{
          color: "#8696a0", fontSize: "0.82rem", textAlign: "center", maxWidth: 340,
          fontFamily: "'Segoe UI', system-ui, sans-serif", lineHeight: 1.6,
        }}>
          Send and receive messages without keeping your phone online.
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#8696a0", fontSize: "0.75rem" }}>
          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#00a884" }} />
          End-to-end encrypted
        </Box>
      </Box>
    );
  }

  // Loading skeleton
  if (chatDetails.isLoading) {
    return (
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5, bgcolor: "#efeae2", height: "100%" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Box key={i} sx={{ display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
            <Skeleton variant="rounded" width={`${Math.random() * 200 + 80}px`} height={44}
              sx={{ borderRadius: "12px", bgcolor: i % 2 === 0 ? "rgba(255,255,255,0.6)" : "rgba(217,253,211,0.8)" }}
            />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Fragment>
      {/* Chat header */}
      <Box sx={{
        px: isMobile ? 1 : 2,
        py: 1,
        bgcolor: "#008069",
        display: "flex",
        alignItems: "center",
        gap: 1,
        flexShrink: 0,
        minHeight: "3.5rem",
      }}>
        {/* Back button — mobile only */}
        {isMobile && (
          <IconButton
            onClick={onBack || (() => navigate("/"))}
            size="small"
            sx={{ color: "white", mr: 0.5, flexShrink: 0 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        {/* Avatar */}
        <Box sx={{
          width: 38, height: 38, borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.95rem", color: "white", fontWeight: 700, flexShrink: 0,
        }}>
          {chatName?.[0]?.toUpperCase() || "C"}
        </Box>

        {/* Name + status */}
        <Box flex={1} minWidth={0}>
          <Typography sx={{
            fontWeight: 600, fontSize: "0.9375rem",
            color: "white", lineHeight: 1.2,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {chatName || "Chat"}
          </Typography>
          <Typography sx={{
            fontSize: "0.72rem", color: "rgba(255,255,255,0.75)",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}>
            {userTyping
              ? <span style={{ color: "#d1fae5" }}>typing...</span>
              : isGroupChat ? "Group chat" : "click here for info"
            }
          </Typography>
        </Box>

        {/* Right action icons */}
        <Box display="flex">
          {[VideoIcon, PhoneIcon, SearchIcon, MoreVertIcon].map((Icon, i) => (
            <IconButton key={i} size="small"
              sx={{ color: "rgba(255,255,255,0.85)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
              <Icon sx={{ fontSize: 20 }} />
            </IconButton>
          ))}
        </Box>
      </Box>

      {/* Messages area */}
      <Stack
        ref={containerRef}
        padding={"0.75rem 5%"}
        spacing={"0.25rem"}
        sx={{
          flex: 1,
          overflowX: "hidden",
          overflowY: "auto",
          background: "#efeae2",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cfc4b0' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          display: "flex",
          flexDirection: "column",
          "&::-webkit-scrollbar": { width: 5 },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 3 },
          // Fix for mobile keyboard pushing content
          WebkitOverflowScrolling: "touch",
        }}
      >
        {allMessages.map((i) => (
          <MessageComponent key={i._id} message={i} user={user} />
        ))}
        {userTyping && <TypingLoader />}
        <div ref={bottomRef} />
      </Stack>

      {/* Input bar */}
      <Box
        component="form"
        onSubmit={submitHandler}
        sx={{
          bgcolor: "#f0f2f5",
          px: 1, py: 0.75,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flexShrink: 0,
          // Handles iOS safe area (notch)
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        {/* Text input container */}
        <Box sx={{
          display: "flex",
          bgcolor: "#ffffff",
          borderRadius: "24px",
          flex: 1,
          alignItems: "center",
          px: 1,
          minHeight: "2.75rem",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        }}>
          <IconButton size="small" sx={{ color: "#54656f", flexShrink: 0 }}>
            <EmojiIcon sx={{ fontSize: 22 }} />
          </IconButton>
          <IconButton onClick={handleFileOpen} size="small"
            sx={{ color: "#54656f", flexShrink: 0 }}>
            <AttachFileIcon sx={{ fontSize: 20, transform: "rotate(45deg)" }} />
          </IconButton>
          <InputBox
            placeholder="Type a message"
            value={message}
            onChange={messageOnChange}
            style={{
              flex: 1,
              border: "none", outline: "none",
              background: "transparent",
              padding: "0.5rem 0.25rem",
              fontSize: "0.9375rem",
              color: "#111b21",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              minWidth: 0,
            }}
          />
        </Box>

        {/* Send / Mic */}
        <Box
          component={message.trim() ? "button" : "div"}
          onClick={message.trim() ? submitHandler : undefined}
          sx={{
            width: 44, height: 44,
            borderRadius: "50%",
            bgcolor: "#00a884",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            border: "none",
            flexShrink: 0,
            transition: "background 0.15s ease",
            "&:hover": { bgcolor: "#008069" },
            "&:active": { transform: "scale(0.94)" },
            touchAction: "manipulation",
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

/* eslint-disable react/prop-types */
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import { IconButton, Stack, Typography } from "@mui/material";
import { grayColor, orange } from "../constants/color";
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  Forum as ForumIcon,
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
import { LayoutLoader, TypingLoader } from "../components/layout/Loaders";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    if (!chatId || !user?._id || !members) return;

    socket.emit(CHAT_JOINED, { userId: user._id, members });
    dispatch(removeNewMessagesAlert(chatId));

    return () => {
      setMessages([]);
      setMessage("");
      setOldMessages([]);
      setPage(1);
      socket.emit(CHAT_LEAVED, { userId: user._id, members });
    };
  }, [chatId, user?._id, members, socket, dispatch, setOldMessages]);

  useEffect(() => {
    if (bottomRef.current)
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (chatDetails.isError) return navigate("/");
  }, [chatDetails.isError, navigate]);

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

  const showMessagesLoader =
    chatId &&
    (oldMessagesChunk.isLoading || oldMessagesChunk.isFetching) &&
    allMessages.length === 0;

  if (chatDetails.isLoading) return <LayoutLoader />;

  return (
    <Fragment>
      <Stack
        ref={containerRef}
        boxSizing={"border-box"}
        padding={{ xs: "0.75rem", sm: "1rem 1.1rem" }}
        spacing={"0.8rem"}
        bgcolor={grayColor}
        height={"90%"}
        sx={{
          overflowX: "hidden",
          overflowY: "auto",
          overscrollBehavior: "contain",
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(108,99,255,0.28)",
            borderRadius: "999px",
          },
          backgroundImage:
            "radial-gradient(circle at 2px 2px, rgba(108,99,255,0.11) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      >
        {!chatId ? (
          <Stack
            height="100%"
            justifyContent="center"
            alignItems="center"
            color="rgba(30,36,56,0.72)"
            spacing={1.2}
          >
            <ForumIcon sx={{ fontSize: 56, color: "rgba(108,99,255,0.8)" }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Select a conversation
            </Typography>
            <Typography variant="body2">
              Choose a chat from the sidebar to start messaging.
            </Typography>
          </Stack>
        ) : showMessagesLoader ? (
          <Stack spacing={1.2}>
            {Array.from({ length: 7 }).map((_, index) => (
              <Stack
                key={`message-skeleton-${index}`}
                sx={{
                  width: index % 2 ? "72%" : "58%",
                  ml: index % 2 ? "auto" : 0,
                  height: "2.9rem",
                  borderRadius: index % 2 ? "1.1rem 1.1rem 0.3rem 1.1rem" : "1.1rem 1.1rem 1.1rem 0.3rem",
                  background:
                    index % 2
                      ? "linear-gradient(120deg, rgba(108,99,255,0.2), rgba(108,99,255,0.12))"
                      : "rgba(255,255,255,0.95)",
                  boxShadow: "0 8px 18px rgba(17,26,52,0.08)",
                }}
              />
            ))}
          </Stack>
        ) : allMessages.length === 0 ? (
          <Stack
            height="100%"
            justifyContent="center"
            alignItems="center"
            color="rgba(30,36,56,0.72)"
            spacing={1.2}
          >
            <ForumIcon sx={{ fontSize: 56, color: "rgba(108,99,255,0.8)" }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              No messages yet
            </Typography>
            <Typography variant="body2">
              Send the first message and start this conversation.
            </Typography>
          </Stack>
        ) : (
          allMessages.map((i) => (
            <MessageComponent key={i._id} message={i} user={user} />
          ))
        )}

        {userTyping && <TypingLoader />}

        <div ref={bottomRef} />
      </Stack>

      <form
        style={{
          height: "10%",
        }}
        onSubmit={submitHandler}
      >
        <Stack
          direction={"row"}
          height={"100%"}
          padding={{ xs: "0.75rem", sm: "0.9rem 1rem" }}
          alignItems={"center"}
          position={"relative"}
          sx={{
            background: "linear-gradient(120deg, rgba(108,99,255,0.08), rgba(34,193,195,0.08))",
            borderTop: "1px solid rgba(108,99,255,0.12)",
            gap: { xs: 0.3, sm: 0 },
          }}
        >
          <IconButton
            sx={{
              position: "absolute",
              left: { xs: "1rem", sm: "1.5rem" },
              rotate: "30deg",
              color: "rgba(30,36,56,0.75)",
              transition: "transform 0.2s ease, color 0.2s ease",
              "&:hover": {
                transform: "translateY(-1px)",
                color: "rgba(86,77,229,0.95)",
              },
            }}
            onClick={handleFileOpen}
          >
            <AttachFileIcon />
          </IconButton>

          <InputBox
            placeholder="Type Message Here..."
            value={message}
            onChange={messageOnChange}
          />

          <IconButton
            type="submit"
            disabled={!message.trim()}
            aria-label={
              message.trim()
                ? "Send message"
                : "Send message (disabled when message is empty)"
            }
            sx={{
              rotate: "-30deg",
              bgcolor: orange,
              color: "white",
              marginLeft: "1rem",
              padding: "0.6rem",
              opacity: message.trim() ? 1 : 0.5,
              transition: "transform 0.2s ease, background-color 0.2s ease",
              "&:hover": {
                bgcolor: "#564de5",
                transform: "translateY(-1px)",
              },
              "&.Mui-disabled": {
                bgcolor: "rgba(108,99,255,0.45)",
                color: "rgba(255,255,255,0.85)",
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </form>

      <FileMenu anchorE1={fileMenuAnchor} chatId={chatId} />
    </Fragment>
  );
};

export default AppLayout()(Chat);

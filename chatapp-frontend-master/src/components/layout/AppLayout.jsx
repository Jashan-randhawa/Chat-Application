// ============================================================
// REDESIGNED AppLayout — dark sidebar + clean chat area
// Changes: dark sidebar with glass effect, refined grid layout,
//          improved drawer for mobile, better profile panel
// ============================================================

import { Drawer, Grid, Skeleton, Box } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  NEW_MESSAGE_ALERT,
  NEW_REQUEST,
  ONLINE_USERS,
  REFETCH_CHATS,
} from "../../constants/events";
import { useErrors, useSocketEvents } from "../../hooks/hook";
import { getOrSaveFromStorage } from "../../lib/features";
import { useMyChatsQuery } from "../../redux/api/api";
import {
  incrementNotification,
  setNewMessagesAlert,
} from "../../redux/reducers/chat";
import {
  setIsDeleteMenu,
  setIsMobile,
  setSelectedDeleteChat,
} from "../../redux/reducers/misc";
import { getSocket } from "../../socket";
import DeleteChatMenu from "../dialogs/DeleteChatMenu";
import Title from "../shared/Title";
import ChatList from "../specific/ChatList";
import Profile from "../specific/Profile";
import Header from "./Header";

const AppLayout = () => (WrappedComponent) => {
  return (props) => {
    const params = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const socket = getSocket();

    const chatId = params.chatId;
    const deleteMenuAnchor = useRef(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const { isMobile } = useSelector((state) => state.misc);
    const { user } = useSelector((state) => state.auth);
    const { newMessagesAlert } = useSelector((state) => state.chat);

    const { isLoading, data, isError, error, refetch } = useMyChatsQuery("");

    useErrors([{ isError, error }]);

    useEffect(() => {
      getOrSaveFromStorage({ key: NEW_MESSAGE_ALERT, value: newMessagesAlert });
    }, [newMessagesAlert]);

    const handleDeleteChat = (e, chatId, groupChat) => {
      dispatch(setIsDeleteMenu(true));
      dispatch(setSelectedDeleteChat({ chatId, groupChat }));
      deleteMenuAnchor.current = e.currentTarget;
    };

    const handleMobileClose = () => dispatch(setIsMobile(false));

    const newMessageAlertListener = useCallback(
      (data) => {
        if (data.chatId === chatId) return;
        dispatch(setNewMessagesAlert(data));
      },
      [chatId]
    );

    const newRequestListener = useCallback(() => {
      dispatch(incrementNotification());
    }, [dispatch]);

    const refetchListener = useCallback(() => {
      refetch();
      navigate("/");
    }, [refetch, navigate]);

    const onlineUsersListener = useCallback((data) => {
      setOnlineUsers(data);
    }, []);

    const eventHandlers = {
      [NEW_MESSAGE_ALERT]: newMessageAlertListener,
      [NEW_REQUEST]: newRequestListener,
      [REFETCH_CHATS]: refetchListener,
      [ONLINE_USERS]: onlineUsersListener,
    };

    useSocketEvents(socket, eventHandlers);

    return (
      <>
        <Title />
        <Header />

        <DeleteChatMenu dispatch={dispatch} deleteMenuAnchor={deleteMenuAnchor} />

        {/* Mobile drawer */}
        {isLoading ? (
          <Skeleton />
        ) : (
          <Drawer
            open={isMobile}
            onClose={handleMobileClose}
            PaperProps={{
              sx: {
                background: "linear-gradient(180deg, #0f172a 0%, #1a2744 100%)",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                width: "78vw",
                maxWidth: 320,
              },
            }}
          >
            <ChatList
              w="100%"
              chats={data?.chats}
              chatId={chatId}
              handleDeleteChat={handleDeleteChat}
              newMessagesAlert={newMessagesAlert}
              onlineUsers={onlineUsers}
            />
          </Drawer>
        )}

        <Grid container height={"calc(100vh - 4rem)"} sx={{ overflow: "hidden" }}>
          {/* Sidebar — chat list */}
          <Grid
            item
            sm={4}
            md={3}
            sx={{
              display: { xs: "none", sm: "block" },
              background: "linear-gradient(180deg, #0f172a 0%, #1a2744 100%)",
              borderRight: "1px solid rgba(255,255,255,0.05)",
            }}
            height={"100%"}
          >
            {isLoading ? (
              <ChatListSkeleton />
            ) : (
              <ChatList
                chats={data?.chats}
                chatId={chatId}
                handleDeleteChat={handleDeleteChat}
                newMessagesAlert={newMessagesAlert}
                onlineUsers={onlineUsers}
              />
            )}
          </Grid>

          {/* Main chat area */}
          <Grid
            item
            xs={12}
            sm={8}
            md={5}
            lg={6}
            height={"100%"}
            sx={{ bgcolor: "#f0f2f5" }}
          >
            <WrappedComponent {...props} chatId={chatId} user={user} />
          </Grid>

          {/* Profile panel */}
          <Grid
            item
            md={4}
            lg={3}
            height={"100%"}
            sx={{
              display: { xs: "none", md: "block" },
              background: "linear-gradient(180deg, #0f172a 0%, #0d1f3c 100%)",
              borderLeft: "1px solid rgba(255,255,255,0.05)",
              overflowY: "auto",
            }}
          >
            <Profile user={user} />
          </Grid>
        </Grid>
      </>
    );
  };
};

// Skeleton loader for chat list
const ChatListSkeleton = () => (
  <Box p={2} display="flex" flexDirection="column" gap={1.5}>
    {Array.from({ length: 8 }).map((_, i) => (
      <Box key={i} display="flex" alignItems="center" gap={1.5} p={1}>
        <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
        <Box flex={1}>
          <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: "rgba(255,255,255,0.07)", mb: 0.5 }} />
          <Skeleton variant="text" width="40%" height={12} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
        </Box>
      </Box>
    ))}
  </Box>
);

export default AppLayout;

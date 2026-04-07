import { Drawer, Grid, Skeleton, Box } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  NEW_MESSAGE_ALERT, NEW_REQUEST, ONLINE_USERS, REFETCH_CHATS,
} from "../../constants/events";
import { useErrors, useSocketEvents } from "../../hooks/hook";
import { getOrSaveFromStorage } from "../../lib/features";
import { useMyChatsQuery } from "../../redux/api/api";
import { incrementNotification, setNewMessagesAlert } from "../../redux/reducers/chat";
import { setIsDeleteMenu, setIsMobile, setSelectedDeleteChat } from "../../redux/reducers/misc";
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

    const newMessageAlertListener = useCallback((data) => {
      if (data.chatId === chatId) return;
      dispatch(setNewMessagesAlert(data));
    }, [chatId]);

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

        {/* Mobile drawer - WhatsApp style */}
        {isLoading ? <Skeleton /> : (
          <Drawer
            open={isMobile}
            onClose={handleMobileClose}
            PaperProps={{
              sx: {
                bgcolor: "#ffffff",
                borderRight: "none",
                width: "85vw",
                maxWidth: 340,
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

        <Grid container height={"calc(100vh - 3.75rem)"} sx={{ overflow: "hidden" }}>
          {/* Sidebar — WhatsApp left panel */}
          <Grid
            item sm={4} md={3}
            sx={{
              display: { xs: "none", sm: "block" },
              bgcolor: "#ffffff",
              borderRight: "1px solid #e9edef",
            }}
            height={"100%"}
          >
            {isLoading ? <ChatListSkeleton /> : (
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
            item xs={12} sm={8} md={5} lg={6}
            height={"100%"}
            sx={{ bgcolor: "#efeae2", display: "flex", flexDirection: "column" }}
          >
            <WrappedComponent {...props} chatId={chatId} user={user} />
          </Grid>

          {/* Profile panel */}
          <Grid
            item md={4} lg={3}
            height={"100%"}
            sx={{
              display: { xs: "none", md: "block" },
              bgcolor: "#ffffff",
              borderLeft: "1px solid #e9edef",
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

const ChatListSkeleton = () => (
  <Box>
    {/* Search bar skeleton */}
    <Box sx={{ p: 1.5, bgcolor: "#f0f2f5" }}>
      <Skeleton variant="rounded" height={38} sx={{ borderRadius: "8px", bgcolor: "#e9edef" }} />
    </Box>
    {/* Chat items */}
    {Array.from({ length: 9 }).map((_, i) => (
      <Box key={i} display="flex" alignItems="center" gap={1.5} px={2} py={1.5}
        sx={{ borderBottom: "1px solid #f5f6f6" }}
      >
        <Skeleton variant="circular" width={50} height={50} sx={{ bgcolor: "#e9edef", flexShrink: 0 }} />
        <Box flex={1}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Skeleton variant="text" width="50%" height={14} sx={{ bgcolor: "#e9edef" }} />
            <Skeleton variant="text" width="20%" height={12} sx={{ bgcolor: "#e9edef" }} />
          </Box>
          <Skeleton variant="text" width="70%" height={12} sx={{ bgcolor: "#f5f6f6" }} />
        </Box>
      </Box>
    ))}
  </Box>
);

export default AppLayout;

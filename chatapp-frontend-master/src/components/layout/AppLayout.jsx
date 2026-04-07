import { Drawer, Grid, Skeleton, Box, IconButton, useMediaQuery, useTheme } from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  NEW_MESSAGE_ALERT, NEW_REQUEST, ONLINE_USERS, REFETCH_CHATS,
} from "../../constants/events";
import { useErrors, useSocketEvents } from "../../hooks/hook";
import { getOrSaveFromStorage } from "../../lib/features";
import { useMyChatsQuery } from "../../redux/api/api";
import { incrementNotification, setNewMessagesAlert, resetNotificationCount } from "../../redux/reducers/chat";
import { setIsDeleteMenu, setIsMobile, setSelectedDeleteChat, setIsSearch, setIsNotification, setIsNewGroup } from "../../redux/reducers/misc";
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
    const theme = useTheme();
    const isMobileScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const chatId = params.chatId;
    const deleteMenuAnchor = useRef(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const { isMobile } = useSelector((state) => state.misc);
    const { user } = useSelector((state) => state.auth);
    const { newMessagesAlert, notificationCount } = useSelector((state) => state.chat);

    const { isLoading, data, isError, error, refetch } = useMyChatsQuery("");

    useErrors([{ isError, error }]);

    useEffect(() => {
      getOrSaveFromStorage({ key: NEW_MESSAGE_ALERT, value: newMessagesAlert });
    }, [newMessagesAlert]);

    const handleDeleteChat = (e, cId, groupChat) => {
      dispatch(setIsDeleteMenu(true));
      dispatch(setSelectedDeleteChat({ chatId: cId, groupChat }));
      deleteMenuAnchor.current = e.currentTarget;
    };

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

    useSocketEvents(socket, {
      [NEW_MESSAGE_ALERT]: newMessageAlertListener,
      [NEW_REQUEST]: newRequestListener,
      [REFETCH_CHATS]: refetchListener,
      [ONLINE_USERS]: onlineUsersListener,
    });

    const friendChats = useMemo(
      () =>
        (data?.chats || []).filter(
          (chat) =>
            chat?.groupChat === false &&
            Array.isArray(chat?.members) &&
            chat.members.length > 0
        ),
      [data?.chats]
    );

    const chatListProps = {
      chats: friendChats,
      chatId,
      handleDeleteChat,
      newMessagesAlert,
      onlineUsers,
    };

    /* ── MOBILE LAYOUT ── */
    if (isMobileScreen) {
      return (
        <>
          <Title />
          <DeleteChatMenu dispatch={dispatch} deleteMenuAnchor={deleteMenuAnchor} />

          <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#ffffff" }}>

            {/* No chatId → show chat list */}
            {!chatId && (
              <>
                {/* Mobile top bar */}
                <Box sx={{
                  bgcolor: "#008069", px: 2, py: 1.25,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexShrink: 0, minHeight: "3.5rem",
                }}>
                  <Box sx={{
                    color: "white", fontWeight: 700, fontSize: "1.1rem",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                  }}>
                    ChatApp
                  </Box>
                  <Box sx={{ display: "flex" }}>
                    <IconButton size="small" onClick={() => dispatch(setIsSearch(true))}
                      sx={{ color: "rgba(255,255,255,0.85)" }}>
                      <SearchIcon />
                    </IconButton>
                    <IconButton size="small"
                      onClick={() => { dispatch(setIsNotification(true)); dispatch(resetNotificationCount()); }}
                      sx={{ color: "rgba(255,255,255,0.85)", position: "relative" }}>
                      <NotificationsIcon />
                      {notificationCount > 0 && (
                        <Box sx={{
                          position: "absolute", top: 5, right: 5,
                          width: 15, height: 15, borderRadius: "50%",
                          bgcolor: "#f02849", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          fontSize: "0.55rem", color: "white", fontWeight: 700,
                          pointerEvents: "none",
                        }}>
                          {notificationCount}
                        </Box>
                      )}
                    </IconButton>
                    <IconButton size="small" onClick={() => dispatch(setIsNewGroup(true))}
                      sx={{ color: "rgba(255,255,255,0.85)" }}>
                      <AddIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Chat list */}
                <Box sx={{ flex: 1, overflow: "hidden" }}>
                  {isLoading ? <ChatListSkeleton /> : (
                    <ChatList w="100%" {...chatListProps} />
                  )}
                </Box>
              </>
            )}

            {/* Has chatId → show chat full screen */}
            {chatId && (
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <WrappedComponent
                  {...props}
                  chatId={chatId}
                  user={user}
                  onBack={() => navigate("/")}
                  isMobile={true}
                />
              </Box>
            )}
          </Box>
        </>
      );
    }

    /* ── DESKTOP LAYOUT ── */
    return (
      <>
        <Title />
        <Header />
        <DeleteChatMenu dispatch={dispatch} deleteMenuAnchor={deleteMenuAnchor} />

        {/* Tablet drawer (sm screens with hamburger) */}
        {!isLoading && (
          <Drawer
            open={isMobile}
            onClose={() => dispatch(setIsMobile(false))}
            PaperProps={{ sx: { bgcolor: "#ffffff", width: "85vw", maxWidth: 340 } }}
          >
            <ChatList w="100%" {...chatListProps} />
          </Drawer>
        )}

        <Grid container height={"calc(100vh - 3.75rem)"} sx={{ overflow: "hidden" }}>
          {/* Sidebar */}
          <Grid item sm={4} md={3}
            sx={{ display: { xs: "none", sm: "block" }, bgcolor: "#ffffff", borderRight: "1px solid #e9edef" }}
            height={"100%"}
          >
            {isLoading ? <ChatListSkeleton /> : <ChatList {...chatListProps} />}
          </Grid>

          {/* Chat area */}
          <Grid item xs={12} sm={8} md={5} lg={6} height={"100%"}
            sx={{ bgcolor: "#efeae2", display: "flex", flexDirection: "column" }}>
            <WrappedComponent {...props} chatId={chatId} user={user} />
          </Grid>

          {/* Profile panel */}
          <Grid item md={4} lg={3} height={"100%"}
            sx={{ display: { xs: "none", md: "block" }, bgcolor: "#ffffff", borderLeft: "1px solid #e9edef", overflowY: "auto" }}>
            <Profile user={user} />
          </Grid>
        </Grid>
      </>
    );
  };
};

const ChatListSkeleton = () => (
  <Box>
    <Box sx={{ p: 1.5, bgcolor: "#f0f2f5" }}>
      <Skeleton variant="rounded" height={38} sx={{ borderRadius: "8px", bgcolor: "#e9edef" }} />
    </Box>
    {Array.from({ length: 9 }).map((_, i) => (
      <Box key={i} display="flex" alignItems="center" gap={1.5} px={2} py={1.5}
        sx={{ borderBottom: "1px solid #f5f6f6" }}>
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

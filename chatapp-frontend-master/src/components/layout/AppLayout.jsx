import { Drawer, Grid, Skeleton, Box, IconButton, useMediaQuery, useTheme, Avatar, Typography, Tooltip } from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Add as AddIcon,
  CallEnd as CallEndIcon,
  PhoneCallback as PhoneCallbackIcon,
} from "@mui/icons-material";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  NEW_MESSAGE_ALERT, NEW_REQUEST, ONLINE_USERS, REFETCH_CHATS,
  CALL_OFFER, CALL_ENDED,
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

// ── Global incoming call banner (shown on any page) ──────────────────────────
const GlobalIncomingCallBanner = ({ call, onAccept, onDecline }) => {
  if (!call) return null;
  return (
    <Box sx={{
      position: "fixed",
      // Mobile: stretch edge-to-edge with small margin; Desktop: centered
      top: { xs: 8, sm: 20 },
      left: { xs: 8, sm: "50%"  },
      right: { xs: 8, sm: "auto" },
      transform: { xs: "none", sm: "translateX(-50%)" },
      zIndex: 2000, bgcolor: "#1a3a2e",
      borderRadius: 3, px: { xs: 2, sm: 3 }, py: 2,
      display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 2 },
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      border: "1px solid rgba(0,168,132,0.3)",
      minWidth: { xs: 0, sm: 280 },
    }}>
      <Avatar sx={{ bgcolor: "#00a884", width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, fontSize: { xs: 16, sm: 20 }, flexShrink: 0 }}>
        {(call.from?.name || "?")[0].toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ color: "#fff", fontWeight: 700, fontSize: { xs: "0.85rem", sm: "0.95rem" }, lineHeight: 1.2 }}
          noWrap>
          {call.from?.name || "Someone"}
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>
          Incoming voice call…
        </Typography>
      </Box>
      <Tooltip title="Decline">
        <IconButton onClick={onDecline} size="small" sx={{
          bgcolor: "#f44336", color: "#fff", width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 },
          "&:hover": { bgcolor: "#d32f2f" },
        }}>
          <CallEndIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Accept">
        <IconButton onClick={onAccept} size="small" sx={{
          bgcolor: "#4caf50", color: "#fff", width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 },
          "&:hover": { bgcolor: "#388e3c" },
        }}>
          <PhoneCallbackIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

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

    // ── Global incoming call state (works on any page/chat) ──────────────────
    const [globalIncomingCall, setGlobalIncomingCall] = useState(null);
    const globalIncomingCallRef = useRef(null);
    useEffect(() => { globalIncomingCallRef.current = globalIncomingCall; }, [globalIncomingCall]);

    const globalCallOfferListener = useCallback((data) => {
      // Ignore if it's our own offer or we already have an incoming call
      if (data.from?._id === user?._id) return;
      if (globalIncomingCallRef.current) return;
      setGlobalIncomingCall({ chatId: data.chatId, offer: data.offer, from: data.from });
    }, [user?._id]);

    const globalCallEndedListener = useCallback((data) => {
      if (globalIncomingCallRef.current?.chatId === data.chatId) {
        setGlobalIncomingCall(null);
      }
    }, []);

    const handleGlobalDecline = useCallback(() => {
      if (globalIncomingCall) {
        socket.emit(CALL_ENDED, { chatId: globalIncomingCall.chatId, toUserId: globalIncomingCall.from._id });
        setGlobalIncomingCall(null);
      }
    }, [globalIncomingCall, socket]);

    const handleGlobalAccept = useCallback(() => {
      if (globalIncomingCall) {
        // Navigate to the chat — Chat.jsx will handle the WebRTC answer
        navigate("/chat/" + globalIncomingCall.chatId);
        setGlobalIncomingCall(null);
      }
    }, [globalIncomingCall, navigate]);

    useSocketEvents(socket, {
      [NEW_MESSAGE_ALERT]: newMessageAlertListener,
      [NEW_REQUEST]: newRequestListener,
      [REFETCH_CHATS]: refetchListener,
      [ONLINE_USERS]: onlineUsersListener,
      [CALL_OFFER]: globalCallOfferListener,
      [CALL_ENDED]: globalCallEndedListener,
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
          <GlobalIncomingCallBanner
            call={globalIncomingCall}
            onAccept={handleGlobalAccept}
            onDecline={handleGlobalDecline}
          />

          <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#ffffff", position: "fixed", inset: 0 }}>

            {/* No chatId → show chat list */}
            {!chatId && (
              <>
                {/* Mobile top bar */}
                <Box sx={{
                  bgcolor: "#008069", px: 2, py: 1.25,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  flexShrink: 0, minHeight: "3.5rem",
                  paddingTop: "max(1.25rem, calc(env(safe-area-inset-top) + 0.5rem))",
                  paddingLeft: "max(1rem, env(safe-area-inset-left))",
                  paddingRight: "max(1rem, env(safe-area-inset-right))",
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
                <Box sx={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
                  {isLoading ? <ChatListSkeleton /> : (
                    <ChatList w="100%" {...chatListProps} />
                  )}
                </Box>
              </>
            )}

            {/* Has chatId → show chat full screen */}
            {chatId && (
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
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
        <GlobalIncomingCallBanner
          call={globalIncomingCall}
          onAccept={handleGlobalAccept}
          onDecline={handleGlobalDecline}
        />
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

import { Drawer, Grid, alpha, useTheme } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { LayoutLoader } from "./Loaders";
import { uiTokens } from "../../design-system/tokens";

const AppLayout = () => (WrappedComponent) => {
  function AppLayoutWrapper(props) {
    const theme = useTheme();
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

    const handleDeleteChat = (e, selectedChatId, groupChat) => {
      dispatch(setIsDeleteMenu(true));
      dispatch(setSelectedDeleteChat({ chatId: selectedChatId, groupChat }));
      deleteMenuAnchor.current = e.currentTarget;
    };

    const handleMobileClose = () => dispatch(setIsMobile(false));

    const newMessageAlertListener = useCallback(
      (incoming) => {
        if (incoming.chatId === chatId) return;
        dispatch(setNewMessagesAlert(incoming));
      },
      [chatId, dispatch]
    );

    const newRequestListener = useCallback(() => {
      dispatch(incrementNotification());
    }, [dispatch]);

    const refetchListener = useCallback(() => {
      refetch();
      navigate("/");
    }, [refetch, navigate]);

    const onlineUsersListener = useCallback((list) => {
      setOnlineUsers(list);
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

        <DeleteChatMenu
          dispatch={dispatch}
          deleteMenuAnchor={deleteMenuAnchor}
        />

        {isLoading ? (
          <LayoutLoader />
        ) : (
          <Drawer open={isMobile} onClose={handleMobileClose}>
            <ChatList
              w="74vw"
              chats={data?.chats}
              chatId={chatId}
              handleDeleteChat={handleDeleteChat}
              newMessagesAlert={newMessagesAlert}
              onlineUsers={onlineUsers}
            />
          </Drawer>
        )}

        {isLoading ? (
          <LayoutLoader />
        ) : (
          <Grid container height="calc(100vh - 4rem)">
            <Grid
              item
              sm={4}
              md={3}
              sx={{
                display: { xs: "none", sm: "block" },
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? theme.palette.background.paper
                    : uiTokens.colors.surfaces.sidebar,
                borderRight: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
              }}
              height="100%"
            >
              <ChatList
                chats={data?.chats}
                chatId={chatId}
                handleDeleteChat={handleDeleteChat}
                newMessagesAlert={newMessagesAlert}
                onlineUsers={onlineUsers}
              />
            </Grid>
            <Grid
              item
              xs={12}
              sm={8}
              md={5}
              lg={6}
              height="100%"
              sx={{
                backgroundColor: theme.palette.background.default,
                borderRight: { md: `1px solid ${theme.palette.divider}` },
              }}
            >
              <WrappedComponent {...props} chatId={chatId} user={user} />
            </Grid>

            <Grid
              item
              md={4}
              lg={3}
              height="100%"
              sx={{
                display: { xs: "none", md: "block" },
                padding: "2rem",
                bgcolor:
                  theme.palette.mode === "dark"
                    ? uiTokens.colors.surfaces.profilePanel
                    : uiTokens.colors.surfaces.sidebarLight,
              }}
            >
              <Profile user={user} />
            </Grid>
          </Grid>
        )}
      </>
    );
  }

  AppLayoutWrapper.displayName = `AppLayout(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return AppLayoutWrapper;
};

export default AppLayout;

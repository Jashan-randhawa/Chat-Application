import {
  AppBar, Backdrop, Badge, Box, IconButton, Toolbar, Tooltip, Typography,
} from "@mui/material";
import React, { Suspense, lazy, useState } from "react";
import {
  Add as AddIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Group as GroupIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  MoreVert as MoreVertIcon,
  DonutLarge as StatusIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../constants/config";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { userNotExists } from "../../redux/reducers/auth";
import {
  setIsMobile, setIsNewGroup, setIsNotification, setIsSearch,
} from "../../redux/reducers/misc";
import { resetNotificationCount } from "../../redux/reducers/chat";

const SearchDialog = lazy(() => import("../specific/Search"));
const NotifcationDialog = lazy(() => import("../specific/Notifications"));
const NewGroupDialog = lazy(() => import("../specific/NewGroup"));

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isSearch, isNotification, isNewGroup } = useSelector((state) => state.misc);
  const { notificationCount } = useSelector((state) => state.chat);

  const handleMobile = () => dispatch(setIsMobile(true));
  const openSearch = () => dispatch(setIsSearch(true));
  const openNewGroup = () => dispatch(setIsNewGroup(true));
  const openNotification = () => {
    dispatch(setIsNotification(true));
    dispatch(resetNotificationCount());
  };
  const navigateToGroup = () => navigate("/groups");

  const logoutHandler = async () => {
    try {
      const { data } = await axios.get(`${server}/api/v1/user/logout`, { withCredentials: true });
      dispatch(userNotExists());
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }} height={"3.75rem"}>
        <AppBar
          position="static"
          elevation={0}
          sx={{
            background: "#008069",
            borderBottom: "none",
            height: "3.75rem",
          }}
        >
          <Toolbar sx={{ gap: 0.5, minHeight: "3.75rem !important", px: { xs: 1, sm: 2 }, paddingTop: "max(0px, env(safe-area-inset-top))" }}>
            {/* WhatsApp-style logo */}
            <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1, mr: 1 }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <ChatIcon sx={{ fontSize: 20, color: "white" }} />
              </Box>
              <Typography variant="h6" sx={{
                fontWeight: 700, fontSize: "1.15rem",
                color: "white", letterSpacing: "0.01em",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
              }}>
                ChatApp
              </Typography>
            </Box>

            {/* Mobile menu button */}
            <Box sx={{ display: { xs: "block", sm: "none" } }}>
              <IconButton
                aria-label="Open chat list menu"
                sx={{ color: "rgba(255,255,255,0.9)", width: 44, height: 44 }}
                onClick={handleMobile}
              >
                <MenuIcon />
              </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Action icons - WhatsApp style */}
            <Box sx={{ display: "flex", gap: 0, flexShrink: 0 }}>
              {/* Status + Groups hidden on phone — too many icons on small screens */}
              <Box sx={{ display: { xs: "none", sm: "flex" } }}>
                <WAIconBtn title={"Status"} icon={<StatusIcon />} onClick={() => {}} />
                <WAIconBtn title={"Groups"} icon={<GroupIcon />} onClick={navigateToGroup} />
              </Box>
              <WAIconBtn title={"New Chat"} icon={<AddIcon />} onClick={openNewGroup} />
              <WAIconBtn title={"Search"} icon={<SearchIcon />} onClick={openSearch} />
              <WAIconBtn
                title={"Notifications"} icon={<NotificationsIcon />}
                onClick={openNotification} value={notificationCount}
              />
              <WAIconBtn title={"Logout"} icon={<LogoutIcon />} onClick={logoutHandler} />
            </Box>
          </Toolbar>
        </AppBar>
      </Box>

      {isSearch && <Suspense fallback={<Backdrop open />}><SearchDialog /></Suspense>}
      {isNotification && <Suspense fallback={<Backdrop open />}><NotifcationDialog /></Suspense>}
      {isNewGroup && <Suspense fallback={<Backdrop open />}><NewGroupDialog /></Suspense>}
    </>
  );
};

const WAIconBtn = ({ title, icon, onClick, value }) => (
  <Tooltip title={title} arrow>
    <IconButton
      size="medium"
      onClick={onClick}
      aria-label={title}
      sx={{
        color: "rgba(255,255,255,0.85)",
        borderRadius: "50%",
        width: 44,
        height: 44,
        transition: "all 0.15s ease",
        "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.1)" },
      }}
    >
      {value ? (
        <Badge
          badgeContent={value}
          sx={{
            "& .MuiBadge-badge": {
              bgcolor: "#f02849",
              color: "white",
              fontWeight: 700,
              fontSize: "0.6rem",
              minWidth: 16,
              height: 16,
            },
          }}
        >
          {icon}
        </Badge>
      ) : icon}
    </IconButton>
  </Tooltip>
);

export default Header;

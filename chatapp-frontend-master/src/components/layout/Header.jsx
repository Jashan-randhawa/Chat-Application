// ============================================================
// REDESIGNED Header — dark premium nav bar
// Changes: dark bg, logo with icon, glass-morphism effect,
//          smooth hover states on icon buttons
// ============================================================

import {
  AppBar,
  Backdrop,
  Badge,
  Box,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { Suspense, lazy, useState } from "react";
import { orange } from "../../constants/color";
import {
  Add as AddIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Group as GroupIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  ChatBubble as ChatBubbleIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../constants/config";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { userNotExists } from "../../redux/reducers/auth";
import {
  setIsMobile,
  setIsNewGroup,
  setIsNotification,
  setIsSearch,
} from "../../redux/reducers/misc";
import { resetNotificationCount } from "../../redux/reducers/chat";

const SearchDialog = lazy(() => import("../specific/Search"));
const NotifcationDialog = lazy(() => import("../specific/Notifications"));
const NewGroupDialog = lazy(() => import("../specific/NewGroup"));

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isSearch, isNotification, isNewGroup } = useSelector(
    (state) => state.misc
  );
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
      const { data } = await axios.get(`${server}/api/v1/user/logout`, {
        withCredentials: true,
      });
      dispatch(userNotExists());
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <>
      <Box sx={{ flexGrow: 1 }} height={"4rem"}>
        <AppBar
          position="static"
          elevation={0}
          sx={{
            // Dark glass-morphism header
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Toolbar sx={{ gap: 1 }}>
            {/* Logo */}
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(14,165,233,0.4)",
                }}
              >
                <ChatBubbleIcon sx={{ fontSize: 16, color: "white" }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  letterSpacing: "-0.02em",
                  background: "linear-gradient(135deg, #e2e8f0, #94a3b8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Echo
                <span
                  style={{
                    background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Chat
                </span>
              </Typography>
            </Box>

            {/* Mobile menu button */}
            <Box sx={{ display: { xs: "block", sm: "none" } }}>
              <IconButton
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  "&:hover": { color: "white", bgcolor: "rgba(255,255,255,0.08)" },
                }}
                onClick={handleMobile}
              >
                <MenuIcon />
              </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Action icons */}
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <IconBtn title={"Search"} icon={<SearchIcon />} onClick={openSearch} />
              <IconBtn title={"New Group"} icon={<AddIcon />} onClick={openNewGroup} />
              <IconBtn title={"Manage Groups"} icon={<GroupIcon />} onClick={navigateToGroup} />
              <IconBtn
                title={"Notifications"}
                icon={<NotificationsIcon />}
                onClick={openNotification}
                value={notificationCount}
              />
              <IconBtn title={"Logout"} icon={<LogoutIcon />} onClick={logoutHandler} />
            </Box>
          </Toolbar>
        </AppBar>
      </Box>

      {isSearch && (
        <Suspense fallback={<Backdrop open />}>
          <SearchDialog />
        </Suspense>
      )}
      {isNotification && (
        <Suspense fallback={<Backdrop open />}>
          <NotifcationDialog />
        </Suspense>
      )}
      {isNewGroup && (
        <Suspense fallback={<Backdrop open />}>
          <NewGroupDialog />
        </Suspense>
      )}
    </>
  );
};

const IconBtn = ({ title, icon, onClick, value }) => {
  return (
    <Tooltip title={title} arrow>
      <IconButton
        size="medium"
        onClick={onClick}
        sx={{
          color: "rgba(255,255,255,0.65)",
          borderRadius: "10px",
          transition: "all 0.2s ease",
          "&:hover": {
            color: "white",
            bgcolor: "rgba(14,165,233,0.15)",
            transform: "translateY(-1px)",
          },
        }}
      >
        {value ? (
          <Badge
            badgeContent={value}
            sx={{
              "& .MuiBadge-badge": {
                background: "linear-gradient(135deg, #f43f5e, #e11d48)",
                color: "white",
                fontWeight: 700,
                fontSize: "0.65rem",
                minWidth: 16,
                height: 16,
                borderRadius: "8px",
              },
            }}
          >
            {icon}
          </Badge>
        ) : (
          icon
        )}
      </IconButton>
    </Tooltip>
  );
};

export default Header;

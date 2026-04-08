import {
  Avatar, Button, Dialog, DialogTitle, ListItem, Skeleton,
  Stack, Box, Typography, IconButton,
} from "@mui/material";
import {
  NotificationsNone as NotificationsNoneIcon,
  Close as CloseIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import React, { memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAsyncMutation, useErrors } from "../../hooks/hook";
import { useAcceptFriendRequestMutation, useGetNotificationsQuery } from "../../redux/api/api";
import { setIsNotification } from "../../redux/reducers/misc";
import { transformImage } from "../../lib/features";

const Notifications = () => {
  const { isNotification } = useSelector((state) => state.misc);
  const dispatch = useDispatch();
  const { isLoading, data, error, isError } = useGetNotificationsQuery();
  const [acceptRequest] = useAsyncMutation(useAcceptFriendRequestMutation);

  const friendRequestHandler = async ({ _id, accept }) => {
    dispatch(setIsNotification(false));
    await acceptRequest("Processing...", { requestId: _id, accept });
  };

  const closeHandler = () => dispatch(setIsNotification(false));
  useErrors([{ error, isError }]);

  return (
    <Dialog
      open={isNotification}
      onClose={closeHandler}
      PaperProps={{
        sx: {
          borderRadius: { xs: "16px 16px 0 0", sm: "12px" },
          width: "100%",
          width: "100%",
          maxWidth: { xs: "100%", sm: 420 },
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          m: { xs: 0, sm: 2 },
          position: { xs: "fixed", sm: "relative" },
          bottom: { xs: 0, sm: "auto" },
          maxHeight: { xs: "85vh", sm: "auto" },
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* WA-style header */}
      <Box sx={{ bgcolor: "#008069", px: 2.5, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{
          color: "white", fontWeight: 600, fontSize: "1rem",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
          Notifications
        </Typography>
        <IconButton onClick={closeHandler} size="small"
          sx={{ color: "rgba(255,255,255,0.8)", "&:hover": { color: "white" } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{
        flex: 1,
        overflowY: "auto",
        maxHeight: { xs: "70vh", sm: 400 },
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": { bgcolor: "#d1d7db", borderRadius: 4 },
      }}>
        {isLoading ? (
          <Stack spacing={0}>
            {[1, 2, 3].map(i => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5, borderBottom: "1px solid #f5f6f6" }}>
                <Skeleton variant="circular" width={46} height={46} sx={{ bgcolor: "#e9edef", flexShrink: 0 }} />
                <Box flex={1}>
                  <Skeleton variant="text" width="70%" sx={{ bgcolor: "#e9edef" }} />
                  <Skeleton variant="text" width="40%" sx={{ bgcolor: "#f0f0f0" }} />
                </Box>
              </Box>
            ))}
          </Stack>
        ) : data?.allRequests?.length > 0 ? (
          data.allRequests.map(({ sender, _id }) => (
            <NotificationItem sender={sender} _id={_id} handler={friendRequestHandler} key={_id} />
          ))
        ) : (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <NotificationsNoneIcon sx={{ fontSize: 40, color: "#d1d7db", mb: 1 }} />
            <Typography sx={{ color: "#8696a0", fontSize: "0.875rem",
              fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              No new notifications
            </Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  );
};

const NotificationItem = memo(({ sender, _id, handler }) => {
  const { name, avatar } = sender;
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1.5,
      px: 2, py: 1.5,
      borderBottom: "1px solid #f5f6f6",
      "&:hover": { bgcolor: "#f5f6f6" },
      transition: "background 0.12s ease",
    }}>
      <Avatar
        src={transformImage(avatar?.[0])}
        sx={{
          width: 46, height: 46, flexShrink: 0,
          border: "2px solid #e9edef",
        }}
      />
      <Typography sx={{
        flex: 1, color: "#111b21", fontSize: "0.875rem",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        lineHeight: 1.4,
      }}>
        <span style={{ fontWeight: 600 }}>{name}</span>
        {" "}sent you a friend request.
      </Typography>
      <Stack direction="row" gap={0.75} flexShrink={0}>
        <IconButton
          onClick={() => handler({ _id, accept: true })}
          size="small"
          sx={{
            bgcolor: "#e7f8f4", color: "#00a884",
            width: 32, height: 32,
            "&:hover": { bgcolor: "#00a884", color: "white" },
            transition: "all 0.15s ease",
          }}
        >
          <CheckIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          onClick={() => handler({ _id, accept: false })}
          size="small"
          sx={{
            bgcolor: "#fef0f0", color: "#ef4444",
            width: 32, height: 32,
            "&:hover": { bgcolor: "#ef4444", color: "white" },
            transition: "all 0.15s ease",
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Box>
  );
});

export default Notifications;

// ============================================================
// REDESIGNED Notifications dialog — dark themed, polished
// Changes: gradient avatar ring, accept/reject styled buttons,
//          empty state, smooth request items
// ============================================================

import {
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  ListItem,
  Skeleton,
  Stack,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import {
  NotificationsNone as NotificationsNoneIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Close as RejectIcon,
} from "@mui/icons-material";
import React, { memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAsyncMutation, useErrors } from "../../hooks/hook";
import {
  useAcceptFriendRequestMutation,
  useGetNotificationsQuery,
} from "../../redux/api/api";
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
          borderRadius: "20px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          minWidth: { xs: "90vw", sm: "420px" },
          overflow: "hidden",
        },
      }}
    >
      <Stack p={"1.5rem"} spacing={2}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
            Notifications
          </Typography>
          <IconButton
            onClick={closeHandler}
            size="small"
            sx={{ color: "rgba(148,163,184,0.6)", "&:hover": { color: "#f1f5f9", bgcolor: "rgba(255,255,255,0.06)" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Content */}
        <Box sx={{ maxHeight: 400, overflowY: "auto",
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 4 },
        }}>
          {isLoading ? (
            <Stack spacing={1.5} p={1}>
              {[1,2,3].map(i => (
                <Box key={i} sx={{ display:"flex", alignItems:"center", gap:1.5 }}>
                  <Skeleton variant="circular" width={44} height={44} sx={{ bgcolor:"rgba(255,255,255,0.07)" }} />
                  <Box flex={1}>
                    <Skeleton variant="text" width="70%" sx={{ bgcolor:"rgba(255,255,255,0.07)" }} />
                    <Skeleton variant="text" width="40%" sx={{ bgcolor:"rgba(255,255,255,0.05)" }} />
                  </Box>
                </Box>
              ))}
            </Stack>
          ) : data?.allRequests.length > 0 ? (
            data?.allRequests?.map(({ sender, _id }) => (
              <NotificationItem
                sender={sender}
                _id={_id}
                handler={friendRequestHandler}
                key={_id}
              />
            ))
          ) : (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <NotificationsNoneIcon sx={{ fontSize: 40, color: "rgba(255,255,255,0.15)", mb: 1 }} />
              <Typography sx={{ color: "rgba(148,163,184,0.5)", fontSize: "0.85rem" }}>
                No new notifications
              </Typography>
            </Box>
          )}
        </Box>
      </Stack>
    </Dialog>
  );
};

const NotificationItem = memo(({ sender, _id, handler }) => {
  const { name, avatar } = sender;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.25,
        borderRadius: "12px",
        transition: "background 0.15s ease",
        "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
      }}
    >
      {/* Avatar */}
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <Box sx={{
          position: "absolute",
          inset: -2,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
          opacity: 0.5,
        }} />
        <Avatar
          src={transformImage(avatar?.[0])}
          sx={{ width: 40, height: 40, position: "relative", border: "2px solid #0f172a" }}
        />
      </Box>

      {/* Text */}
      <Typography
        sx={{
          flex: 1,
          color: "rgba(226,232,240,0.85)",
          fontSize: "0.85rem",
          lineHeight: 1.4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{name}</span>
        {" "}sent you a friend request.
      </Typography>

      {/* Actions */}
      <Stack direction="row" gap={0.5} flexShrink={0}>
        <IconButton
          onClick={() => handler({ _id, accept: true })}
          size="small"
          sx={{
            bgcolor: "rgba(34,197,94,0.12)",
            color: "#22c55e",
            borderRadius: "8px",
            "&:hover": { bgcolor: "rgba(34,197,94,0.22)" },
          }}
        >
          <CheckIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          onClick={() => handler({ _id, accept: false })}
          size="small"
          sx={{
            bgcolor: "rgba(244,63,94,0.12)",
            color: "#f43f5e",
            borderRadius: "8px",
            "&:hover": { bgcolor: "rgba(244,63,94,0.22)" },
          }}
        >
          <RejectIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
    </Box>
  );
});

export default Notifications;

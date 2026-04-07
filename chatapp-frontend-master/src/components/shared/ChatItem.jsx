/* eslint-disable react/prop-types */
import { memo } from "react";
import { Box, Chip, Stack, Typography, alpha, keyframes, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { Link } from "../styles/StyledComponents";
import AvatarCard from "./AvatarCard";

const pulseOnline = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(34,193,195,0.55); }
  100% { box-shadow: 0 0 0 8px rgba(34,193,195,0); }
`;

const ChatItem = ({
  avatar = [],
  name,
  _id,
  groupChat = false,
  sameSender,
  isOnline,
  newMessageAlert,
  index = 0,
  handleDeleteChat,
}) => {
  const theme = useTheme();
  const unreadCount = newMessageAlert?.count || 0;

  return (
    <Link
      sx={{
        padding: "0.25rem 0.65rem",
      }}
      to={`/chat/${_id}`}
      onContextMenu={(e) => handleDeleteChat(e, _id, groupChat)}
      aria-label={`Open chat ${name}`}
    >
      <motion.div
        initial={{ opacity: 0, y: "-14%" }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 * index }}
        style={{
          display: "flex",
          gap: "0.85rem",
          alignItems: "center",
          background: sameSender
            ? `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.28)}, ${alpha(
                theme.palette.secondary.main,
                0.2
              )})`
            : "rgba(255,255,255,0.03)",
          borderLeft: sameSender
            ? `3px solid ${theme.palette.primary.main}`
            : "3px solid transparent",
          color: "#e9eeff",
          position: "relative",
          padding: "0.8rem",
          borderRadius: "0.85rem",
        }}
      >
        <AvatarCard avatar={avatar} name={name} />

        <Stack sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "0.96rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "10rem",
            }}
          >
            {name}
          </Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              size="small"
              sx={{
                mt: 0.35,
                width: "fit-content",
                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                color: alpha(theme.palette.primary.contrastText, 0.9),
                fontWeight: 600,
              }}
            />
          )}
        </Stack>

        {isOnline && (
          <Box
            sx={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              backgroundColor: theme.palette.secondary.main,
              position: "absolute",
              top: "50%",
              right: "0.9rem",
              transform: "translateY(-50%)",
              animation: `${pulseOnline} 1.35s infinite`,
            }}
          />
        )}
      </motion.div>
    </Link>
  );
};

export default memo(ChatItem);

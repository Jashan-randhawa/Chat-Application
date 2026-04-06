/* eslint-disable react/prop-types */
import { memo } from "react";
import { Link } from "../styles/StyledComponents";
import { Box, Chip, Stack, Typography, keyframes } from "@mui/material";
import AvatarCard from "./AvatarCard";
import { motion } from "framer-motion";

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
  const unreadCount = newMessageAlert?.count || 0;

  return (
    <Link
      sx={{
        padding: "0.25rem 0.65rem",
      }}
      to={`/chat/${_id}`}
      onContextMenu={(e) => handleDeleteChat(e, _id, groupChat)}
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
            ? "linear-gradient(120deg, rgba(108,99,255,0.28), rgba(34,193,195,0.2))"
            : "rgba(255,255,255,0.03)",
          borderLeft: sameSender ? "3px solid #6c63ff" : "3px solid transparent",
          color: "#e9eeff",
          position: "relative",
          padding: "0.8rem",
          borderRadius: "0.85rem",
        }}
      >
        <AvatarCard avatar={avatar} />

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
                backgroundColor: "rgba(108,99,255,0.2)",
                color: "#dbe0ff",
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
              backgroundColor: "#22c1c3",
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

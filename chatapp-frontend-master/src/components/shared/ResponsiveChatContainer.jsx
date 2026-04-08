import React, { forwardRef } from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import moment from "moment";
import MessageComponent from "./MessageComponent";
import { TypingLoader } from "../layout/Loaders";

const MESSAGE_GROUPING_THRESHOLD_MINUTES = 3;

/**
 * Groups an array of messages into { dateLabel, messages[] } buckets.
 * Consecutive messages from the same sender are marked with
 * `isGrouped: true` (not the first in a run) so MessageComponent
 * can suppress the sender name / tail on grouped bubbles.
 */
const buildGroups = (messages) => {
  if (!messages || messages.length === 0) return [];

  const buckets = [];
  let currentDate = null;
  let currentBucket = null;

  messages.forEach((msg, idx) => {
    const dateLabel = getDateLabel(msg.createdAt);
    if (dateLabel !== currentDate) {
      currentDate = dateLabel;
      currentBucket = { dateLabel, messages: [] };
      buckets.push(currentBucket);
    }

    const prevMsg = idx > 0 ? messages[idx - 1] : null;
    const isGrouped =
      prevMsg &&
      prevMsg.sender?._id === msg.sender?._id &&
      // Only group if within the threshold of the previous message
      moment(msg.createdAt).diff(moment(prevMsg.createdAt), "minutes") < MESSAGE_GROUPING_THRESHOLD_MINUTES &&
      getDateLabel(prevMsg.createdAt) === dateLabel;

    const nextMsg = idx < messages.length - 1 ? messages[idx + 1] : null;
    const isLast =
      !nextMsg ||
      nextMsg.sender?._id !== msg.sender?._id ||
      moment(nextMsg.createdAt).diff(moment(msg.createdAt), "minutes") >= MESSAGE_GROUPING_THRESHOLD_MINUTES ||
      getDateLabel(nextMsg.createdAt) !== dateLabel;

    currentBucket.messages.push({ ...msg, isGrouped: !!isGrouped, isLast });
  });

  return buckets;
};

const getDateLabel = (dateStr) => {
  if (!dateStr) return "Unknown";
  const d = moment(dateStr);
  const today = moment().startOf("day");
  const yesterday = moment().subtract(1, "days").startOf("day");
  if (d.isSameOrAfter(today)) return "Today";
  if (d.isSameOrAfter(yesterday)) return "Yesterday";
  return d.format("MMMM D, YYYY");
};

/* ── Date Separator ────────────────────────────────────────────────────────── */
const DateSeparator = ({ label }) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      my: 1,
    }}
  >
    <Box
      sx={{
        bgcolor: "rgba(225,245,254,0.92)",
        borderRadius: "8px",
        px: 2,
        py: 0.35,
        boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
      }}
    >
      <Typography
        sx={{
          fontSize: { xs: "0.7rem", sm: "0.72rem" },
          color: "#54656f",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontWeight: 500,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </Typography>
    </Box>
  </Box>
);

/* ── WhatsApp chat background SVG ──────────────────────────────────────────── */
const WA_BG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cfc4b0' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

/**
 * ResponsiveChatContainer
 *
 * Props:
 *  messages      – flat array of all messages
 *  user          – current user object
 *  containerRef  – ref forwarded to the scrollable container
 *  bottomRef     – ref for the scroll anchor div at the bottom
 *  userTyping    – boolean: show typing indicator
 */
const ResponsiveChatContainer = forwardRef(
  ({ messages = [], user, containerRef, bottomRef, userTyping = false }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    const buckets = buildGroups(messages);

    return (
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflowX: "hidden",
          overflowY: "auto",
          minHeight: 0,
          background: "#efeae2",
          backgroundImage: WA_BG,
          display: "flex",
          flexDirection: "column",
          /* Responsive padding: tighter on mobile */
          px: { xs: "3%", sm: "5%", md: "6%" },
          py: { xs: "0.5rem", sm: "0.75rem" },
          /* Safe area (notched devices) */
          paddingLeft: `max(3%, env(safe-area-inset-left))`,
          /* Thin scrollbar on desktop */
          "&::-webkit-scrollbar": { width: { xs: 0, sm: 5 } },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(0,0,0,0.15)",
            borderRadius: 3,
          },
          WebkitOverflowScrolling: "touch",
        }}
      >
        {buckets.map((bucket) => (
          <Box key={bucket.dateLabel}>
            <DateSeparator label={bucket.dateLabel} />
            {bucket.messages.map((msg) => (
              <Box
                key={msg._id}
                sx={{
                  mb: msg.isLast
                    ? { xs: "0.35rem", sm: "0.4rem" }
                    : { xs: "0.1rem", sm: "0.12rem" },
                }}
              >
                <MessageComponent
                  message={msg}
                  user={user}
                  isGrouped={msg.isGrouped}
                  isLast={msg.isLast}
                  isMobile={isMobile}
                />
              </Box>
            ))}
          </Box>
        ))}

        {userTyping && <TypingLoader />}
        <div ref={bottomRef} />
      </Box>
    );
  }
);

ResponsiveChatContainer.displayName = "ResponsiveChatContainer";

export default ResponsiveChatContainer;

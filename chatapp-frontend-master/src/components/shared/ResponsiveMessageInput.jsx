import React, { useRef, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  Send as SendIcon,
  EmojiEmotions as EmojiIcon,
  Mic as MicIcon,
  Stop as StopIcon,
} from "@mui/icons-material";

const MAX_CHARS = 4096;

/**
 * ResponsiveMessageInput
 *
 * Props:
 *  message          – current text value
 *  onMessageChange  – onChange handler (receives event)
 *  onSubmit         – form submit / send handler
 *  onFileOpen       – click handler for attachment button
 *  isRecording      – boolean: voice note in progress
 *  onStartRecording – start voice note
 *  onStopRecording  – stop voice note
 *  recordingSeconds – seconds elapsed during recording
 *  userTyping       – boolean: peer is typing (shows typing pill)
 */
const ResponsiveMessageInput = ({
  message = "",
  onMessageChange,
  onSubmit,
  onFileOpen,
  isRecording = false,
  onStartRecording,
  onStopRecording,
  recordingSeconds = 0,
  userTyping = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const textareaRef = useRef(null);
  const charCount = message.length;
  const showCounter = charCount > MAX_CHARS * 0.8;
  const isOverLimit = charCount > MAX_CHARS;

  /* ── Auto-resize textarea ────────────────────────────────────────────── */
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Cap at ~5 lines (≈120 px)
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [message, resizeTextarea]);

  /* ── Keyboard: Enter sends, Shift+Enter adds newline ─────────────────── */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isOverLimit) onSubmit(e);
    }
  };

  const handleSendClick = (e) => {
    e.preventDefault();
    if (!isOverLimit) onSubmit(e);
  };

  const hasMsgText = message.trim().length > 0;

  return (
    <Box
      sx={{
        bgcolor: "#f0f2f5",
        px: { xs: 0.5, sm: 1 },
        py: { xs: 0.5, sm: 0.75 },
        flexShrink: 0,
        position: "sticky",
        bottom: 0,
        zIndex: 10,
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(0.25rem, env(safe-area-inset-left))",
        paddingRight: "max(0.25rem, env(safe-area-inset-right))",
      }}
    >
      {/* Peer typing indicator */}
      {userTyping && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: 2,
            pb: 0.5,
          }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 0.4,
              bgcolor: "rgba(0,168,132,0.12)",
              borderRadius: "12px",
              px: 1.5,
              py: 0.4,
            }}
          >
            {[0, 1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  bgcolor: "#00a884",
                  animation: "bounce 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                  "@keyframes bounce": {
                    "0%, 80%, 100%": { transform: "translateY(0)" },
                    "40%": { transform: "translateY(-4px)" },
                  },
                }}
              />
            ))}
          </Box>
          <Typography
            sx={{
              fontSize: "0.72rem",
              color: "#8696a0",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          >
            typing…
          </Typography>
        </Box>
      )}

      {/* Main input row */}
      <Box
        component="form"
        onSubmit={handleSendClick}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: { xs: 0.5, sm: 0.75 },
        }}
      >
        {/* Input bubble */}
        <Box
          sx={{
            display: "flex",
            bgcolor: "#ffffff",
            borderRadius: "24px",
            flex: 1,
            alignItems: "flex-end",
            px: { xs: 0.5, sm: 1 },
            py: 0.25,
            minHeight: { xs: "48px", sm: "44px" },
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
            transition: "box-shadow 0.15s",
            "&:focus-within": {
              boxShadow: "0 0 0 2px rgba(0,168,132,0.35), 0 1px 2px rgba(0,0,0,0.08)",
            },
          }}
        >
          {/* Emoji */}
          <Tooltip title="Emoji">
            <IconButton
              size="small"
              aria-label="Open emoji picker"
              sx={{
                color: "#54656f",
                flexShrink: 0,
                width: { xs: 44, sm: 40 },
                height: { xs: 44, sm: 40 },
                mb: 0.25,
              }}
            >
              <EmojiIcon sx={{ fontSize: { xs: 22, sm: 20 } }} />
            </IconButton>
          </Tooltip>

          {/* Attach */}
          <Tooltip title="Attach file">
            <IconButton
              onClick={onFileOpen}
              size="small"
              aria-label="Attach file"
              sx={{
                color: "#54656f",
                flexShrink: 0,
                width: { xs: 44, sm: 40 },
                height: { xs: 44, sm: 40 },
                mb: 0.25,
              }}
            >
              <AttachFileIcon
                sx={{ fontSize: { xs: 22, sm: 20 }, transform: "rotate(45deg)" }}
              />
            </IconButton>
          </Tooltip>

          {/* Auto-expanding textarea */}
          <Box sx={{ flex: 1, minWidth: 0, py: 0.75, pr: 0.5, display: "flex", flexDirection: "column" }}>
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="Type a message"
              value={message}
              onChange={(e) => {
                onMessageChange(e);
                resizeTextarea();
              }}
              onKeyDown={handleKeyDown}
              aria-label="Type a message"
              aria-multiline="true"
              style={{
                width: "100%",
                resize: "none",
                border: "none",
                outline: "none",
                background: "transparent",
                /* 16px min on mobile prevents iOS auto-zoom */
                fontSize: isMobile ? "16px" : "0.9375rem",
                fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
                color: "#111b21",
                lineHeight: 1.5,
                overflowY: "hidden",
                padding: 0,
                display: "block",
              }}
            />

            {/* Character counter */}
            {showCounter && (
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  color: isOverLimit ? "#f15c6d" : "#8696a0",
                  alignSelf: "flex-end",
                  lineHeight: 1,
                  mt: 0.25,
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}
              >
                {charCount}/{MAX_CHARS}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Send / Mic button */}
        <Box
          component={hasMsgText || isRecording ? "button" : "div"}
          onClick={
            hasMsgText
              ? handleSendClick
              : isRecording
              ? onStopRecording
              : onStartRecording
          }
          type={hasMsgText || isRecording ? "button" : undefined}
          role={!hasMsgText && !isRecording ? "button" : undefined}
          tabIndex={0}
          aria-label={
            hasMsgText
              ? "Send message"
              : isRecording
              ? "Stop voice recording"
              : "Start voice recording"
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (hasMsgText) handleSendClick(e);
              else if (isRecording) onStopRecording();
              else onStartRecording();
            }
          }}
          sx={{
            width: { xs: 48, sm: 44 },
            height: { xs: 48, sm: 44 },
            borderRadius: "50%",
            bgcolor: isRecording ? "#f15c6d" : "#00a884",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            border: "none",
            flexShrink: 0,
            transition: "background 0.15s ease, transform 0.1s ease",
            "&:hover": { bgcolor: isRecording ? "#e04a5a" : "#008069" },
            "&:active": { transform: "scale(0.93)" },
            touchAction: "manipulation",
          }}
        >
          {hasMsgText ? (
            <SendIcon sx={{ fontSize: { xs: 22, sm: 20 }, color: "white", ml: "2px" }} />
          ) : isRecording ? (
            <StopIcon sx={{ fontSize: { xs: 22, sm: 20 }, color: "white" }} />
          ) : (
            <MicIcon sx={{ fontSize: { xs: 22, sm: 20 }, color: "white" }} />
          )}
        </Box>
      </Box>

      {/* Recording timer */}
      {isRecording && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            mt: 0.5,
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "#f15c6d",
              animation: "pulse 1s ease-in-out infinite",
              "@keyframes pulse": {
                "0%, 100%": { opacity: 1 },
                "50%": { opacity: 0.3 },
              },
            }}
          />
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: "#f15c6d",
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            {`${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, "0")}`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ResponsiveMessageInput;

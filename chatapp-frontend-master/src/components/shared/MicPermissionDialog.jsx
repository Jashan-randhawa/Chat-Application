import React from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box,
} from "@mui/material";
import { Mic as MicIcon, Settings as SettingsIcon } from "@mui/icons-material";

/**
 * MicPermissionDialog
 *
 * Props:
 *   open        – boolean
 *   onAllow     – async fn → called when user taps "Allow" (triggers getUserMedia)
 *   onDismiss   – fn → called when user taps "Cancel"
 *   denied      – boolean – true when permission is already hard-denied (show settings hint)
 *   error       – string | null – error message to show
 */
const MicPermissionDialog = ({ open, onAllow, onDismiss, denied = false, error = null }) => (
  <Dialog
    open={open}
    onClose={onDismiss}
    PaperProps={{
      sx: {
        borderRadius: 3,
        maxWidth: 340,
        width: "90vw",
        mx: "auto",
      },
    }}
  >
    <DialogTitle sx={{ pb: 0, pt: 3, textAlign: "center" }}>
      <Box
        sx={{
          width: 64, height: 64, borderRadius: "50%",
          bgcolor: denied ? "#fff3e0" : "#e8f5e9",
          display: "flex", alignItems: "center", justifyContent: "center",
          mx: "auto", mb: 1.5,
        }}
      >
        {denied
          ? <SettingsIcon sx={{ fontSize: 34, color: "#f57c00" }} />
          : <MicIcon sx={{ fontSize: 34, color: "#00a884" }} />}
      </Box>
      <Typography variant="h6" fontWeight={700} sx={{ fontSize: "1rem" }}>
        {denied ? "Microphone Blocked" : "Microphone Access Needed"}
      </Typography>
    </DialogTitle>

    <DialogContent sx={{ pt: 1, pb: 1, textAlign: "center" }}>
      {denied || error ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
          {error ||
            "Microphone access was denied. To make calls or send voice notes, please allow microphone access in your device settings."}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
          ChatApp needs your microphone to make voice calls and record voice messages.
          Tap <strong>Allow</strong> when your browser asks for permission.
        </Typography>
      )}
    </DialogContent>

    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, justifyContent: "center" }}>
      <Button
        onClick={onDismiss}
        variant="outlined"
        sx={{ borderRadius: 2, flex: 1, textTransform: "none" }}
      >
        {denied ? "Not Now" : "Cancel"}
      </Button>
      {denied ? (
        /* Deep-link to Android app settings – works in Chrome and most WebViews */
        <Button
          variant="contained"
          onClick={() => {
            // Try to open Android app info page (works in Capacitor/TWA)
            if (window.AndroidBridge?.openSettings) {
              window.AndroidBridge.openSettings();
            } else {
              // Fallback: re-prompt (the OS will show the "already denied" state)
              onAllow();
            }
            onDismiss();
          }}
          sx={{ borderRadius: 2, flex: 1, bgcolor: "#f57c00", textTransform: "none", "&:hover": { bgcolor: "#e65100" } }}
        >
          Open Settings
        </Button>
      ) : (
        <Button
          onClick={onAllow}
          variant="contained"
          sx={{ borderRadius: 2, flex: 1, bgcolor: "#00a884", textTransform: "none", "&:hover": { bgcolor: "#008069" } }}
        >
          Allow
        </Button>
      )}
    </DialogActions>
  </Dialog>
);

export default MicPermissionDialog;

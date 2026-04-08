import {
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import {
  Logout as LogoutIcon,
  WarningAmber as WarningIcon,
} from "@mui/icons-material";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import toast from "react-hot-toast";
import { userNotExists } from "../../redux/reducers/auth";
import { setIsLogout } from "../../redux/reducers/misc";
import { server } from "../../constants/config";
import ResponsiveDialog from "./ResponsiveDialog";

const LogoutDialog = () => {
  const { isLogout } = useSelector((state) => state.misc);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const closeHandler = () => dispatch(setIsLogout(false));

  const logoutHandler = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${server}/api/v1/user/logout`, {
        withCredentials: true,
      });
      dispatch(userNotExists());
      dispatch(setIsLogout(false));
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const paperSx = {
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
  };

  return (
    <ResponsiveDialog
      open={isLogout}
      onClose={closeHandler}
      drawerProps={{ PaperProps: { sx: paperSx } }}
      dialogProps={{
        PaperProps: {
          sx: { ...paperSx, maxWidth: 380, borderRadius: "16px" },
        },
      }}
    >
      <Box
        sx={{
          p: { xs: "1.5rem", sm: "2rem" },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        {/* Warning icon */}
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            bgcolor: "#fff3e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WarningIcon sx={{ fontSize: 32, color: "#f57c00" }} />
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#111b21",
            fontSize: "1.1rem",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}
        >
          Log out?
        </Typography>

        {/* Warning text */}
        <Typography
          sx={{
            color: "#54656f",
            fontSize: "0.9rem",
            textAlign: "center",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
            lineHeight: 1.5,
          }}
        >
          Are you sure you want to log out? You will need to log in again to
          access your chats.
        </Typography>

        {/* Actions */}
        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            width: "100%",
            mt: 0.5,
            flexDirection: { xs: "column-reverse", sm: "row" },
          }}
        >
          <Button
            fullWidth
            onClick={closeHandler}
            disabled={isLoading}
            variant="outlined"
            sx={{
              borderColor: "#d1d7db",
              color: "#54656f",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              minHeight: 44,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              "&:hover": { borderColor: "#aebac1", bgcolor: "#f5f6f6" },
            }}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={logoutHandler}
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <LogoutIcon sx={{ fontSize: 18 }} />
              )
            }
            sx={{
              bgcolor: "#ef4444",
              color: "white",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              minHeight: 44,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
              boxShadow: "0 2px 8px rgba(239,68,68,0.3)",
              "&:hover": { bgcolor: "#dc2626" },
              "&:disabled": { bgcolor: "rgba(239,68,68,0.5)", color: "white" },
            }}
          >
            {isLoading ? "Logging out..." : "Log out"}
          </Button>
        </Box>
      </Box>
    </ResponsiveDialog>
  );
};

export default LogoutDialog;

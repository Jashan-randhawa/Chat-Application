import { useFileHandler, useInputValidation } from "6pp";
import { CameraAlt as CameraAltIcon } from "@mui/icons-material";
import {
  Avatar, Box, Button, Container, IconButton, Stack, TextField, Typography,
} from "@mui/material";
import axios from "axios";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { VisuallyHiddenInput } from "../components/styles/StyledComponents";
import { server } from "../constants/config";
import { userExists } from "../redux/reducers/auth";
import { usernameValidator } from "../utils/validators";
import { motion, AnimatePresence } from "framer-motion";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const toggleLogin = () => setIsLogin((prev) => !prev);

  const name = useInputValidation("");
  const bio = useInputValidation("");
  const username = useInputValidation("", usernameValidator);
  const password = useInputValidation("");
  const avatar = useFileHandler("single");
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Logging in...");
    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${server}/api/v1/user/login`,
        { username: username.value, password: password.value },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      dispatch(userExists(data.user));
      toast.success(data.message, { id: toastId });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something Went Wrong", { id: toastId });
    } finally { setIsLoading(false); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Creating account...");
    setIsLoading(true);
    const formData = new FormData();
    formData.append("avatar", avatar.file);
    formData.append("name", name.value);
    formData.append("bio", bio.value);
    formData.append("username", username.value);
    formData.append("password", password.value);
    try {
      const { data } = await axios.post(`${server}/api/v1/user/new`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(userExists(data.user));
      toast.success(data.message, { id: toastId });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something Went Wrong", { id: toastId });
    } finally { setIsLoading(false); }
  };

  return (
    <Box sx={{
      minHeight: "100dvh",
      bgcolor: "#f0f2f5",
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      overscrollBehavior: "none",
      paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {/* Green top section */}
      <Box sx={{ width: "100%", height: { xs: 160, sm: 200 }, bgcolor: "#008069", flexShrink: 0 }} />

      {/* Card — floats over the green */}
      <Box sx={{ mt: { xs: "-5rem", sm: "-6rem" }, px: 2, pb: 4, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Logo */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2.5 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: "50%",
            bgcolor: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            mb: 1,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
          }}>
            <Box sx={{ fontSize: 32 }}>💬</Box>
          </Box>
          <Typography sx={{
            fontWeight: 700, fontSize: "1.4rem", color: "white",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}>
            ChatApp
          </Typography>
        </Box>

        {/* White card */}
        <Box sx={{
          bgcolor: "white",
          borderRadius: "12px",
          p: { xs: 2.5, sm: 4 },
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: 420,
        }}>
          <Typography sx={{
            fontWeight: 600, fontSize: "1.1rem", color: "#111b21", mb: 0.5,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}>
            {isLogin ? "Sign in" : "Create Account"}
          </Typography>
          <Typography sx={{
            color: "#8696a0", fontSize: "0.82rem", mb: 2.5,
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}>
            {isLogin ? "Welcome back!" : "Join the conversation"}
          </Typography>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div key="login"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <form onSubmit={handleLogin}>
                  <Stack spacing={2}>
                    <WATextField label="Username" value={username.value} onChange={username.changeHandler} required />
                    <WATextField label="Password" type="password" value={password.value} onChange={password.changeHandler} required />
                    <WAButton type="submit" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </WAButton>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ color: "#8696a0", fontSize: "0.82rem", display: "inline" }}>
                        Don't have an account?{" "}
                      </Typography>
                      <Button onClick={toggleLogin} disabled={isLoading} sx={{
                        color: "#00a884", textTransform: "none", fontWeight: 600,
                        fontSize: "0.82rem", p: 0, minWidth: 0,
                        "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                      }}>
                        Sign up
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </motion.div>
            ) : (
              <motion.div key="signup"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <form onSubmit={handleSignUp}>
                  <Stack spacing={2}>
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Stack position="relative" width="5rem">
                        <Avatar sx={{ width: "5rem", height: "5rem", border: "3px solid #00a884" }} src={avatar.preview} />
                        <IconButton component="label" sx={{
                          position: "absolute", bottom: -4, right: -4,
                          bgcolor: "#00a884", color: "white",
                          width: 44, height: 44,
                          "&:hover": { bgcolor: "#008069" },
                        }} aria-label="Upload avatar">
                          <CameraAltIcon sx={{ fontSize: 14 }} />
                          <VisuallyHiddenInput type="file" onChange={avatar.changeHandler} />
                        </IconButton>
                      </Stack>
                    </Box>
                    <WATextField label="Full Name" value={name.value} onChange={name.changeHandler} required />
                    <WATextField label="About" value={bio.value} onChange={bio.changeHandler} required />
                    <WATextField label="Username" value={username.value} onChange={username.changeHandler} required />
                    {username.error && <Typography color="error" variant="caption">{username.error}</Typography>}
                    <WATextField label="Password" type="password" value={password.value} onChange={password.changeHandler} required />
                    <WAButton type="submit" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create Account"}
                    </WAButton>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ color: "#8696a0", fontSize: "0.82rem", display: "inline" }}>
                        Already have an account?{" "}
                      </Typography>
                      <Button onClick={toggleLogin} disabled={isLoading} sx={{
                        color: "#00a884", textTransform: "none", fontWeight: 600,
                        fontSize: "0.82rem", p: 0, minWidth: 0,
                        "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                      }}>
                        Sign in
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
};

const WATextField = (props) => (
  <TextField {...props} variant="outlined" size="small" sx={{
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px", bgcolor: "#f0f2f5",
      "& fieldset": { borderColor: "#e9edef" },
      "&:hover fieldset": { borderColor: "#00a884" },
      "&.Mui-focused fieldset": { borderColor: "#00a884", borderWidth: 1.5 },
    },
    "& .MuiInputLabel-root": { color: "#8696a0", "&.Mui-focused": { color: "#00a884" } },
    "& input": { color: "#111b21", fontSize: "1rem", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  }} />
);

const WAButton = ({ children, ...props }) => (
  <Button {...props} fullWidth sx={{
    bgcolor: "#00a884", color: "white", borderRadius: "8px",
    py: 1.1, fontWeight: 600, fontSize: "0.95rem",
    textTransform: "none", fontFamily: "'Segoe UI', system-ui, sans-serif",
    boxShadow: "none",
    "&:hover": { bgcolor: "#008069", boxShadow: "none" },
    "&:disabled": { bgcolor: "#e9edef", color: "#8696a0" },
    // Bigger tap target on mobile
    minHeight: 44,
  }}>
    {children}
  </Button>
);

export default Login;

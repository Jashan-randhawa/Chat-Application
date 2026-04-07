// ============================================================
// REDESIGNED Login page — dark premium auth screen
// Changes: animated background, glassmorphism card,
//          gradient logo, polished form fields,
//          smooth toggle transition, modern typography
// ============================================================

import { useFileHandler, useInputValidation } from "6pp";
import { CameraAlt as CameraAltIcon } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  TextField,
  Typography,
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
import { ChatBubble as ChatBubbleIcon } from "@mui/icons-material";

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
    const toastId = toast.loading("Signing in...");
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
    } finally {
      setIsLoading(false);
    }
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2942 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative orbs */}
      <Box sx={{
        position: "absolute",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 70%)",
        top: "-10%",
        left: "-10%",
        pointerEvents: "none",
      }} />
      <Box sx={{
        position: "absolute",
        width: 300,
        height: 300,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        bottom: "5%",
        right: "-5%",
        pointerEvents: "none",
      }} />

      <Container maxWidth="xs" sx={{ position: "relative", zIndex: 1 }}>
        {/* Brand logo */}
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box sx={{
            width: 52,
            height: 52,
            borderRadius: "16px",
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1.5,
            boxShadow: "0 8px 24px rgba(14,165,233,0.4)",
          }}>
            <ChatBubbleIcon sx={{ fontSize: 24, color: "white" }} />
          </Box>
          <Typography sx={{
            fontWeight: 800,
            fontSize: "1.6rem",
            letterSpacing: "-0.03em",
            color: "white",
          }}>
            Echo<span style={{
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Chat</span>
          </Typography>
          <Typography sx={{ color: "rgba(148,163,184,0.8)", fontSize: "0.82rem", mt: 0.3 }}>
            {isLogin ? "Welcome back" : "Create your account"}
          </Typography>
        </Box>

        {/* Glass card */}
        <Box
          sx={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            p: { xs: 3, sm: 4 },
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
              >
                <form onSubmit={handleLogin}>
                  <Stack spacing={2}>
                    <AuthTextField
                      label="Username"
                      value={username.value}
                      onChange={username.changeHandler}
                      required
                    />
                    <AuthTextField
                      label="Password"
                      type="password"
                      value={password.value}
                      onChange={password.changeHandler}
                      required
                    />
                    <GradientButton type="submit" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </GradientButton>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ color: "rgba(148,163,184,0.6)", fontSize: "0.8rem", mb: 0.5 }}>
                        Don't have an account?
                      </Typography>
                      <Button
                        onClick={toggleLogin}
                        disabled={isLoading}
                        sx={{
                          color: "#0ea5e9",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          "&:hover": { bgcolor: "rgba(14,165,233,0.08)" },
                        }}
                      >
                        Create account →
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <form onSubmit={handleSignUp}>
                  <Stack spacing={2}>
                    {/* Avatar upload */}
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Stack position={"relative"} width={"5.5rem"}>
                        <Avatar
                          sx={{
                            width: "5.5rem",
                            height: "5.5rem",
                            border: "3px solid rgba(14,165,233,0.5)",
                            boxShadow: "0 4px 16px rgba(14,165,233,0.25)",
                          }}
                          src={avatar.preview}
                        />
                        <IconButton
                          component="label"
                          sx={{
                            position: "absolute",
                            bottom: -4,
                            right: -4,
                            bgcolor: "#0ea5e9",
                            color: "white",
                            width: 28,
                            height: 28,
                            "&:hover": { bgcolor: "#0284c7" },
                          }}
                        >
                          <CameraAltIcon sx={{ fontSize: 14 }} />
                          <VisuallyHiddenInput type="file" onChange={avatar.changeHandler} />
                        </IconButton>
                      </Stack>
                    </Box>
                    {avatar.error && (
                      <Typography color="error" variant="caption" textAlign="center">
                        {avatar.error}
                      </Typography>
                    )}

                    <AuthTextField label="Full Name" value={name.value} onChange={name.changeHandler} required />
                    <AuthTextField label="Bio" value={bio.value} onChange={bio.changeHandler} required />
                    <AuthTextField label="Username" value={username.value} onChange={username.changeHandler} required />
                    {username.error && (
                      <Typography color="error" variant="caption">{username.error}</Typography>
                    )}
                    <AuthTextField label="Password" type="password" value={password.value} onChange={password.changeHandler} required />

                    <GradientButton type="submit" disabled={isLoading}>
                      {isLoading ? "Creating account..." : "Create Account"}
                    </GradientButton>
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ color: "rgba(148,163,184,0.6)", fontSize: "0.8rem", mb: 0.5 }}>
                        Already have an account?
                      </Typography>
                      <Button
                        onClick={toggleLogin}
                        disabled={isLoading}
                        sx={{
                          color: "#0ea5e9",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          "&:hover": { bgcolor: "rgba(14,165,233,0.08)" },
                        }}
                      >
                        Sign in →
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Container>
    </Box>
  );
};

// Styled sub-components for the dark theme

const AuthTextField = (props) => (
  <TextField
    {...props}
    variant="outlined"
    size="small"
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: "12px",
        bgcolor: "rgba(255,255,255,0.04)",
        color: "white",
        "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
        "&:hover fieldset": { borderColor: "rgba(14,165,233,0.4)" },
        "&.Mui-focused fieldset": { borderColor: "#0ea5e9", borderWidth: 1.5 },
      },
      "& .MuiInputLabel-root": {
        color: "rgba(148,163,184,0.7)",
        "&.Mui-focused": { color: "#0ea5e9" },
      },
      "& input": { color: "white", fontSize: "0.9rem" },
      "& input:-webkit-autofill": {
        WebkitBoxShadow: "0 0 0 100px #1e2d45 inset",
        WebkitTextFillColor: "white",
      },
    }}
  />
);

const GradientButton = ({ children, ...props }) => (
  <Button
    {...props}
    fullWidth
    sx={{
      background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
      color: "white",
      borderRadius: "12px",
      py: 1.2,
      fontWeight: 700,
      fontSize: "0.95rem",
      textTransform: "none",
      letterSpacing: "-0.01em",
      boxShadow: "0 4px 16px rgba(14,165,233,0.35)",
      "&:hover": {
        background: "linear-gradient(135deg, #0284c7, #4f46e5)",
        boxShadow: "0 6px 20px rgba(14,165,233,0.5)",
        transform: "translateY(-1px)",
      },
      "&:disabled": {
        background: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.3)",
      },
      transition: "all 0.2s ease",
    }}
  >
    {children}
  </Button>
);

export default Login;

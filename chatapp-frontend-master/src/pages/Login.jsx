import { useFileHandler, useInputValidation } from "6pp";
import {
  CameraAlt as CameraAltIcon,
  Visibility,
  VisibilityOff,
  ChatBubble as ChatBubbleIcon,
  Groups as GroupsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { VisuallyHiddenInput } from "../components/styles/StyledComponents";
import { server } from "../constants/config";
import { userExists } from "../redux/reducers/auth";
import { usernameValidator } from "../utils/validators";
import { motion, AnimatePresence } from "framer-motion";

/* ─── password strength helper ──────────────────────────── */
const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const map = [
    { label: "Too short", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#eab308" },
    { label: "Good", color: "#22c55e" },
    { label: "Strong", color: "#16a34a" },
  ];
  return { score, ...map[score] };
};

/* ─── feature list shown on desktop panel ───────────────── */
const FEATURES = [
  { icon: <ChatBubbleIcon sx={{ fontSize: 22 }} />, title: "Real-time Messaging", desc: "Instant messages with typing indicators" },
  { icon: <GroupsIcon sx={{ fontSize: 22 }} />, title: "Group Chats", desc: "Create groups and stay connected" },
  { icon: <SecurityIcon sx={{ fontSize: 22 }} />, title: "Secure", desc: "Your conversations stay private" },
  { icon: <SpeedIcon sx={{ fontSize: 22 }} />, title: "Fast & Reliable", desc: "Optimized for any network condition" },
];

/* ─── main component ─────────────────────────────────────── */
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const name = useInputValidation("");
  const bio = useInputValidation("");
  const username = useInputValidation("", usernameValidator);
  const password = useInputValidation("");
  const avatar = useFileHandler("single");
  const dispatch = useDispatch();

  const firstFieldRef = useRef(null);
  useEffect(() => {
    const t = setTimeout(() => firstFieldRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [isLogin]);

  const toggleLogin = () => {
    setShowPassword(false);
    setIsLogin((prev) => !prev);
  };

  const pwdStrength = getPasswordStrength(password.value);

  const handleLogin = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Logging in…");
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
    const toastId = toast.loading("Creating account…");
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
        minHeight: "100dvh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #134e4a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: "env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0", sm: 2 },
        overscrollBehavior: "none",
      }}
    >
      {/* ── outer wrapper: side-by-side on lg+ ─────────────── */}
      <Box
        sx={{
          display: "flex",
          width: "100%",
          maxWidth: { xs: "100%", sm: 520, lg: 960 },
          minHeight: { xs: "100dvh", sm: "auto" },
          borderRadius: { xs: 0, sm: "20px" },
          overflow: "hidden",
          boxShadow: { xs: "none", sm: "0 25px 60px rgba(0,0,0,0.5)" },
        }}
      >
        {/* ── desktop feature panel (lg+ only) ──────────────── */}
        <Box
          sx={{
            display: { xs: "none", lg: "flex" },
            flexDirection: "column",
            justifyContent: "center",
            width: "44%",
            background: "linear-gradient(160deg, #00a884 0%, #008069 60%, #065f46 100%)",
            p: 5,
            flexShrink: 0,
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
              <Box
                sx={{
                  width: 48, height: 48, borderRadius: "14px",
                  bgcolor: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26,
                }}
              >
                💬
              </Box>
              <Typography sx={{ color: "white", fontWeight: 800, fontSize: "1.6rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                ChatApp
              </Typography>
            </Box>

            <Typography sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 700, fontSize: "1.55rem", lineHeight: 1.3, mb: 1.5, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              Connect with friends & colleagues
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.95rem", mb: 4, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              Real-time messaging, group chats, and more — all in one place.
            </Typography>

            <Stack spacing={2.5}>
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 38, height: 38, borderRadius: "10px", flexShrink: 0,
                        bgcolor: "rgba(255,255,255,0.15)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white",
                      }}
                    >
                      {f.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ color: "white", fontWeight: 600, fontSize: "0.9rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                        {f.title}
                      </Typography>
                      <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.8rem", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                        {f.desc}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </motion.div>
        </Box>

        {/* ── form panel ─────────────────────────────────────── */}
        <Box
          sx={{
            flex: 1,
            bgcolor: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            p: { xs: 3, sm: 5 },
            overflowY: "auto",
          }}
        >
          {/* mobile logo */}
          <Box sx={{ display: { xs: "flex", lg: "none" }, alignItems: "center", gap: 1.2, mb: 3 }}>
            <Box sx={{ fontSize: 30 }}>💬</Box>
            <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: "#0f172a", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              ChatApp
            </Typography>
          </Box>

          {/* tab switcher */}
          <Box
            sx={{
              display: "flex",
              bgcolor: "#f1f5f9",
              borderRadius: "12px",
              p: "4px",
              mb: 3.5,
              maxWidth: 340,
            }}
            role="tablist"
            aria-label="Login or Sign up"
          >
            {["Sign In", "Sign Up"].map((label, i) => {
              const active = isLogin === (i === 0);
              return (
                <Button
                  key={label}
                  role="tab"
                  aria-selected={active}
                  onClick={() => { if (!isLoading) setIsLogin(i === 0); }}
                  disabled={isLoading}
                  sx={{
                    flex: 1,
                    borderRadius: "9px",
                    py: 0.9,
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    textTransform: "none",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                    transition: "all 0.2s",
                    bgcolor: active ? "white" : "transparent",
                    color: active ? "#00a884" : "#64748b",
                    boxShadow: active ? "0 1px 6px rgba(0,0,0,0.12)" : "none",
                    "&:hover": { bgcolor: active ? "white" : "rgba(0,0,0,0.04)" },
                    minHeight: 44,
                  }}
                >
                  {label}
                </Button>
              );
            })}
          </Box>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: "1.35rem", color: "#0f172a", mb: 0.4, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  Welcome back 👋
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.88rem", mb: 3, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  Sign in to continue chatting
                </Typography>

                <form onSubmit={handleLogin} noValidate>
                  <Stack spacing={2.2}>
                    <ModernTextField
                      inputRef={firstFieldRef}
                      label="Username"
                      value={username.value}
                      onChange={username.changeHandler}
                      required
                      autoComplete="username"
                      inputProps={{ "aria-label": "Username" }}
                    />
                    <ModernTextField
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password.value}
                      onChange={password.changeHandler}
                      required
                      autoComplete="current-password"
                      inputProps={{ "aria-label": "Password" }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={showPassword ? "Hide password" : "Show password"}
                              onClick={() => setShowPassword((s) => !s)}
                              edge="end"
                              size="small"
                              sx={{ color: "#94a3b8" }}
                            >
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* demo credentials */}
                    <Box
                      sx={{
                        bgcolor: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "10px",
                        p: 1.5,
                      }}
                    >
                      <Typography sx={{ color: "#166534", fontSize: "0.75rem", fontWeight: 600, mb: 0.3, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                        🔑 Demo credentials
                      </Typography>
                      <Typography sx={{ color: "#15803d", fontSize: "0.73rem", fontFamily: "monospace" }}>
                        Username: <strong>demo</strong> &nbsp;|&nbsp; Password: <strong>demo1234</strong>
                      </Typography>
                    </Box>

                    <PrimaryButton type="submit" disabled={isLoading} aria-label="Sign in">
                      {isLoading ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CircularProgress size={16} sx={{ color: "white" }} />
                          Signing in…
                        </Box>
                      ) : "Sign In"}
                    </PrimaryButton>

                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ color: "#94a3b8", fontSize: "0.82rem", display: "inline", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                        {"Don't have an account? "}
                      </Typography>
                      <Button
                        onClick={toggleLogin}
                        disabled={isLoading}
                        sx={{
                          color: "#00a884", textTransform: "none", fontWeight: 600,
                          fontSize: "0.82rem", p: 0, minWidth: 0,
                          fontFamily: "'Segoe UI', system-ui, sans-serif",
                          "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                        }}
                      >
                        Sign up
                      </Button>
                    </Box>
                  </Stack>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                <Typography sx={{ fontWeight: 700, fontSize: "1.35rem", color: "#0f172a", mb: 0.4, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  Create account ✨
                </Typography>
                <Typography sx={{ color: "#64748b", fontSize: "0.88rem", mb: 3, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                  Join the conversation today
                </Typography>

                <form onSubmit={handleSignUp} noValidate>
                  <Stack spacing={2.2}>
                    {/* avatar picker */}
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      <Tooltip title="Upload profile photo" arrow>
                        <Stack position="relative" width="5.5rem">
                          <Avatar
                            sx={{
                              width: "5.5rem", height: "5.5rem",
                              border: "3px solid #00a884",
                              boxShadow: "0 0 0 4px rgba(0,168,132,0.15)",
                            }}
                            src={avatar.preview}
                          />
                          <IconButton
                            component="label"
                            sx={{
                              position: "absolute", bottom: -4, right: -4,
                              bgcolor: "#00a884", color: "white",
                              width: 34, height: 34,
                              "&:hover": { bgcolor: "#008069" },
                            }}
                            aria-label="Upload avatar"
                          >
                            <CameraAltIcon sx={{ fontSize: 16 }} />
                            <VisuallyHiddenInput type="file" onChange={avatar.changeHandler} />
                          </IconButton>
                        </Stack>
                      </Tooltip>
                    </Box>

                    <ModernTextField
                      inputRef={firstFieldRef}
                      label="Full Name"
                      value={name.value}
                      onChange={name.changeHandler}
                      required
                      autoComplete="name"
                      inputProps={{ "aria-label": "Full name" }}
                    />
                    <ModernTextField
                      label="About / Bio"
                      value={bio.value}
                      onChange={bio.changeHandler}
                      required
                      inputProps={{ "aria-label": "Bio" }}
                    />
                    <Box>
                      <ModernTextField
                        label="Username"
                        value={username.value}
                        onChange={username.changeHandler}
                        required
                        autoComplete="username"
                        inputProps={{ "aria-label": "Username" }}
                        error={Boolean(username.error)}
                        helperText={username.error}
                      />
                    </Box>
                    <Box>
                      <ModernTextField
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        value={password.value}
                        onChange={password.changeHandler}
                        required
                        autoComplete="new-password"
                        inputProps={{ "aria-label": "Password" }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowPassword((s) => !s)}
                                edge="end"
                                size="small"
                                sx={{ color: "#94a3b8" }}
                              >
                                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                      {/* password strength bar */}
                      {password.value && (
                        <Box sx={{ mt: 1 }}>
                          <Box sx={{ display: "flex", gap: 0.5, mb: 0.4 }}>
                            {[0, 1, 2, 3].map((i) => (
                              <Box
                                key={i}
                                sx={{
                                  flex: 1, height: 4, borderRadius: 2,
                                  bgcolor: i < pwdStrength.score ? pwdStrength.color : "#e2e8f0",
                                  transition: "background 0.3s",
                                }}
                              />
                            ))}
                          </Box>
                          <Typography sx={{ fontSize: "0.72rem", color: pwdStrength.color, fontWeight: 600, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                            {pwdStrength.label}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <PrimaryButton type="submit" disabled={isLoading} aria-label="Create account">
                      {isLoading ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CircularProgress size={16} sx={{ color: "white" }} />
                          Creating account…
                        </Box>
                      ) : "Create Account"}
                    </PrimaryButton>

                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ color: "#94a3b8", fontSize: "0.82rem", display: "inline", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
                        Already have an account?{" "}
                      </Typography>
                      <Button
                        onClick={toggleLogin}
                        disabled={isLoading}
                        sx={{
                          color: "#00a884", textTransform: "none", fontWeight: 600,
                          fontSize: "0.82rem", p: 0, minWidth: 0,
                          fontFamily: "'Segoe UI', system-ui, sans-serif",
                          "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                        }}
                      >
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

/* ─── reusable styled sub-components ────────────────────── */
import PropTypes from "prop-types";

const ModernTextField = ({ inputRef, ...props }) => (
  <TextField
    {...props}
    inputRef={inputRef}
    variant="outlined"
    size="small"
    fullWidth
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        bgcolor: "#f8fafc",
        fontSize: "1rem",
        "& fieldset": { borderColor: "#e2e8f0" },
        "&:hover fieldset": { borderColor: "#00a884" },
        "&.Mui-focused fieldset": { borderColor: "#00a884", borderWidth: 2 },
      },
      "& .MuiInputLabel-root": {
        color: "#94a3b8",
        "&.Mui-focused": { color: "#00a884" },
      },
      "& input": {
        color: "#0f172a",
        fontSize: "1rem",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      },
      ...props.sx,
    }}
  />
);

ModernTextField.propTypes = {
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  sx: PropTypes.object,
};

const PrimaryButton = ({ children, ...props }) => (
  <Button
    {...props}
    fullWidth
    sx={{
      background: "linear-gradient(135deg, #00a884 0%, #008069 100%)",
      color: "white",
      borderRadius: "10px",
      py: 1.3,
      fontWeight: 700,
      fontSize: "0.95rem",
      textTransform: "none",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      boxShadow: "0 4px 14px rgba(0,168,132,0.35)",
      transition: "all 0.2s",
      minHeight: 46,
      "&:hover": {
        background: "linear-gradient(135deg, #008069 0%, #065f46 100%)",
        boxShadow: "0 6px 20px rgba(0,168,132,0.45)",
        transform: "translateY(-1px)",
      },
      "&:active": { transform: "translateY(0)" },
      "&:disabled": {
        background: "#e2e8f0",
        color: "#94a3b8",
        boxShadow: "none",
        transform: "none",
      },
    }}
  >
    {children}
  </Button>
);

PrimaryButton.propTypes = {
  children: PropTypes.node,
};

export default Login;

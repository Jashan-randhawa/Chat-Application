import { useFileHandler, useInputValidation } from "6pp";
import { CameraAlt as CameraAltIcon } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Container,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { GlassCard, VisuallyHiddenInput } from "../components/styles/StyledComponents";
import { uiTokens } from "../design-system/tokens";
import { server } from "../constants/config";
import { userExists } from "../redux/reducers/auth";
import { usernameValidator } from "../utils/validators";

const Login = () => {
  const theme = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      color: "#eff3ff",
      borderRadius: "0.85rem",
      "& fieldset": {
        borderColor: "rgba(239,243,255,0.25)",
      },
      "&:hover fieldset": {
        borderColor: alpha(theme.palette.primary.main, 0.75),
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.22)}`,
      },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(239,243,255,0.7)",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: alpha(theme.palette.primary.light, 0.95),
    },
  };

  const toggleLogin = (_, mode) => {
    if (!mode) return;
    setIsLogin(mode === "login");
  };

  const name = useInputValidation("");
  const bio = useInputValidation("");
  const username = useInputValidation("", usernameValidator);
  const password = useInputValidation("");

  const avatar = useFileHandler("single");
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();

    const toastId = toast.loading("Logging In...");
    setIsLoading(true);

    const config = {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    };

    try {
      const { data } = await axios.post(
        `${server}/api/v1/user/login`,
        {
          username: username.value,
          password: password.value,
        },
        config
      );
      dispatch(userExists(data.user));
      toast.success(data.message, { id: toastId });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something Went Wrong", {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();

    const toastId = toast.loading("Signing Up...");
    setIsLoading(true);

    const formData = new FormData();
    formData.append("avatar", avatar.file);
    formData.append("name", name.value);
    formData.append("bio", bio.value);
    formData.append("username", username.value);
    formData.append("password", password.value);

    const config = {
      withCredentials: true,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    try {
      const { data } = await axios.post(`${server}/api/v1/user/new`, formData, config);
      dispatch(userExists(data.user));
      toast.success(data.message, { id: toastId });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something Went Wrong", {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ backgroundImage: uiTokens.gradients.page }}>
      <Container
        component="main"
        maxWidth="sm"
        sx={{
          minHeight: "100vh",
          py: { xs: 2, sm: 0 },
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <GlassCard
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: "30rem",
            padding: { xs: 2.5, sm: 4 },
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "#eff3ff",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {isLogin ? "Welcome Back" : "Create Account"}
          </Typography>

          <ToggleButtonGroup
            exclusive
            value={isLogin ? "login" : "signup"}
            onChange={toggleLogin}
            aria-label="Authentication mode"
            sx={{
              mt: 2,
              borderRadius: "999px",
              backgroundColor: "rgba(255,255,255,0.08)",
              p: "0.18rem",
              "& .MuiToggleButton-root": {
                border: "none",
                color: "rgba(239,243,255,0.74)",
                borderRadius: "999px",
                px: 2,
                textTransform: "none",
                fontWeight: 600,
              },
              "& .MuiToggleButton-root.Mui-selected": {
                color: "white",
                background: uiTokens.gradients.brand,
              },
              "& .MuiToggleButton-root.Mui-selected:hover": {
                background: uiTokens.gradients.brand,
              },
            }}
          >
            <ToggleButton value="login" aria-label="Switch to login mode">
              Login
            </ToggleButton>
            <ToggleButton value="signup" aria-label="Switch to sign up mode">
              Sign Up
            </ToggleButton>
          </ToggleButtonGroup>

          {isLogin ? (
            <form
              style={{ width: "100%", marginTop: "1rem" }}
              onSubmit={handleLogin}
              aria-label="Login form"
            >
              <TextField
                required
                fullWidth
                label="Username"
                margin="normal"
                variant="outlined"
                value={username.value}
                onChange={username.changeHandler}
                sx={inputSx}
                inputProps={{ "aria-label": "Username" }}
              />

              <TextField
                required
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                variant="outlined"
                value={password.value}
                onChange={password.changeHandler}
                sx={inputSx}
                inputProps={{ "aria-label": "Password" }}
              />

              <Button
                sx={{ marginTop: "1rem", background: uiTokens.gradients.brand }}
                variant="contained"
                type="submit"
                fullWidth
                disabled={isLoading}
                aria-label="Login"
              >
                Login
              </Button>
            </form>
          ) : (
            <form
              style={{ width: "100%", marginTop: "1rem" }}
              onSubmit={handleSignUp}
              aria-label="Sign up form"
            >
              <Stack position="relative" width="8.5rem" margin="0.5rem auto">
                <Avatar
                  sx={{
                    width: "8.5rem",
                    height: "8.5rem",
                    objectFit: "contain",
                    border: `3px solid ${alpha(theme.palette.primary.main, 0.55)}`,
                    boxShadow: `0 0 18px ${alpha(theme.palette.primary.main, 0.35)}`,
                  }}
                  src={avatar.preview}
                  alt="Selected profile"
                />

                <IconButton
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    color: "white",
                    bgcolor: alpha(theme.palette.primary.main, 0.8),
                    ":hover": {
                      bgcolor: theme.palette.primary.main,
                    },
                  }}
                  component="label"
                  aria-label="Upload avatar"
                >
                  <>
                    <CameraAltIcon />
                    <VisuallyHiddenInput
                      type="file"
                      onChange={avatar.changeHandler}
                      aria-label="Avatar upload"
                    />
                  </>
                </IconButton>
              </Stack>

              {avatar.error && (
                <Typography
                  m="1rem auto"
                  width="fit-content"
                  display="block"
                  color="error.light"
                  variant="caption"
                >
                  {avatar.error}
                </Typography>
              )}

              <TextField
                required
                fullWidth
                label="Name"
                margin="normal"
                variant="outlined"
                value={name.value}
                onChange={name.changeHandler}
                sx={inputSx}
                inputProps={{ "aria-label": "Name" }}
              />

              <TextField
                required
                fullWidth
                label="Bio"
                margin="normal"
                variant="outlined"
                value={bio.value}
                onChange={bio.changeHandler}
                sx={inputSx}
                inputProps={{ "aria-label": "Bio" }}
              />
              <TextField
                required
                fullWidth
                label="Username"
                margin="normal"
                variant="outlined"
                value={username.value}
                onChange={username.changeHandler}
                sx={inputSx}
                inputProps={{ "aria-label": "Username" }}
              />

              {username.error && (
                <Typography color="error.light" variant="caption">
                  {username.error}
                </Typography>
              )}

              <TextField
                required
                fullWidth
                label="Password"
                type="password"
                margin="normal"
                variant="outlined"
                value={password.value}
                onChange={password.changeHandler}
                sx={inputSx}
                inputProps={{ "aria-label": "Password" }}
              />

              <Button
                sx={{ marginTop: "1rem", background: uiTokens.gradients.brand }}
                variant="contained"
                type="submit"
                fullWidth
                disabled={isLoading}
                aria-label="Sign up"
              >
                Sign Up
              </Button>
            </form>
          )}
        </GlassCard>
      </Container>
    </div>
  );
};

export default Login;

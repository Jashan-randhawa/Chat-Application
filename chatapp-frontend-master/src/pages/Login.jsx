import { useFileHandler, useInputValidation } from "6pp";
import { CameraAlt as CameraAltIcon } from "@mui/icons-material";
import {
  Avatar,
  Button,
  Container,
  IconButton,
  Stack,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { GlassCard, VisuallyHiddenInput } from "../components/styles/StyledComponents";
import { bgGradient } from "../constants/color";
import { server } from "../constants/config";
import { userExists } from "../redux/reducers/auth";
import { usernameValidator } from "../utils/validators";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    color: "#eff3ff",
    borderRadius: "0.85rem",
    "& fieldset": {
      borderColor: "rgba(239,243,255,0.25)",
    },
    "&:hover fieldset": {
      borderColor: "rgba(108,99,255,0.75)",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#6c63ff",
      boxShadow: "0 0 0 3px rgba(108,99,255,0.22)",
    },
  },
  "& .MuiInputLabel-root": {
    color: "rgba(239,243,255,0.7)",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#b5b0ff",
  },
};

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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
      toast.success(data.message, {
        id: toastId,
      });
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
      const { data } = await axios.post(
        `${server}/api/v1/user/new`,
        formData,
        config
      );

      dispatch(userExists(data.user));
      toast.success(data.message, {
        id: toastId,
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something Went Wrong", {
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: bgGradient,
      }}
    >
      <Container
        component={"main"}
        maxWidth="sm"
        sx={{
          height: "100vh",
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
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "#eff3ff",
          }}
        >
          <Typography
            variant="h5"
            sx={{ fontFamily: "Sora, sans-serif", fontWeight: 600 }}
          >
            {isLogin ? "Welcome Back" : "Create Account"}
          </Typography>

          <ToggleButtonGroup
            exclusive
            value={isLogin ? "login" : "signup"}
            onChange={toggleLogin}
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
                background:
                  "linear-gradient(135deg, rgba(108,99,255,0.95), rgba(34,193,195,0.92))",
              },
              "& .MuiToggleButton-root.Mui-selected:hover": {
                background:
                  "linear-gradient(135deg, rgba(108,99,255,0.95), rgba(34,193,195,0.92))",
              },
            }}
          >
            <ToggleButton value="login">Login</ToggleButton>
            <ToggleButton value="signup">Sign Up</ToggleButton>
          </ToggleButtonGroup>

          {isLogin ? (
            <form
              style={{
                width: "100%",
                marginTop: "1rem",
              }}
              onSubmit={handleLogin}
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
              />

              <Button
                sx={{
                  marginTop: "1rem",
                  borderRadius: "999px",
                  textTransform: "none",
                  fontWeight: 600,
                  background:
                    "linear-gradient(135deg, #6c63ff 0%, #8b7bff 45%, #22c1c3 100%)",
                }}
                variant="contained"
                type="submit"
                fullWidth
                disabled={isLoading}
              >
                Login
              </Button>
            </form>
          ) : (
            <form
              style={{
                width: "100%",
                marginTop: "1rem",
              }}
              onSubmit={handleSignUp}
            >
              <Stack position={"relative"} width={"8.5rem"} margin={"0.5rem auto"}>
                <Avatar
                  sx={{
                    width: "8.5rem",
                    height: "8.5rem",
                    objectFit: "contain",
                    border: "3px solid rgba(108,99,255,0.55)",
                    boxShadow: "0 0 18px rgba(108,99,255,0.35)",
                  }}
                  src={avatar.preview}
                />

                <IconButton
                  sx={{
                    position: "absolute",
                    bottom: "0",
                    right: "0",
                    color: "white",
                    bgcolor: "rgba(108,99,255,0.8)",
                    ":hover": {
                      bgcolor: "rgba(108,99,255,1)",
                    },
                  }}
                  component="label"
                >
                  <>
                    <CameraAltIcon />
                    <VisuallyHiddenInput type="file" onChange={avatar.changeHandler} />
                  </>
                </IconButton>
              </Stack>

              {avatar.error && (
                <Typography
                  m={"1rem auto"}
                  width={"fit-content"}
                  display={"block"}
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
              />

              <Button
                sx={{
                  marginTop: "1rem",
                  borderRadius: "999px",
                  textTransform: "none",
                  fontWeight: 600,
                  background:
                    "linear-gradient(135deg, #6c63ff 0%, #8b7bff 45%, #22c1c3 100%)",
                }}
                variant="contained"
                type="submit"
                fullWidth
                disabled={isLoading}
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

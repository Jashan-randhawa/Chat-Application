import { useInputValidation } from "6pp";
import { Button, Container, Paper, TextField, Typography, useTheme } from "@mui/material";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { uiTokens } from "../../design-system/tokens";
import { adminLogin, getAdmin } from "../../redux/thunks/admin";

const AdminLogin = () => {
  const theme = useTheme();
  const { isAdmin } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const secretKey = useInputValidation("");

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(adminLogin(secretKey.value));
  };

  useEffect(() => {
    dispatch(getAdmin());
  }, [dispatch]);

  if (isAdmin) return <Navigate to="/admin/dashboard" />;

  return (
    <div style={{ backgroundImage: uiTokens.gradients.page }}>
      <Container
        component="main"
        maxWidth="xs"
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            bgcolor: "rgba(255,255,255,0.95)",
          }}
        >
          <Typography variant="h5" sx={{ color: theme.palette.text.primary }}>
            Admin Login
          </Typography>
          <form style={{ width: "100%", marginTop: "1rem" }} onSubmit={submitHandler} aria-label="Admin login form">
            <TextField
              required
              fullWidth
              label="Secret Key"
              type="password"
              margin="normal"
              variant="outlined"
              value={secretKey.value}
              onChange={secretKey.changeHandler}
              inputProps={{ "aria-label": "Admin secret key" }}
            />

            <Button sx={{ marginTop: "1rem" }} variant="contained" type="submit" fullWidth aria-label="Admin login">
              Login
            </Button>
          </form>
        </Paper>
      </Container>
    </div>
  );
};

export default AdminLogin;

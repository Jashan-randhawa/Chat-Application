/* eslint-disable react/prop-types */
import {
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  ExitToApp as ExitToAppIcon,
  Groups as GroupsIcon,
  ManageAccounts as ManageAccountsIcon,
  Menu as MenuIcon,
  Message as MessageIcon,
} from "@mui/icons-material";
import {
  Box,
  Drawer,
  Grid,
  IconButton,
  Stack,
  Typography,
  alpha,
  styled,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import { Link as LinkComponent, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { adminLogout } from "../../redux/thunks/admin";

const Link = styled(LinkComponent)(({ theme }) => ({
  textDecoration: "none",
  borderRadius: "2rem",
  padding: "1rem 2rem",
  color: theme.palette.text.primary,
  "&:hover": {
    color: alpha(theme.palette.text.primary, 0.72),
  },
  "&:focus-visible": {
    outline: "none",
    boxShadow: "0 0 0 3px rgba(99,102,241,0.24)",
  },
}));

const adminTabs = [
  { name: "Dashboard", path: "/admin/dashboard", icon: <DashboardIcon /> },
  { name: "Users", path: "/admin/users", icon: <ManageAccountsIcon /> },
  { name: "Chats", path: "/admin/chats", icon: <GroupsIcon /> },
  { name: "Messages", path: "/admin/messages", icon: <MessageIcon /> },
];

const Sidebar = ({ w = "100%" }) => {
  const theme = useTheme();
  const location = useLocation();
  const dispatch = useDispatch();

  const logoutHandler = () => {
    dispatch(adminLogout());
  };

  return (
    <Stack width={w} direction="column" p="3rem" spacing="3rem">
      <Typography variant="h5" textTransform="uppercase">
        Chattu
      </Typography>

      <Stack spacing="1rem">
        {adminTabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            aria-label={`Open ${tab.name} admin page`}
            sx={
              location.pathname === tab.path && {
                bgcolor: theme.palette.primary.dark,
                color: theme.palette.primary.contrastText,
                ":hover": { color: theme.palette.primary.contrastText },
              }
            }
          >
            <Stack direction="row" alignItems="center" spacing="1rem">
              {tab.icon}
              <Typography>{tab.name}</Typography>
            </Stack>
          </Link>
        ))}

        <Link onClick={logoutHandler} aria-label="Admin logout">
          <Stack direction="row" alignItems="center" spacing="1rem">
            <ExitToAppIcon />
            <Typography>Logout</Typography>
          </Stack>
        </Link>
      </Stack>
    </Stack>
  );
};

const AdminLayout = ({ children }) => {
  const theme = useTheme();
  const { isAdmin } = useSelector((state) => state.auth);
  const [isMobile, setIsMobile] = useState(false);

  const handleMobile = () => setIsMobile((prev) => !prev);
  const handleClose = () => setIsMobile(false);

  if (!isAdmin) return <Navigate to="/admin" />;

  return (
    <Grid container minHeight="100vh">
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          position: "fixed",
          right: "1rem",
          top: "1rem",
          zIndex: 10,
        }}
      >
        <IconButton onClick={handleMobile} aria-label="Toggle admin navigation drawer">
          {isMobile ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <Grid item md={4} lg={3} sx={{ display: { xs: "none", md: "block" } }}>
        <Sidebar />
      </Grid>

      <Grid
        item
        xs={12}
        md={8}
        lg={9}
        sx={{
          bgcolor: theme.palette.background.default,
        }}
      >
        {children}
      </Grid>

      <Drawer open={isMobile} onClose={handleClose}>
        <Sidebar w="50vw" />
      </Drawer>
    </Grid>
  );
};

export default AdminLayout;

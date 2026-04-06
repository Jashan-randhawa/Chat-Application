import AppLayout from "../components/layout/AppLayout";
import { Box, Stack, Typography, alpha, useTheme } from "@mui/material";
import { Forum as ForumIcon } from "@mui/icons-material";

const Home = () => {
  const theme = useTheme();

  return (
    <Box
      bgcolor={theme.palette.background.default}
      height="100%"
      sx={{
        backgroundImage: `radial-gradient(circle at 2px 2px, ${alpha(
          theme.palette.primary.main,
          0.11
        )} 1px, transparent 0)`,
        backgroundSize: "24px 24px",
      }}
    >
      <Stack
        height="100%"
        justifyContent="center"
        alignItems="center"
        textAlign="center"
        spacing={1.1}
        px={2}
      >
        <ForumIcon sx={{ fontSize: 56, color: alpha(theme.palette.primary.main, 0.84) }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
          Select a conversation
        </Typography>
        <Typography variant="body2" sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
          Choose a chat from the sidebar to start messaging.
        </Typography>
      </Stack>
    </Box>
  );
};

export default AppLayout()(Home);

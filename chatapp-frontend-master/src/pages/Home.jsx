import AppLayout from "../components/layout/AppLayout";
import { Box, Stack, Typography } from "@mui/material";
import { grayColor } from "../constants/color";
import { Forum as ForumIcon } from "@mui/icons-material";

const Home = () => {
  return (
    <Box
      bgcolor={grayColor}
      height={"100%"}
      sx={{
        backgroundImage:
          "radial-gradient(circle at 2px 2px, rgba(108,99,255,0.11) 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }}
    >
      <Stack
        height={"100%"}
        justifyContent={"center"}
        alignItems={"center"}
        textAlign={"center"}
        spacing={1.1}
        px={2}
      >
        <ForumIcon sx={{ fontSize: 56, color: "rgba(108,99,255,0.84)" }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e2438" }}>
          Select a conversation
        </Typography>
        <Typography variant="body2" sx={{ color: "rgba(30,36,56,0.7)" }}>
          Choose a chat from the sidebar to start messaging.
        </Typography>
      </Stack>
    </Box>
  );
};

export default AppLayout()(Home);

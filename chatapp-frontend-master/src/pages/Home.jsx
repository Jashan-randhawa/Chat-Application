// ============================================================
// REDESIGNED Home page — beautiful empty state
// Changes: gradient illustration, animated text, call-to-action
// ============================================================

import React from "react";
import AppLayout from "../components/layout/AppLayout";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { ChatBubble as ChatBubbleIcon, Search as SearchIcon } from "@mui/icons-material";

const Home = () => {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f0f2f5",
        backgroundImage: `
          radial-gradient(circle at 30% 40%, rgba(14,165,233,0.05) 0%, transparent 50%),
          radial-gradient(circle at 70% 70%, rgba(99,102,241,0.04) 0%, transparent 50%)
        `,
        px: 3,
        gap: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
      >
        {/* Icon cluster */}
        <Box sx={{ position: "relative", mb: 1 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "24px",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 40px rgba(14,165,233,0.3)",
            }}
          >
            <ChatBubbleIcon sx={{ fontSize: 36, color: "white" }} />
          </Box>
          {/* Floating ping dot */}
          <Box
            sx={{
              position: "absolute",
              top: -4,
              right: -4,
              width: 16,
              height: 16,
              borderRadius: "50%",
              bgcolor: "#22c55e",
              border: "2px solid white",
              boxShadow: "0 0 0 3px rgba(34,197,94,0.2)",
              animation: "ping 2s ease-in-out infinite",
              "@keyframes ping": {
                "0%, 100%": { boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" },
                "50%": { boxShadow: "0 0 0 8px rgba(34,197,94,0)" },
              },
            }}
          />
        </Box>

        <Box sx={{ textAlign: "center", maxWidth: 280 }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "1.4rem",
              color: "#1e293b",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              mb: 1,
            }}
          >
            Start a conversation
          </Typography>
          <Typography
            sx={{
              fontSize: "0.88rem",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            Select a friend from the sidebar to start chatting, or search for someone new.
          </Typography>
        </Box>

        {/* Hint chip */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            bgcolor: "white",
            border: "1px solid rgba(14,165,233,0.2)",
            borderRadius: "20px",
            px: 2,
            py: 0.75,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            mt: 0.5,
          }}
        >
          <SearchIcon sx={{ fontSize: 14, color: "#0ea5e9" }} />
          <Typography sx={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>
            Use the search icon to find friends
          </Typography>
        </Box>
      </motion.div>
    </Box>
  );
};

export default AppLayout()(Home);

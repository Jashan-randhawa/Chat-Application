// ============================================================
// REDESIGNED NotFound page — clean 404 with gradient
// ============================================================

import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home as HomeIcon } from "@mui/icons-material";

const NotFound = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f2942 100%)",
        gap: 3,
        p: 4,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative orb */}
      <Box sx={{
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", zIndex: 1 }}
      >
        <Typography
          sx={{
            fontSize: { xs: "5rem", sm: "8rem" },
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.05em",
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
          }}
        >
          404
        </Typography>
        <Typography sx={{ fontWeight: 700, fontSize: "1.3rem", color: "#f1f5f9", mb: 1 }}>
          Page Not Found
        </Typography>
        <Typography sx={{ color: "rgba(148,163,184,0.7)", fontSize: "0.9rem", mb: 3, maxWidth: 300, mx: "auto" }}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button
          component={Link}
          to="/"
          startIcon={<HomeIcon />}
          sx={{
            background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
            color: "white",
            borderRadius: "12px",
            px: 3,
            py: 1.2,
            textTransform: "none",
            fontWeight: 600,
            boxShadow: "0 4px 16px rgba(14,165,233,0.35)",
            "&:hover": { background: "linear-gradient(135deg, #0284c7, #4f46e5)" },
            textDecoration: "none",
          }}
        >
          Back to Home
        </Button>
      </motion.div>
    </Box>
  );
};

export default NotFound;

// ============================================================
// REDESIGNED Profile panel — premium dark sidebar panel
// Changes: glowing avatar ring, gradient stat cards,
//          modern typography, animated entrance
// ============================================================

import React from "react";
import { Avatar, Box, Stack, Typography } from "@mui/material";
import {
  Face as FaceIcon,
  AlternateEmail as UserNameIcon,
  CalendarMonth as CalendarIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import moment from "moment";
import { transformImage } from "../../lib/features";
import { motion } from "framer-motion";

const Profile = ({ user }) => {
  return (
    <Stack
      spacing={3}
      direction={"column"}
      alignItems={"center"}
      sx={{ p: 3, pt: 4, height: "100%", overflowY: "auto" }}
    >
      {/* Avatar with glow ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Box sx={{ position: "relative" }}>
          {/* Glow ring */}
          <Box
            sx={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              opacity: 0.6,
              filter: "blur(8px)",
              zIndex: 0,
            }}
          />
          <Avatar
            src={transformImage(user?.avatar?.url)}
            sx={{
              width: 96,
              height: 96,
              border: "3px solid #0f172a",
              position: "relative",
              zIndex: 1,
              objectFit: "cover",
            }}
          />
          {/* Online dot */}
          <Box
            sx={{
              position: "absolute",
              bottom: 6,
              right: 6,
              width: 14,
              height: 14,
              borderRadius: "50%",
              bgcolor: "#22c55e",
              border: "2.5px solid #0f172a",
              zIndex: 2,
            }}
          />
        </Box>
      </motion.div>

      {/* Name */}
      <Box sx={{ textAlign: "center" }}>
        <Typography
          sx={{
            color: "#f1f5f9",
            fontWeight: 700,
            fontSize: "1.1rem",
            letterSpacing: "-0.02em",
          }}
        >
          {user?.name}
        </Typography>
        <Typography sx={{ color: "rgba(148,163,184,0.7)", fontSize: "0.78rem", mt: 0.3 }}>
          @{user?.username}
        </Typography>
      </Box>

      {/* Divider */}
      <Box sx={{
        width: "100%",
        height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
      }} />

      {/* Profile cards */}
      <Stack spacing={1.5} width={"100%"}>
        <ProfileCard
          heading="Bio"
          text={user?.bio}
          icon={<InfoIcon sx={{ fontSize: 15 }} />}
        />
        <ProfileCard
          heading="Username"
          text={`@${user?.username}`}
          icon={<UserNameIcon sx={{ fontSize: 15 }} />}
        />
        <ProfileCard
          heading="Name"
          text={user?.name}
          icon={<FaceIcon sx={{ fontSize: 15 }} />}
        />
        <ProfileCard
          heading="Member since"
          text={moment(user?.createdAt).fromNow()}
          icon={<CalendarIcon sx={{ fontSize: 15 }} />}
        />
      </Stack>
    </Stack>
  );
};

const ProfileCard = ({ text, icon, heading }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Box
      sx={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "12px",
        px: 2,
        py: 1.5,
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        transition: "background 0.2s ease",
        "&:hover": { background: "rgba(14,165,233,0.06)" },
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: "8px",
          background: "rgba(14,165,233,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0ea5e9",
          flexShrink: 0,
          mt: 0.2,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ color: "rgba(148,163,184,0.6)", fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", mb: 0.2 }}>
          {heading}
        </Typography>
        <Typography sx={{ color: "#e2e8f0", fontSize: "0.85rem", fontWeight: 500, wordBreak: "break-word" }}>
          {text || "—"}
        </Typography>
      </Box>
    </Box>
  </motion.div>
);

export default Profile;

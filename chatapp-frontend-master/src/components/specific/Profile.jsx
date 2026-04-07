import React from "react";
import { Avatar, Box, Stack, Typography, Divider } from "@mui/material";
import {
  Face as FaceIcon,
  AlternateEmail as UserNameIcon,
  CalendarMonth as CalendarIcon,
  Info as InfoIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
} from "@mui/icons-material";
import moment from "moment";
import { transformImage } from "../../lib/features";

const Profile = ({ user }) => {
  return (
    <Box sx={{ height: "100%", overflowY: "auto", bgcolor: "#ffffff" }}>
      {/* WA-style green header */}
      <Box sx={{
        bgcolor: "#008069",
        px: 3, pt: 4, pb: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1.5,
        position: "relative",
      }}>
        <Typography sx={{
          color: "white", fontWeight: 600, fontSize: "1rem",
          alignSelf: "flex-start",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
          Profile
        </Typography>
        {/* Avatar */}
        <Box sx={{ position: "relative", mt: 1 }}>
          <Avatar
            src={transformImage(user?.avatar?.url)}
            sx={{
              width: 100, height: 100,
              border: "3px solid rgba(255,255,255,0.3)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          />
          <Box sx={{
            position: "absolute", bottom: 2, right: 2,
            width: 28, height: 28, borderRadius: "50%",
            bgcolor: "#00a884",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid white",
            cursor: "pointer",
          }}>
            <EditIcon sx={{ fontSize: 14, color: "white" }} />
          </Box>
        </Box>
        <Box textAlign="center">
          <Typography sx={{
            color: "white", fontWeight: 700, fontSize: "1.15rem",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}>
            {user?.name}
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: "0.82rem" }}>
            @{user?.username}
          </Typography>
        </Box>
      </Box>

      {/* Info cards - WA style */}
      <Box sx={{ mt: -2, mx: 2 }}>
        <Box sx={{
          bgcolor: "white",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}>
          <WAInfoRow icon={<InfoIcon sx={{ fontSize: 20, color: "#00a884" }} />}
            label="About" value={user?.bio || "Hey there! I am using WhatsApp."} />
          <Divider sx={{ mx: 2 }} />
          <WAInfoRow icon={<UserNameIcon sx={{ fontSize: 20, color: "#00a884" }} />}
            label="Username" value={`@${user?.username}`} />
          <Divider sx={{ mx: 2 }} />
          <WAInfoRow icon={<FaceIcon sx={{ fontSize: 20, color: "#00a884" }} />}
            label="Name" value={user?.name} />
          <Divider sx={{ mx: 2 }} />
          <WAInfoRow icon={<CalendarIcon sx={{ fontSize: 20, color: "#00a884" }} />}
            label="Joined" value={moment(user?.createdAt).format("MMMM D, YYYY")} />
        </Box>
      </Box>

      {/* Settings rows */}
      <Box sx={{ mt: 2, mx: 2, mb: 3 }}>
        <Box sx={{
          bgcolor: "white", borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}>
          {[
            { icon: <LockIcon sx={{ fontSize: 20 }} />, label: "Privacy", sublabel: "Last seen, profile photo" },
            { icon: <NotificationsIcon sx={{ fontSize: 20 }} />, label: "Notifications", sublabel: "Message, group & call tones" },
            { icon: <HelpIcon sx={{ fontSize: 20 }} />, label: "Help", sublabel: "Help Centre, contact us" },
          ].map((item, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Divider sx={{ mx: 2 }} />}
              <Box sx={{
                display: "flex", alignItems: "center", gap: 2,
                px: 2, py: 1.5, cursor: "pointer",
                "&:hover": { bgcolor: "#f5f6f6" },
                transition: "background 0.15s ease",
              }}>
                <Box sx={{ color: "#54656f" }}>{item.icon}</Box>
                <Box>
                  <Typography sx={{
                    color: "#111b21", fontSize: "0.9rem",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                    fontWeight: 500,
                  }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{
                    color: "#8696a0", fontSize: "0.78rem",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                  }}>
                    {item.sublabel}
                  </Typography>
                </Box>
              </Box>
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

const WAInfoRow = ({ icon, label, value }) => (
  <Box sx={{
    display: "flex", alignItems: "center", gap: 2,
    px: 2, py: 1.5,
  }}>
    <Box sx={{ flexShrink: 0 }}>{icon}</Box>
    <Box>
      <Typography sx={{
        color: "#8696a0", fontSize: "0.72rem",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        mb: 0.1,
      }}>
        {label}
      </Typography>
      <Typography sx={{
        color: "#111b21", fontSize: "0.9rem",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        wordBreak: "break-word",
      }}>
        {value || "—"}
      </Typography>
    </Box>
  </Box>
);

export default Profile;

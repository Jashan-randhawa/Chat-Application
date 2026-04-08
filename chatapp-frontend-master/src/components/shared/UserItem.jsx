// ============================================================
// REDESIGNED UserItem — dark-themed user list entry
// Changes: gradient add/remove buttons, avatar with ring,
//          improved name truncation, hover feedback
// ============================================================

import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";
import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import React, { memo } from "react";
import { transformImage } from "../../lib/features";

const UserItem = ({
  user,
  handler,
  handlerIsLoading,
  isAdded = false,
  styling = {},
  nameColor = "#111b21",
  hoverBg = "#f5f6f6",
}) => {
  const { name, _id, avatar } = user;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1,
        py: 0.85,
        borderRadius: "12px",
        transition: "background 0.15s ease",
        "&:hover": { bgcolor: hoverBg },
        ...styling,
      }}
    >
      {/* Avatar */}
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <Avatar
          src={transformImage(avatar)}
          imgProps={{ loading: "lazy", decoding: "async" }}
          sx={{
            width: 40,
            height: 40,
            border: "2px solid rgba(14,165,233,0.25)",
          }}
        />
      </Box>

      {/* Name */}
      <Typography
        sx={{
          flex: 1,
          color: nameColor,
          fontSize: "0.88rem",
          fontWeight: 500,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </Typography>

      {/* Add / Remove button */}
      <IconButton
        size="small"
        onClick={() => handler(_id)}
        disabled={handlerIsLoading}
        aria-label={`${isAdded ? "Remove" : "Add"} ${name}`}
        sx={{
          width: 44,
          height: 44,
          borderRadius: "8px",
          flexShrink: 0,
          bgcolor: isAdded
            ? "rgba(244,63,94,0.12)"
            : "rgba(14,165,233,0.12)",
          color: isAdded ? "#f43f5e" : "#0ea5e9",
          "&:hover": {
            bgcolor: isAdded
              ? "rgba(244,63,94,0.22)"
              : "rgba(14,165,233,0.22)",
          },
          "&:disabled": { opacity: 0.4 },
          transition: "all 0.2s ease",
        }}
      >
        {isAdded ? <RemoveIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
      </IconButton>
    </Box>
  );
};

export default memo(UserItem);

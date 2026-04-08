// ============================================================
// REDESIGNED AvatarCard — cleaner stacked avatar display
// ============================================================

import { Avatar, AvatarGroup, Box, Stack } from "@mui/material";
import React from "react";
import { transformImage } from "../../lib/features";

const AvatarCard = ({ avatar = [], max = 4 }) => {
  return (
    <Stack direction={"row"} spacing={0.5}>
      <AvatarGroup max={max} sx={{ position: "relative" }}>
        <Box width={"3rem"} height={"3rem"} sx={{ position: "relative" }}>
          {avatar.map((i, index) => (
            <Avatar
              key={Math.random() * 100}
              src={transformImage(i)}
              alt={`Avatar ${index}`}
              imgProps={{ loading: "lazy", decoding: "async" }}
              sx={{
                width: "3rem",
                height: "3rem",
                position: "absolute",
                left: { xs: `${0.5 + index}rem`, sm: `${index}rem` },
                border: "2px solid rgba(14,165,233,0.3)",
                boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              }}
            />
          ))}
        </Box>
      </AvatarGroup>
    </Stack>
  );
};

export default AvatarCard;

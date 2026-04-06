import { Avatar, AvatarGroup, Box, Stack } from "@mui/material";
import { transformImage } from "../../lib/features";

// Todo Transform
const AvatarCard = ({ avatar = [], max = 4, name = "User" }) => {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "U";
  const hasAvatar = Array.isArray(avatar) && avatar.length > 0;

  return (
    <Stack direction={"row"} spacing={0.5}>
      <AvatarGroup
        max={max}
        sx={{
          position: "relative",
        }}
      >
        {hasAvatar ? (
          <Box width={"5rem"} height={"3rem"}>
            {avatar.map((i, index) => (
              <Avatar
                key={`${i || "avatar"}-${index}`}
                src={transformImage(i)}
                alt={`Avatar ${index}`}
                sx={{
                  width: "3rem",
                  height: "3rem",
                  position: "absolute",
                  left: {
                    xs: `${0.5 + index}rem`,
                    sm: `${index}rem`,
                  },
                }}
              />
            ))}
          </Box>
        ) : (
          <Avatar
            sx={{
              width: "3rem",
              height: "3rem",
              background: "linear-gradient(135deg, #6c63ff, #22c1c3)",
              color: "white",
              fontWeight: 700,
            }}
          >
            {initial}
          </Avatar>
        )}
      </AvatarGroup>
    </Stack>
  );
};

export default AvatarCard;

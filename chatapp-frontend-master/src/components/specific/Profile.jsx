/* eslint-disable react/prop-types */
import { Avatar, Box, Stack, Typography } from "@mui/material";
import {
  Face as FaceIcon,
  AlternateEmail as UserNameIcon,
  CalendarMonth as CalendarIcon,
  Description as BioIcon,
} from "@mui/icons-material";
import moment from "moment";
import { transformImage } from "../../lib/features";
import { GlassCard } from "../styles/StyledComponents";

const Profile = ({ user }) => {
  return (
    <Stack spacing={"1.2rem"} direction={"column"} alignItems={"center"}>
      <Box
        sx={{
          width: 206,
          height: 206,
          borderRadius: "50%",
          p: "4px",
          background: "linear-gradient(135deg, #6c63ff, #22c1c3)",
          boxShadow: "0 0 24px rgba(108,99,255,0.5)",
        }}
      >
        <Avatar
          src={transformImage(user?.avatar?.url)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            border: "4px solid rgba(13,20,43,1)",
          }}
        />
      </Box>

      <ProfileCard heading={"Bio"} text={user?.bio} Icon={<BioIcon />} />
      <ProfileCard
        heading={"Username"}
        text={user?.username}
        Icon={<UserNameIcon />}
      />
      <ProfileCard heading={"Name"} text={user?.name} Icon={<FaceIcon />} />
      <ProfileCard
        heading={"Joined"}
        text={moment(user?.createdAt).fromNow()}
        Icon={<CalendarIcon />}
      />
    </Stack>
  );
};

const ProfileCard = ({ text, Icon, heading }) => (
  <GlassCard
    elevation={0}
    sx={{
      width: "100%",
      p: "0.85rem",
      color: "#eff3ff",
      display: "flex",
      alignItems: "center",
      gap: "0.8rem",
    }}
  >
    <Box
      sx={{
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(108,99,255,0.28), rgba(34,193,195,0.26))",
        display: "grid",
        placeItems: "center",
      }}
    >
      {Icon}
    </Box>

    <Stack>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {text || "—"}
      </Typography>
      <Typography color={"rgba(239,243,255,0.72)"} variant="caption">
        {heading}
      </Typography>
    </Stack>
  </GlassCard>
);

export default Profile;

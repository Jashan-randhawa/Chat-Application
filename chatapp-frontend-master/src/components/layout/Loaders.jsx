import { Grid, Skeleton, Stack, alpha, useTheme } from "@mui/material";
import { BouncingSkeleton } from "../styles/StyledComponents";
import { uiTokens } from "../../design-system/tokens";

const LayoutLoader = () => {
  const theme = useTheme();

  return (
    <Grid container height="calc(100vh - 4rem)">
      <Grid
        item
        sm={4}
        md={3}
        sx={{
          display: { xs: "none", sm: "block" },
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.background.paper
              : uiTokens.colors.surfaces.sidebar,
          padding: "1rem",
        }}
        height="100%"
      >
        <Stack spacing="0.8rem">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              height={58}
              sx={{ bgcolor: alpha(theme.palette.common.white, 0.11) }}
            />
          ))}
        </Stack>
      </Grid>
      <Grid
        item
        xs={12}
        sm={8}
        md={5}
        lg={6}
        height="100%"
        sx={{ backgroundColor: theme.palette.background.default, p: "1rem" }}
      >
        <Stack spacing="1rem">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              height={52}
              width={index % 2 ? "72%" : "55%"}
              sx={{
                ml: index % 2 ? "auto" : 0,
                bgcolor: alpha(theme.palette.primary.main, 0.16),
              }}
            />
          ))}
        </Stack>
      </Grid>

      <Grid
        item
        md={4}
        lg={3}
        height="100%"
        sx={{
          display: { xs: "none", md: "block" },
          backgroundColor:
            theme.palette.mode === "dark"
              ? uiTokens.colors.surfaces.profilePanel
              : uiTokens.colors.surfaces.sidebarLight,
          p: "2rem",
        }}
      >
        <Stack spacing="1.2rem" alignItems="center">
          <Skeleton
            variant="circular"
            width={160}
            height={160}
            sx={{ bgcolor: alpha(theme.palette.common.white, 0.15) }}
          />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              width="100%"
              height={70}
              sx={{ bgcolor: alpha(theme.palette.common.white, 0.12) }}
            />
          ))}
        </Stack>
      </Grid>
    </Grid>
  );
};

const TypingLoader = () => {
  return (
    <Stack spacing="0.45rem" direction="row" padding="0.5rem 0.8rem" justifyContent="center">
      <BouncingSkeleton variant="circular" width={12} height={12} style={{ animationDelay: "0s" }} />
      <BouncingSkeleton variant="circular" width={12} height={12} style={{ animationDelay: "0.18s" }} />
      <BouncingSkeleton variant="circular" width={12} height={12} style={{ animationDelay: "0.36s" }} />
    </Stack>
  );
};

export { TypingLoader, LayoutLoader };

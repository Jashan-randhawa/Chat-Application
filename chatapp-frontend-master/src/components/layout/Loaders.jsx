// ============================================================
// REDESIGNED Loaders — polished skeleton & typing indicator
// Changes: themed skeleton colors, smoother bouncing dots,
//          proper dark sidebar skeleton
// ============================================================

import { Grid, Skeleton, Stack, Box } from "@mui/material";
import React from "react";
import { BouncingSkeleton } from "../styles/StyledComponents";

const LayoutLoader = () => {
  return (
    <Grid container height={"calc(100vh - 4rem)"} sx={{ overflow: "hidden" }}>
      {/* Sidebar skeleton */}
      <Grid
        item
        sm={4}
        md={3}
        sx={{
          display: { xs: "none", sm: "block" },
          background: "linear-gradient(180deg, #0f172a 0%, #1a2744 100%)",
          p: 2,
        }}
        height={"100%"}
      >
        <Stack spacing={1.5}>
          {Array.from({ length: 9 }).map((_, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
              <Skeleton
                variant="circular"
                width={44}
                height={44}
                sx={{ bgcolor: "rgba(255,255,255,0.07)", flexShrink: 0 }}
              />
              <Box flex={1}>
                <Skeleton
                  variant="text"
                  width="55%"
                  height={14}
                  sx={{ bgcolor: "rgba(255,255,255,0.07)", mb: 0.5 }}
                />
                <Skeleton
                  variant="text"
                  width="35%"
                  height={11}
                  sx={{ bgcolor: "rgba(255,255,255,0.05)" }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      </Grid>

      {/* Chat area skeleton */}
      <Grid item xs={12} sm={8} md={5} lg={6} height={"100%"} sx={{ p: 2, bgcolor: "#f0f2f5" }}>
        <Stack spacing={1.5}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                display: "flex",
                justifyContent: index % 3 === 0 ? "flex-end" : "flex-start",
              }}
            >
              <Skeleton
                variant="rounded"
                width={`${Math.random() * 160 + 80}px`}
                height={44}
                sx={{
                  borderRadius: "18px",
                  bgcolor: index % 3 === 0 ? "rgba(14,165,233,0.12)" : "rgba(0,0,0,0.06)",
                }}
              />
            </Box>
          ))}
        </Stack>
      </Grid>

      {/* Profile skeleton */}
      <Grid
        item
        md={4}
        lg={3}
        height={"100%"}
        sx={{
          display: { xs: "none", md: "block" },
          background: "linear-gradient(180deg, #0f172a 0%, #0d1f3c 100%)",
          p: 3,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <Skeleton
            variant="circular"
            width={88}
            height={88}
            sx={{ bgcolor: "rgba(255,255,255,0.08)" }}
          />
          <Skeleton variant="text" width="50%" height={18} sx={{ bgcolor: "rgba(255,255,255,0.07)" }} />
          <Skeleton variant="text" width="35%" height={13} sx={{ bgcolor: "rgba(255,255,255,0.05)" }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width="100%" height={56} sx={{ borderRadius: "12px", bgcolor: "rgba(255,255,255,0.04)" }} />
          ))}
        </Stack>
      </Grid>
    </Grid>
  );
};

// Typing indicator — three smooth bouncing dots
const TypingLoader = () => {
  return (
    <Box
      sx={{
        alignSelf: "flex-start",
        bgcolor: "white",
        borderRadius: "18px 18px 18px 4px",
        px: 2,
        py: 1.2,
        display: "inline-flex",
        gap: 0.6,
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {[0.1, 0.25, 0.4].map((delay, i) => (
        <BouncingSkeleton
          key={i}
          variant="circular"
          width={8}
          height={8}
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </Box>
  );
};

export { TypingLoader, LayoutLoader };

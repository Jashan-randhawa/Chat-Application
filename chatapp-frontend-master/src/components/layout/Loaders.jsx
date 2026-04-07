import { Grid, Skeleton, Stack, Box, Typography } from "@mui/material";
import React from "react";
import { BouncingSkeleton } from "../styles/StyledComponents";

const LayoutLoader = () => {
  return (
    <Grid container height={"calc(100vh - 3.75rem)"} sx={{ overflow: "hidden" }}>
      {/* Sidebar skeleton — WA white */}
      <Grid item sm={4} md={3}
        sx={{ display: { xs: "none", sm: "block" }, bgcolor: "#ffffff" }}
        height={"100%"}
      >
        {/* Search bar skeleton */}
        <Box sx={{ p: 1.5, bgcolor: "#f0f2f5" }}>
          <Skeleton variant="rounded" height={38} sx={{ borderRadius: "8px", bgcolor: "#e9edef" }} />
        </Box>
        <Stack>
          {Array.from({ length: 9 }).map((_, index) => (
            <Box key={index} sx={{
              display: "flex", alignItems: "center", gap: 1.5,
              px: 2, py: 1.5, borderBottom: "1px solid #f5f6f6",
            }}>
              <Skeleton variant="circular" width={50} height={50} sx={{ bgcolor: "#e9edef", flexShrink: 0 }} />
              <Box flex={1}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Skeleton variant="text" width="50%" height={14} sx={{ bgcolor: "#e9edef" }} />
                  <Skeleton variant="text" width="20%" height={12} sx={{ bgcolor: "#f0f0f0" }} />
                </Box>
                <Skeleton variant="text" width="70%" height={12} sx={{ bgcolor: "#f5f6f6" }} />
              </Box>
            </Box>
          ))}
        </Stack>
      </Grid>

      {/* Chat area skeleton — WA beige */}
      <Grid item xs={12} sm={8} md={5} lg={6} height={"100%"}
        sx={{ p: "0.75rem 5%", bgcolor: "#efeae2" }}
      >
        <Stack spacing={1.25}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Box key={index} sx={{
              display: "flex",
              justifyContent: index % 3 === 0 ? "flex-end" : "flex-start",
            }}>
              <Skeleton
                variant="rounded"
                width={`${Math.random() * 180 + 80}px`}
                height={44}
                sx={{
                  borderRadius: "12px",
                  bgcolor: index % 3 === 0 ? "rgba(217,253,211,0.7)" : "rgba(255,255,255,0.7)",
                }}
              />
            </Box>
          ))}
        </Stack>
      </Grid>

      {/* Profile skeleton */}
      <Grid item md={4} lg={3} height={"100%"}
        sx={{ display: { xs: "none", md: "block" }, bgcolor: "#ffffff" }}
      >
        <Box sx={{ bgcolor: "#008069", px: 3, pt: 4, pb: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Skeleton variant="text" width="30%" height={18} sx={{ bgcolor: "rgba(255,255,255,0.25)", alignSelf: "flex-start" }} />
          <Skeleton variant="circular" width={96} height={96} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
          <Skeleton variant="text" width="55%" height={20} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
          <Skeleton variant="text" width="40%" height={14} sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />
        </Box>
        <Box sx={{ mt: -2, mx: 2 }}>
          <Box sx={{ bgcolor: "white", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", p: 2 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Box key={i} sx={{ display: "flex", gap: 2, py: 1.5, borderBottom: i < 3 ? "1px solid #f5f6f6" : "none" }}>
                <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: "#e9edef", flexShrink: 0 }} />
                <Box flex={1}>
                  <Skeleton variant="text" width="35%" height={11} sx={{ bgcolor: "#f0f0f0", mb: 0.3 }} />
                  <Skeleton variant="text" width="70%" height={14} sx={{ bgcolor: "#e9edef" }} />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

// WA-style typing indicator with green dots
const TypingLoader = () => {
  return (
    <Box sx={{
      alignSelf: "flex-start",
      bgcolor: "#ffffff",
      borderRadius: "2px 12px 12px 12px",
      px: 1.5, py: 1,
      display: "inline-flex",
      gap: 0.5,
      alignItems: "center",
      boxShadow: "0 1px 2px rgba(0,0,0,0.13)",
    }}>
      {[0, 0.18, 0.36].map((delay, i) => (
        <BouncingSkeleton
          key={i}
          variant="circular"
          width={7}
          height={7}
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </Box>
  );
};

export { TypingLoader, LayoutLoader };

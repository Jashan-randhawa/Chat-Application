import {
  Dialog,
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React from "react";

/**
 * ResponsiveDialog – renders a bottom Drawer on mobile (< sm) and a centered
 * Dialog on desktop (>= sm). All extra props are forwarded to the underlying
 * MUI component so callers can pass `PaperProps`, `sx`, etc.
 */
const ResponsiveDialog = ({
  open,
  onClose,
  children,
  drawerProps = {},
  dialogProps = {},
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderRadius: "16px 16px 0 0",
            maxHeight: "92vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
          ...drawerProps.PaperProps,
        }}
        {...drawerProps}
      >
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: "20px",
          maxWidth: 500,
          width: "100%",
          overflow: "hidden",
        },
        ...dialogProps.PaperProps,
      }}
      {...dialogProps}
    >
      {children}
    </Dialog>
  );
};

export default ResponsiveDialog;

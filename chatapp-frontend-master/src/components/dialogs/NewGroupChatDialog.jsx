import { useInputValidation } from "6pp";
import {
  Box,
  Button,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useAsyncMutation, useErrors } from "../../hooks/hook";
import {
  useAvailableFriendsQuery,
  useNewGroupMutation,
} from "../../redux/api/api";
import { setIsNewGroup } from "../../redux/reducers/misc";
import UserItem from "../shared/UserItem";
import ResponsiveDialog from "./ResponsiveDialog";

const NewGroupChatDialog = () => {
  const { isNewGroup } = useSelector((state) => state.misc);
  const dispatch = useDispatch();

  const { isError, isLoading, error, data } = useAvailableFriendsQuery();
  const [newGroup, isLoadingNewGroup] = useAsyncMutation(useNewGroupMutation);

  const groupName = useInputValidation("");
  const groupDescription = useInputValidation("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [nameError, setNameError] = useState("");

  useErrors([{ isError, error }]);

  const selectMemberHandler = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id)
        ? prev.filter((currElement) => currElement !== id)
        : [...prev, id]
    );
  };

  const submitHandler = () => {
      setNameError("Group name is required");
      return;
    }
    if (groupName.value.trim().length < 3) {
      setNameError("Group name must be at least 3 characters");
      return;
    }
    if (selectedMembers.length < 2) {
      return toast.error("Please select at least 2 other members");
    }
    setNameError("");
    newGroup("Creating New Group...", {
      name: groupName.value.trim(),
      members: selectedMembers,
    });
    closeHandler();
  };

  const closeHandler = () => {
    dispatch(setIsNewGroup(false));
    setNameError("");
  };

  const paperSx = {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      bgcolor: "rgba(255,255,255,0.04)",
      color: "#f1f5f9",
      "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
      "&:hover fieldset": { borderColor: "rgba(14,165,233,0.4)" },
      "&.Mui-focused fieldset": { borderColor: "#0ea5e9" },
    },
    "& .MuiInputLabel-root": {
      color: "rgba(148,163,184,0.6)",
      "&.Mui-focused": { color: "#0ea5e9" },
    },
    "& input, & textarea": { color: "#f1f5f9" },
  };

  return (
    <ResponsiveDialog
      open={isNewGroup}
      onClose={closeHandler}
      drawerProps={{ PaperProps: { sx: paperSx } }}
      dialogProps={{ PaperProps: { sx: { ...paperSx, maxWidth: 500 } } }}
    >
      <Stack
        p={{ xs: "1rem", sm: "1.75rem" }}
        spacing={2.5}
        sx={{ overflowY: "auto", flex: 1 }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GroupIcon sx={{ fontSize: 18, color: "white" }} />
            </Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: "1.1rem",
                color: "#f1f5f9",
                letterSpacing: "-0.02em",
              }}
            >
              New Group Chat
            </Typography>
          </Stack>
          <IconButton
            onClick={closeHandler}
            size="small"
            aria-label="Close new group dialog"
            sx={{
              color: "rgba(148,163,184,0.6)",
              width: 44,
              height: 44,
              "&:hover": { color: "#f1f5f9", bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Group name */}
        <TextField
          label="Group Name *"
          value={groupName.value}
          onChange={(e) => {
            groupName.changeHandler(e);
            if (nameError) setNameError("");
          }}
          error={Boolean(nameError)}
          helperText={nameError}
          size="small"
          inputProps={{ maxLength: 50, "aria-required": "true" }}
          sx={{
            ...inputSx,
            "& .MuiFormHelperText-root": { color: "#f87171" },
          }}
        />

        {/* Description */}
        <TextField
          label="Description (optional)"
          value={groupDescription.value}
          onChange={groupDescription.changeHandler}
          size="small"
          multiline
          rows={2}
          inputProps={{ maxLength: 200 }}
          sx={inputSx}
        />

        {/* Members */}
        <Box>
          <Typography
            sx={{
              color: "rgba(148,163,184,0.7)",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            Select Members ({selectedMembers.length} selected)
          </Typography>

          <Box
            sx={{
              maxHeight: { xs: "35vh", sm: 240 },
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: 4 },
              "&::-webkit-scrollbar-thumb": {
                bgcolor: "rgba(255,255,255,0.1)",
                borderRadius: 4,
              },
            }}
          >
            {isLoading ? (
              <Stack spacing={1}>
                {[1, 2, 3].map((i) => (
                  <Box
                    key={i}
                    sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 0.5 }}
                  >
                    <Skeleton
                      variant="circular"
                      width={40}
                      height={40}
                      sx={{ bgcolor: "rgba(255,255,255,0.07)" }}
                    />
                    <Skeleton
                      variant="text"
                      width="50%"
                      sx={{ bgcolor: "rgba(255,255,255,0.07)" }}
                    />
                  </Box>
                ))}
              </Stack>
            ) : data?.friends?.length > 0 ? (
              data.friends.map((i) => (
                <UserItem
                  user={i}
                  key={i._id}
                  handler={selectMemberHandler}
                  isAdded={selectedMembers.includes(i._id)}
                  nameColor="rgba(226,232,240,0.9)"
                  hoverBg="rgba(255,255,255,0.04)"
                />
              ))
            ) : (
              <Typography
                sx={{
                  textAlign: "center",
                  color: "rgba(148,163,184,0.5)",
                  fontSize: "0.85rem",
                  py: 2,
                }}
              >
                No friends available
              </Typography>
            )}
          </Box>
        </Box>

        {/* Actions */}
        <Stack direction="row" justifyContent="flex-end" gap={1}>
          <Button
            onClick={closeHandler}
            sx={{
              color: "rgba(148,163,184,0.7)",
              borderRadius: "10px",
              textTransform: "none",
              minHeight: 44,
              "&:hover": { bgcolor: "rgba(255,255,255,0.04)", color: "#f1f5f9" },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={submitHandler}
            disabled={isLoadingNewGroup}
            sx={{
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              color: "white",
              borderRadius: "10px",
              px: 2.5,
              fontWeight: 600,
              textTransform: "none",
              minHeight: 44,
              boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
              "&:hover": { background: "linear-gradient(135deg, #0284c7, #4f46e5)" },
              "&:disabled": {
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.3)",
              },
            }}
          >
            Create Group
          </Button>
        </Stack>
      </Stack>
    </ResponsiveDialog>
  );
};

export default NewGroupChatDialog;

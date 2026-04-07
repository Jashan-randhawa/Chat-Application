// ============================================================
// REDESIGNED NewGroup dialog — dark themed group creation
// Changes: dark card style, gradient submit button,
//          styled member list with checkmarks
// ============================================================

import { useInputValidation } from "6pp";
import {
  Button,
  Dialog,
  Skeleton,
  Stack,
  Box,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import React, { useState } from "react";
import UserItem from "../shared/UserItem";
import { useDispatch, useSelector } from "react-redux";
import {
  useAvailableFriendsQuery,
  useNewGroupMutation,
} from "../../redux/api/api";
import { useAsyncMutation, useErrors } from "../../hooks/hook";
import { setIsNewGroup } from "../../redux/reducers/misc";
import toast from "react-hot-toast";

const NewGroup = () => {
  const { isNewGroup } = useSelector((state) => state.misc);
  const dispatch = useDispatch();

  const { isError, isLoading, error, data } = useAvailableFriendsQuery();
  const [newGroup, isLoadingNewGroup] = useAsyncMutation(useNewGroupMutation);

  const groupName = useInputValidation("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  useErrors([{ isError, error }]);

  const selectMemberHandler = (id) => {
    setSelectedMembers((prev) =>
      prev.includes(id)
        ? prev.filter((currElement) => currElement !== id)
        : [...prev, id]
    );
  };

  const submitHandler = () => {
    if (!groupName.value) return toast.error("Group name is required");
    if (selectedMembers.length < 2) return toast.error("Please select at least 3 members");
    newGroup("Creating New Group...", {
      name: groupName.value,
      members: selectedMembers,
    });
    closeHandler();
  };

  const closeHandler = () => dispatch(setIsNewGroup(false));

  return (
    <Dialog
      onClose={closeHandler}
      open={isNewGroup}
      PaperProps={{
        sx: {
          borderRadius: "20px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          minWidth: { xs: "90vw", sm: "420px" },
          overflow: "hidden",
        },
      }}
    >
      <Stack p={"1.75rem"} spacing={2.5}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box sx={{
              width: 36, height: 36, borderRadius: "10px",
              background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <GroupIcon sx={{ fontSize: 18, color: "white" }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#f1f5f9", letterSpacing: "-0.02em" }}>
              New Group
            </Typography>
          </Stack>
          <IconButton
            onClick={closeHandler}
            size="small"
            sx={{ color: "rgba(148,163,184,0.6)", "&:hover": { color: "#f1f5f9", bgcolor: "rgba(255,255,255,0.06)" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Group name input */}
        <TextField
          label="Group Name"
          value={groupName.value}
          onChange={groupName.changeHandler}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              bgcolor: "rgba(255,255,255,0.04)",
              color: "#f1f5f9",
              "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
              "&:hover fieldset": { borderColor: "rgba(14,165,233,0.4)" },
              "&.Mui-focused fieldset": { borderColor: "#0ea5e9" },
            },
            "& .MuiInputLabel-root": { color: "rgba(148,163,184,0.6)", "&.Mui-focused": { color: "#0ea5e9" } },
            "& input": { color: "#f1f5f9" },
          }}
        />

        {/* Members label */}
        <Box>
          <Typography sx={{ color: "rgba(148,163,184,0.7)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mb: 1 }}>
            Select Members ({selectedMembers.length} selected)
          </Typography>

          <Box sx={{
            maxHeight: 260,
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 4 },
          }}>
            {isLoading ? (
              <Stack spacing={1}>
                {[1,2,3].map(i => (
                  <Box key={i} sx={{ display:"flex", alignItems:"center", gap:1.5, p:0.5 }}>
                    <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor:"rgba(255,255,255,0.07)" }} />
                    <Skeleton variant="text" width="50%" sx={{ bgcolor:"rgba(255,255,255,0.07)" }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              data?.friends?.map((i) => (
                <UserItem
                  user={i}
                  key={i._id}
                  handler={selectMemberHandler}
                  isAdded={selectedMembers.includes(i._id)}
                />
              ))
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
              boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
              "&:hover": { background: "linear-gradient(135deg, #0284c7, #4f46e5)" },
              "&:disabled": { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" },
            }}
          >
            Create Group
          </Button>
        </Stack>
      </Stack>
    </Dialog>
  );
};

export default NewGroup;

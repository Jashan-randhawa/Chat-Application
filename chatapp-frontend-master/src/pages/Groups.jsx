// ============================================================
// REDESIGNED Groups page — modern group management UI
// Changes: dark sidebar panel, styled group list, improved
//          member cards, gradient action buttons, clean layout
// ============================================================

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Done as DoneIcon,
  Edit as EditIcon,
  KeyboardBackspace as KeyboardBackspaceIcon,
  Menu as MenuIcon,
  Group as GroupIcon,
  PeopleAlt as PeopleAltIcon,
} from "@mui/icons-material";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Drawer,
  Grid,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { Suspense, lazy, memo, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LayoutLoader } from "../components/layout/Loaders";
import AvatarCard from "../components/shared/AvatarCard";
import { Link } from "../components/styles/StyledComponents";
import { useDispatch, useSelector } from "react-redux";
import UserItem from "../components/shared/UserItem";
import { useAsyncMutation, useErrors } from "../hooks/hook";
import {
  useChatDetailsQuery,
  useDeleteChatMutation,
  useMyGroupsQuery,
  useRemoveGroupMemberMutation,
  useRenameGroupMutation,
} from "../redux/api/api";
import { setIsAddMember } from "../redux/reducers/misc";
import { motion } from "framer-motion";

const ConfirmDeleteDialog = lazy(() =>
  import("../components/dialogs/ConfirmDeleteDialog")
);
const AddMemberDialog = lazy(() =>
  import("../components/dialogs/AddMemberDialog")
);

const Groups = () => {
  const chatId = useSearchParams()[0].get("group");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAddMember } = useSelector((state) => state.misc);

  const myGroups = useMyGroupsQuery("");
  const groupDetails = useChatDetailsQuery(
    { chatId, populate: true },
    { skip: !chatId }
  );

  const [updateGroup, isLoadingGroupName] = useAsyncMutation(useRenameGroupMutation);
  const [removeMember, isLoadingRemoveMember] = useAsyncMutation(useRemoveGroupMemberMutation);
  const [deleteGroup, isLoadingDeleteGroup] = useAsyncMutation(useDeleteChatMutation);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupNameUpdatedValue, setGroupNameUpdatedValue] = useState("");
  const [members, setMembers] = useState([]);

  const errors = [
    { isError: myGroups.isError, error: myGroups.error },
    { isError: groupDetails.isError, error: groupDetails.error },
  ];
  useErrors(errors);

  useEffect(() => {
    const groupData = groupDetails.data;
    if (groupData) {
      setGroupName(groupData.chat.name);
      setGroupNameUpdatedValue(groupData.chat.name);
      setMembers(groupData.chat.members);
    }
    return () => {
      setGroupName("");
      setGroupNameUpdatedValue("");
      setMembers([]);
      setIsEdit(false);
    };
  }, [groupDetails.data]);

  useEffect(() => {
    if (chatId) {
      setGroupName(`Group Name ${chatId}`);
      setGroupNameUpdatedValue(`Group Name ${chatId}`);
    }
    return () => {
      setGroupName("");
      setGroupNameUpdatedValue("");
      setIsEdit(false);
    };
  }, [chatId]);

  const navigateBack = () => navigate("/");
  const handleMobile = () => setIsMobileMenuOpen((prev) => !prev);
  const handleMobileClose = () => setIsMobileMenuOpen(false);
  const updateGroupName = () => {
    setIsEdit(false);
    updateGroup("Updating Group Name...", { chatId, name: groupNameUpdatedValue });
  };
  const openConfirmDeleteHandler = () => setConfirmDeleteDialog(true);
  const closeConfirmDeleteHandler = () => setConfirmDeleteDialog(false);
  const openAddMemberHandler = () => dispatch(setIsAddMember(true));
  const deleteHandler = () => {
    deleteGroup("Deleting Group...", chatId);
    closeConfirmDeleteHandler();
    navigate("/groups");
  };
  const removeMemberHandler = (userId) => removeMember("Removing Member...", { chatId, userId });

  return myGroups.isLoading ? (
    <LayoutLoader />
  ) : (
    <Grid container height={"100vh"} sx={{ overflow: "hidden" }}>
      {/* Groups sidebar */}
      <Grid
        item
        sm={4}
        md={3}
        sx={{
          display: { xs: "none", sm: "block" },
          background: "linear-gradient(180deg, #0f172a 0%, #1a2744 100%)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          height: "100%",
          overflowY: "auto",
        }}
      >
        <GroupsList myGroups={myGroups?.data?.groups} chatId={chatId} />
      </Grid>

      {/* Main panel */}
      <Grid
        item
        xs={12}
        sm={8}
        md={9}
        sx={{
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: "#f8fafc",
          height: "100%",
          overflowY: "auto",
        }}
      >
        {/* Mobile menu toggle */}
        <Box sx={{ display: { xs: "block", sm: "none" }, position: "fixed", right: "1rem", top: "1rem", zIndex: 10 }}>
          <IconButton
            onClick={handleMobile}
            sx={{
              bgcolor: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              "&:hover": { bgcolor: "white" },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Back button */}
        <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <Tooltip title="Back to chats">
            <IconButton
              onClick={navigateBack}
              sx={{
                bgcolor: "#0f172a",
                color: "white",
                borderRadius: "10px",
                "&:hover": { bgcolor: "#1e293b" },
              }}
            >
              <KeyboardBackspaceIcon />
            </IconButton>
          </Tooltip>
          <Typography sx={{ fontWeight: 700, color: "#1e293b", fontSize: "1.1rem" }}>
            Group Management
          </Typography>
        </Box>

        {groupName ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem", gap: "1.5rem", flex: 1 }}
          >
            {/* Group avatar */}
            <Box
              sx={{
                width: 72, height: 72, borderRadius: "20px",
                background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(14,165,233,0.35)",
              }}
            >
              <GroupIcon sx={{ fontSize: 32, color: "white" }} />
            </Box>

            {/* Group name */}
            <Stack direction={"row"} alignItems={"center"} spacing={1}>
              {isEdit ? (
                <>
                  <TextField
                    value={groupNameUpdatedValue}
                    onChange={(e) => setGroupNameUpdatedValue(e.target.value)}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "10px",
                        "& fieldset": { borderColor: "rgba(14,165,233,0.4)" },
                        "&.Mui-focused fieldset": { borderColor: "#0ea5e9" },
                      },
                    }}
                  />
                  <IconButton
                    onClick={updateGroupName}
                    disabled={isLoadingGroupName}
                    sx={{
                      bgcolor: "#0ea5e9", color: "white", borderRadius: "10px",
                      "&:hover": { bgcolor: "#0284c7" },
                    }}
                  >
                    <DoneIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: "#1e293b", letterSpacing: "-0.03em" }}>
                    {groupName}
                  </Typography>
                  <IconButton
                    disabled={isLoadingGroupName}
                    onClick={() => setIsEdit(true)}
                    size="small"
                    sx={{ color: "#64748b", "&:hover": { color: "#0ea5e9", bgcolor: "rgba(14,165,233,0.08)" } }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Stack>

            {/* Members section */}
            <Box sx={{ width: "100%", maxWidth: 520 }}>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <PeopleAltIcon sx={{ fontSize: 16, color: "#64748b" }} />
                <Typography sx={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Members ({members.length})
                </Typography>
              </Stack>

              <Box
                sx={{
                  bgcolor: "white",
                  borderRadius: "16px",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  overflow: "hidden",
                  maxHeight: "40vh",
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { width: 4 },
                  "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(0,0,0,0.1)", borderRadius: 4 },
                }}
              >
                {isLoadingRemoveMember ? (
                  <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                    <CircularProgress size={28} sx={{ color: "#0ea5e9" }} />
                  </Box>
                ) : (
                  members.map((i) => (
                    <Box key={i._id} sx={{
                      px: 1, py: 0.5,
                      borderBottom: "1px solid rgba(0,0,0,0.04)",
                      "&:last-child": { borderBottom: "none" },
                    }}>
                      <UserItem
                        user={i}
                        isAdded
                        handler={removeMemberHandler}
                        styling={{ "&:hover": { bgcolor: "rgba(244,63,94,0.04)" } }}
                      />
                    </Box>
                  ))
                )}
              </Box>
            </Box>

            {/* Action buttons */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                startIcon={<DeleteIcon />}
                onClick={openConfirmDeleteHandler}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  color: "#f43f5e",
                  borderColor: "rgba(244,63,94,0.3)",
                  border: "1.5px solid",
                  px: 2.5,
                  "&:hover": { bgcolor: "rgba(244,63,94,0.06)", borderColor: "#f43f5e" },
                }}
              >
                Delete Group
              </Button>
              <Button
                startIcon={<AddIcon />}
                onClick={openAddMemberHandler}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  background: "linear-gradient(135deg, #0ea5e9, #6366f1)",
                  color: "white",
                  px: 2.5,
                  boxShadow: "0 4px 12px rgba(14,165,233,0.3)",
                  "&:hover": { background: "linear-gradient(135deg, #0284c7, #4f46e5)" },
                }}
              >
                Add Member
              </Button>
            </Stack>
          </motion.div>
        ) : (
          /* Empty state */
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, p: 4 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: "20px",
              background: "rgba(14,165,233,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <GroupIcon sx={{ fontSize: 30, color: "#0ea5e9" }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: "#1e293b" }}>
              Select a group
            </Typography>
            <Typography sx={{ color: "#64748b", fontSize: "0.85rem", textAlign: "center", maxWidth: 260 }}>
              Choose a group from the sidebar to manage its members and settings.
            </Typography>
          </Box>
        )}
      </Grid>

      {isAddMember && (
        <Suspense fallback={<Backdrop open />}>
          <AddMemberDialog chatId={chatId} />
        </Suspense>
      )}

      {confirmDeleteDialog && (
        <Suspense fallback={<Backdrop open />}>
          <ConfirmDeleteDialog
            open={confirmDeleteDialog}
            handleClose={closeConfirmDeleteHandler}
            deleteHandler={deleteHandler}
          />
        </Suspense>
      )}

      {/* Mobile drawer */}
      <Drawer
        sx={{ display: { xs: "block", sm: "none" } }}
        open={isMobileMenuOpen}
        onClose={handleMobileClose}
        PaperProps={{
          sx: {
            background: "linear-gradient(180deg, #0f172a 0%, #1a2744 100%)",
            width: "72vw",
            maxWidth: 300,
          },
        }}
      >
        <GroupsList w={"100%"} myGroups={myGroups?.data?.groups} chatId={chatId} />
      </Drawer>
    </Grid>
  );
};

// Groups sidebar list
const GroupsList = ({ w = "100%", myGroups = [], chatId }) => (
  <Stack width={w} height={"100%"} sx={{ overflowY: "auto" }}>
    <Box sx={{ px: 2, py: 1.75, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <Typography sx={{ color: "rgba(148,163,184,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        My Groups
      </Typography>
    </Box>

    {myGroups.length > 0 ? (
      myGroups.map((group, index) => (
        <GroupListItem group={group} chatId={chatId} key={group._id} index={index} />
      ))
    ) : (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.85rem" }}>
          No groups yet
        </Typography>
      </Box>
    )}
  </Stack>
);

const GroupListItem = memo(({ group, chatId, index = 0 }) => {
  const { name, avatar, _id } = group;
  const isActive = chatId === _id;

  return (
    <Link
      to={`?group=${_id}`}
      onClick={(e) => { if (isActive) e.preventDefault(); }}
    >
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.7rem 1rem",
          borderLeft: isActive ? "3px solid #0ea5e9" : "3px solid transparent",
          background: isActive
            ? "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.1))"
            : "transparent",
          transition: "all 0.15s ease",
        }}
      >
        <AvatarCard avatar={avatar} />
        <Typography
          sx={{
            color: isActive ? "#e2e8f0" : "rgba(226,232,240,0.7)",
            fontWeight: isActive ? 600 : 400,
            fontSize: "0.88rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </Typography>
      </motion.div>
    </Link>
  );
});

export default Groups;

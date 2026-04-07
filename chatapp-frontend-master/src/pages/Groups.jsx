import {
  Add as AddIcon, Delete as DeleteIcon, Done as DoneIcon,
  Edit as EditIcon, KeyboardBackspace as KeyboardBackspaceIcon,
  Menu as MenuIcon, Group as GroupIcon, PeopleAlt as PeopleAltIcon,
} from "@mui/icons-material";
import {
  Backdrop, Box, Button, CircularProgress, Drawer, Grid,
  IconButton, Stack, TextField, Tooltip, Typography,
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
  useChatDetailsQuery, useDeleteChatMutation, useMyGroupsQuery,
  useRemoveGroupMemberMutation, useRenameGroupMutation,
} from "../redux/api/api";
import { setIsAddMember } from "../redux/reducers/misc";

const ConfirmDeleteDialog = lazy(() => import("../components/dialogs/ConfirmDeleteDialog"));
const AddMemberDialog = lazy(() => import("../components/dialogs/AddMemberDialog"));

const Groups = () => {
  const chatId = useSearchParams()[0].get("group");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAddMember } = useSelector((state) => state.misc);

  const myGroups = useMyGroupsQuery("");
  const groupDetails = useChatDetailsQuery({ chatId, populate: true }, { skip: !chatId });

  const [updateGroup, isLoadingGroupName] = useAsyncMutation(useRenameGroupMutation);
  const [removeMember, isLoadingRemoveMember] = useAsyncMutation(useRemoveGroupMemberMutation);
  const [deleteGroup, isLoadingDeleteGroup] = useAsyncMutation(useDeleteChatMutation);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupNameUpdatedValue, setGroupNameUpdatedValue] = useState("");
  const [members, setMembers] = useState([]);

  useErrors([
    { isError: myGroups.isError, error: myGroups.error },
    { isError: groupDetails.isError, error: groupDetails.error },
  ]);

  useEffect(() => {
    const groupData = groupDetails.data;
    if (groupData) {
      setGroupName(groupData.chat.name);
      setGroupNameUpdatedValue(groupData.chat.name);
      setMembers(groupData.chat.members);
    }
    return () => { setGroupName(""); setGroupNameUpdatedValue(""); setMembers([]); setIsEdit(false); };
  }, [groupDetails.data]);

  useEffect(() => {
    if (chatId) { setGroupName(`Group Name ${chatId}`); setGroupNameUpdatedValue(`Group Name ${chatId}`); }
    return () => { setGroupName(""); setGroupNameUpdatedValue(""); setIsEdit(false); };
  }, [chatId]);

  const navigateBack = () => navigate("/");
  const updateGroupName = () => { setIsEdit(false); updateGroup("Updating Group Name...", { chatId, name: groupNameUpdatedValue }); };
  const deleteHandler = () => { deleteGroup("Deleting Group...", chatId); setConfirmDeleteDialog(false); navigate("/groups"); };
  const removeMemberHandler = (userId) => removeMember("Removing Member...", { chatId, userId });

  return myGroups.isLoading ? <LayoutLoader /> : (
    <Grid container height={"100vh"} sx={{ overflow: "hidden" }}>
      {/* Groups sidebar — WA white */}
      <Grid item sm={4} md={3} sx={{
        display: { xs: "none", sm: "block" },
        bgcolor: "#ffffff", borderRight: "1px solid #e9edef",
        height: "100%", overflowY: "auto",
      }}>
        <GroupsList myGroups={myGroups?.data?.groups} chatId={chatId} />
      </Grid>

      {/* Main panel */}
      <Grid item xs={12} sm={8} md={9} sx={{
        display: "flex", flexDirection: "column",
        position: "relative", bgcolor: "#f0f2f5", height: "100%",
      }}>
        {/* Mobile menu toggle */}
        <Box sx={{ display: { xs: "block", sm: "none" }, position: "fixed", right: "1rem", top: "1rem", zIndex: 10 }}>
          <IconButton onClick={() => setIsMobileMenuOpen(p => !p)}
            sx={{ bgcolor: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            <MenuIcon />
          </IconButton>
        </Box>

        {/* Header */}
        <Box sx={{
          bgcolor: "#008069", px: 2, py: 1.5,
          display: "flex", alignItems: "center", gap: 1.5,
        }}>
          <Tooltip title="Back to chats">
            <IconButton onClick={navigateBack}
              sx={{ color: "rgba(255,255,255,0.85)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}>
              <KeyboardBackspaceIcon />
            </IconButton>
          </Tooltip>
          <Typography sx={{
            fontWeight: 600, color: "white", fontSize: "1rem",
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}>
            Group Management
          </Typography>
        </Box>

        {groupName ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", p: 3, gap: 2.5, flex: 1, overflowY: "auto" }}>
            {/* Group avatar */}
            <Box sx={{
              width: 80, height: 80, borderRadius: "50%",
              bgcolor: "#00a884",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,168,132,0.35)",
            }}>
              <GroupIcon sx={{ fontSize: 36, color: "white" }} />
            </Box>

            {/* Group name edit */}
            <Stack direction="row" alignItems="center" spacing={1}>
              {isEdit ? (
                <>
                  <TextField
                    value={groupNameUpdatedValue}
                    onChange={(e) => setGroupNameUpdatedValue(e.target.value)}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px", bgcolor: "white",
                        "& fieldset": { borderColor: "#e9edef" },
                        "&.Mui-focused fieldset": { borderColor: "#00a884" },
                      },
                    }}
                  />
                  <IconButton onClick={updateGroupName} disabled={isLoadingGroupName}
                    sx={{ bgcolor: "#00a884", color: "white", borderRadius: "8px", "&:hover": { bgcolor: "#008069" } }}>
                    <DoneIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <Typography sx={{
                    fontWeight: 700, fontSize: "1.4rem", color: "#111b21",
                    fontFamily: "'Segoe UI', system-ui, sans-serif",
                  }}>
                    {groupName}
                  </Typography>
                  <IconButton onClick={() => setIsEdit(true)} disabled={isLoadingGroupName} size="small"
                    sx={{ color: "#8696a0", "&:hover": { color: "#00a884", bgcolor: "#e7f8f4" } }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </Stack>

            {/* Members */}
            <Box sx={{ width: "100%", maxWidth: 520 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <PeopleAltIcon sx={{ fontSize: 16, color: "#8696a0" }} />
                <Typography sx={{
                  color: "#8696a0", fontSize: "0.75rem", fontWeight: 600,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}>
                  {members.length} Members
                </Typography>
              </Box>

              <Box sx={{
                bgcolor: "white", borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden", maxHeight: "40vh", overflowY: "auto",
                "&::-webkit-scrollbar": { width: 4 },
                "&::-webkit-scrollbar-thumb": { bgcolor: "#d1d7db", borderRadius: 4 },
              }}>
                {isLoadingRemoveMember ? (
                  <Box sx={{ p: 3, display: "flex", justifyContent: "center" }}>
                    <CircularProgress size={28} sx={{ color: "#00a884" }} />
                  </Box>
                ) : (
                  members.map((i) => (
                    <Box key={i._id} sx={{ borderBottom: "1px solid #f5f6f6", "&:last-child": { borderBottom: "none" } }}>
                      <UserItem user={i} isAdded handler={removeMemberHandler} />
                    </Box>
                  ))
                )}
              </Box>
            </Box>

            {/* Actions */}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button startIcon={<AddIcon />} onClick={() => dispatch(setIsAddMember(true))}
                sx={{
                  borderRadius: "8px", textTransform: "none", fontWeight: 600,
                  bgcolor: "#00a884", color: "white", px: 3, py: 1,
                  "&:hover": { bgcolor: "#008069" },
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}>
                Add Member
              </Button>
              <Button startIcon={<DeleteIcon />} onClick={() => setConfirmDeleteDialog(true)}
                sx={{
                  borderRadius: "8px", textTransform: "none", fontWeight: 600,
                  color: "#ef4444", border: "1.5px solid #fca5a5", px: 3, py: 1,
                  "&:hover": { bgcolor: "#fef2f2", borderColor: "#ef4444" },
                  fontFamily: "'Segoe UI', system-ui, sans-serif",
                }}>
                Delete Group
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, p: 4 }}>
            <Box sx={{ width: 200, height: 200, borderRadius: "50%", bgcolor: "#e9edef", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <GroupIcon sx={{ fontSize: 80, color: "#8696a0" }} />
            </Box>
            <Typography sx={{ fontWeight: 500, fontSize: "1.15rem", color: "#54656f",
              fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              Select a group
            </Typography>
            <Typography sx={{ color: "#8696a0", fontSize: "0.875rem", textAlign: "center", maxWidth: 280,
              fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
              Choose a group from the sidebar to manage its members and settings.
            </Typography>
          </Box>
        )}
      </Grid>

      {isAddMember && <Suspense fallback={<Backdrop open />}><AddMemberDialog chatId={chatId} /></Suspense>}
      {confirmDeleteDialog && (
        <Suspense fallback={<Backdrop open />}>
          <ConfirmDeleteDialog open={confirmDeleteDialog} handleClose={() => setConfirmDeleteDialog(false)} deleteHandler={deleteHandler} />
        </Suspense>
      )}

      <Drawer sx={{ display: { xs: "block", sm: "none" } }}
        open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}
        PaperProps={{ sx: { bgcolor: "#ffffff", width: "75vw", maxWidth: 300 } }}
      >
        <GroupsList w="100%" myGroups={myGroups?.data?.groups} chatId={chatId} />
      </Drawer>
    </Grid>
  );
};

const GroupsList = ({ w = "100%", myGroups = [], chatId }) => (
  <Stack width={w} height="100%" sx={{ overflowY: "auto" }}>
    {/* Header */}
    <Box sx={{ bgcolor: "#008069", px: 2, py: 1.75 }}>
      <Typography sx={{
        color: "white", fontWeight: 600, fontSize: "1rem",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        Groups
      </Typography>
    </Box>
    {/* Search */}
    <Box sx={{ px: 1.5, py: 1.25, bgcolor: "#f0f2f5" }}>
      <Box sx={{
        display: "flex", alignItems: "center", gap: 1,
        bgcolor: "white", borderRadius: "8px", px: 1.5, py: 0.75,
      }}>
        <Box sx={{ fontSize: 14, color: "#8696a0" }}>🔍</Box>
        <Typography sx={{ color: "#8696a0", fontSize: "0.875rem",
          fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
          Search groups
        </Typography>
      </Box>
    </Box>

    {myGroups.length > 0 ? (
      myGroups.map((group) => (
        <GroupListItem group={group} chatId={chatId} key={group._id} />
      ))
    ) : (
      <Box sx={{ py: 5, textAlign: "center" }}>
        <Typography sx={{ color: "#8696a0", fontSize: "0.875rem",
          fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
          No groups yet
        </Typography>
      </Box>
    )}
  </Stack>
);

const GroupListItem = memo(({ group, chatId }) => {
  const { name, avatar, _id } = group;
  const isActive = chatId === _id;

  return (
    <Link to={`?group=${_id}`} onClick={(e) => { if (isActive) e.preventDefault(); }}>
      <Box sx={{
        display: "flex", alignItems: "center", gap: 1.5,
        px: 2, py: 1.5,
        borderBottom: "1px solid #f5f6f6",
        bgcolor: isActive ? "#f0f2f5" : "transparent",
        borderLeft: isActive ? "3px solid #00a884" : "3px solid transparent",
        transition: "background 0.1s ease",
        "&:hover": { bgcolor: "#f5f6f6" },
      }}>
        <AvatarCard avatar={avatar} />
        <Typography sx={{
          color: "#111b21",
          fontWeight: isActive ? 600 : 400,
          fontSize: "0.9375rem",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}>
          {name}
        </Typography>
      </Box>
    </Link>
  );
});

export default Groups;

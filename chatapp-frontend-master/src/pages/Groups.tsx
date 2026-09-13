import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import {
  getMyGroups,
  getChatDetails,
  renameGroup,
  removeMember,
  deleteChat,
  leaveGroup,
  addMembers,
  getMyFriends,
  newGroupChat,
} from "@/services/api";
import ChatAvatar from "@/components/chat/Avatar";
import {
  ArrowLeft,
  Edit2,
  Check,
  Trash2,
  UserPlus,
  UserMinus,
  UsersRound,
  Loader2,
  X,
  Plus,
  Search,
  MessageCircle,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { LUXURY_PALETTES } from "@/config/palette";
import PaletteSwitcher from "@/components/PaletteSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Group {
  _id: string;
  name: string;
  avatar: string[];
  groupChat: boolean;
  creator?: string;
}

interface Member {
  _id: string;
  name: string;
  username?: string;
  avatar?: { url: string };
}

export default function Groups() {
  const navigate = useNavigate();
  const { user, palette, onlineUsers } = useAppStore();
  const activeTheme = LUXURY_PALETTES[palette] || LUXURY_PALETTES.violet;

  const [searchParams, setSearchParams] = useSearchParams();
  const chatId = searchParams.get("group");

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");

  // Selected Group Details
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState("");
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");

  // Create Group Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [allFriends, setAllFriends] = useState<any[]>([]);
  const [selectedFriendsForCreate, setSelectedFriendsForCreate] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [friendsForCreateLoading, setFriendsForCreateLoading] = useState(false);

  // Add Member to Existing Group Modal
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableFriends, setAvailableFriends] = useState<any[]>([]);
  const [selectedFriendsToAdd, setSelectedFriendsToAdd] = useState<string[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (chatId) fetchGroupDetails();
    else {
      setCurrentChat(null);
      setMembers([]);
      setGroupName("");
      setIsEditing(false);
    }
  }, [chatId]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await getMyGroups();
      setGroups(data.groups || []);
    } catch {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async () => {
    if (!chatId) return;
    setDetailLoading(true);
    try {
      const { data } = await getChatDetails(chatId, true);
      const chat = data.chat;
      setCurrentChat(chat);
      setGroupName(chat.name || "Unnamed Group");
      setEditName(chat.name || "Unnamed Group");
      setMembers(chat.members || []);
    } catch {
      toast.error("Failed to load group details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRename = async () => {
    if (!chatId || !editName.trim()) return;
    try {
      await renameGroup(chatId, editName.trim());
      toast.success("Group renamed successfully");
      setGroupName(editName.trim());
      setIsEditing(false);
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to rename group");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!chatId) return;
    if (!confirm(`Remove ${memberName} from this group?`)) return;
    try {
      await removeMember(chatId, memberId);
      toast.success(`${memberName} removed`);
      setMembers((prev) => prev.filter((m) => m._id !== memberId));
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove member");
    }
  };

  const handleDeleteGroup = async () => {
    if (!chatId) return;
    if (!confirm("Are you sure you want to permanently delete this group?")) return;
    try {
      await deleteChat(chatId);
      toast.success("Group deleted successfully");
      setSearchParams({});
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete group");
    }
  };

  const handleLeaveGroup = async () => {
    if (!chatId) return;
    if (!confirm("Are you sure you want to leave this group?")) return;
    try {
      await leaveGroup(chatId);
      toast.success("You left the group");
      setSearchParams({});
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to leave group");
    }
  };

  // Open Add Member Modal
  const openAddMember = async () => {
    setShowAddMember(true);
    setSelectedFriendsToAdd([]);
    setFriendsLoading(true);
    try {
      const { data } = await getMyFriends(chatId || undefined);
      setAvailableFriends(data.friends || []);
    } catch {
      setAvailableFriends([]);
    } finally {
      setFriendsLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (!chatId || selectedFriendsToAdd.length === 0) return;
    setAddingMembers(true);
    try {
      await addMembers(chatId, selectedFriendsToAdd);
      toast.success("Members added successfully!");
      setShowAddMember(false);
      setSelectedFriendsToAdd([]);
      fetchGroupDetails();
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add members");
    } finally {
      setAddingMembers(false);
    }
  };

  // Open Create Group Modal
  const openCreateModal = async () => {
    setShowCreateModal(true);
    setNewGroupName("");
    setSelectedFriendsForCreate([]);
    setFriendsForCreateLoading(true);
    try {
      const { data } = await getMyFriends();
      setAllFriends(data.friends || []);
    } catch {
      setAllFriends([]);
    } finally {
      setFriendsForCreateLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }
    if (selectedFriendsForCreate.length < 2) {
      toast.error("Please select at least 2 friends to create a group");
      return;
    }
    setCreatingGroup(true);
    try {
      const { data } = await newGroupChat(newGroupName.trim(), selectedFriendsForCreate);
      toast.success(data.message || "Group created successfully!");
      setShowCreateModal(false);
      await fetchGroups();
      if (data.chatId) {
        setSearchParams({ group: data.chatId });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  const filteredGroups = useMemo(() => {
    return groups.filter((g) =>
      g.name.toLowerCase().includes(searchFilter.toLowerCase())
    );
  }, [groups, searchFilter]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase())
    );
  }, [members, memberSearch]);

  const isCreator = currentChat?.creator === user?._id;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden text-foreground">
      {/* Top Application Header */}
      <header className="h-14 border-b border-border/80 px-4 md:px-6 flex items-center justify-between bg-card/60 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Return to messages"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Messages</span>
          </button>
          <div className="h-4 w-px bg-border/80" />
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs",
                activeTheme.dotColor
              )}
            >
              <UsersRound className="w-4 h-4" />
            </div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight">Group Hub</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className={cn(
              "flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-white shadow-xs transition-opacity hover:opacity-90 cursor-pointer",
              activeTheme.dotColor
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>
          <div className="h-4 w-px bg-border/80 mx-1" />
          <PaletteSwitcher compact align="right" />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Workspace Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Groups List */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-border bg-card flex flex-col h-full",
            chatId ? "hidden md:flex" : "flex"
          )}
        >
          {/* Search box */}
          <div className="p-3 border-b border-border/70">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search your groups..."
                className="w-full bg-muted/60 rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-border transition-all placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Groups list */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading groups...</span>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <UsersRound className="w-6 h-6 text-muted-foreground opacity-60" />
                </div>
                <p className="text-sm font-semibold">No groups found</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  {searchFilter
                    ? "Try a different search query"
                    : "Create your first group to start collaborating"}
                </p>
                {!searchFilter && (
                  <button
                    onClick={openCreateModal}
                    className="mt-4 text-xs font-semibold text-primary hover:underline"
                  >
                    + Create a Group
                  </button>
                )}
              </div>
            ) : (
              filteredGroups.map((g) => {
                const isSelected = chatId === g._id;
                return (
                  <button
                    key={g._id}
                    onClick={() => setSearchParams({ group: g._id })}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all relative cursor-pointer",
                      isSelected
                        ? "bg-accent/80 dark:bg-zinc-800/70 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-primary"
                        : "hover:bg-accent/40"
                    )}
                  >
                    <div className="relative shrink-0">
                      <ChatAvatar name={g.name} src={g.avatar?.[0]} size="md" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-xs">
                        <UsersRound className="w-2.5 h-2.5 text-primary-foreground" />
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "font-semibold text-sm truncate",
                          isSelected && activeTheme.accentText
                        )}
                      >
                        {g.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span>Group Chat</span>
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Group Details & Workspace */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-slate-50/50 dark:bg-[#0b0f17] overflow-y-auto",
            chatId ? "flex" : "hidden md:flex"
          )}
        >
          {!chatId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-3xl bg-card border border-border/80 flex items-center justify-center shadow-md mb-4">
                <UsersRound className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Select a Group</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                Choose a group from the list on the left to inspect members, rename, or manage settings.
              </p>
              <button
                onClick={openCreateModal}
                className={cn(
                  "mt-4 inline-flex items-center gap-2 py-2 px-4 rounded-xl text-white text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer",
                  activeTheme.dotColor
                )}
              >
                <Plus className="w-4 h-4" />
                <span>Create New Group</span>
              </button>
            </div>
          ) : detailLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-4 md:p-8 max-w-3xl w-full mx-auto space-y-6">
              {/* Mobile Back button */}
              <div className="md:hidden flex items-center gap-2 mb-2">
                <button
                  onClick={() => setSearchParams({})}
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground py-1 px-2 rounded-lg hover:bg-accent cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Groups List</span>
                </button>
              </div>

              {/* Group Hero Card */}
              <div className="bg-card rounded-3xl border border-border/80 p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-3xl flex items-center justify-center text-white text-2xl font-bold shadow-lg",
                      activeTheme.dotColor
                    )}
                  >
                    <UsersRound className="w-10 h-10" />
                  </div>
                  {isCreator && (
                    <span
                      title="Group Owner"
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs"
                    >
                      ★
                    </span>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2 max-w-md">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Group name"
                        className="bg-muted px-3 py-1.5 text-sm font-semibold rounded-xl outline-none focus:ring-2 focus:ring-primary/30 flex-1 border border-border"
                        autoFocus
                      />
                      <button
                        onClick={handleRename}
                        className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(groupName);
                        }}
                        className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl font-bold tracking-tight text-foreground">
                        {groupName}
                      </h2>
                      {isCreator && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
                          title="Edit group name"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-accent text-muted-foreground font-medium">
                      {members.length} member{members.length === 1 ? "" : "s"}
                    </span>
                    {isCreator && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Group Creator
                      </span>
                    )}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/?chat=${chatId}`)}
                    className={cn(
                      "flex items-center gap-2 py-2 px-4 rounded-xl text-white text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer",
                      activeTheme.dotColor
                    )}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Open Chat</span>
                  </button>
                  <button
                    onClick={openAddMember}
                    className="flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-semibold bg-accent/80 hover:bg-accent text-foreground border border-border/60 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span className="hidden sm:inline">Add Member</span>
                  </button>
                </div>
              </div>

              {/* Members Section */}
              <div className="bg-card rounded-3xl border border-border/80 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Members</h3>
                    <p className="text-xs text-muted-foreground">
                      People with access to this conversation
                    </p>
                  </div>
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="Filter members..."
                      className="w-full bg-muted/60 rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-border transition-all"
                    />
                  </div>
                </div>

                <div className="divide-y divide-border/40 rounded-2xl border border-border/60 overflow-hidden bg-background/50">
                  {filteredMembers.map((m) => {
                    const isMemberOnline = onlineUsers.includes(m._id);
                    const isThisMemberCreator = m._id === currentChat?.creator;
                    const isSelf = m._id === user?._id;

                    return (
                      <div
                        key={m._id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors"
                      >
                        <div className="relative shrink-0">
                          <ChatAvatar name={m.name} src={m.avatar?.url} size="md" />
                          {isMemberOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm truncate text-foreground">
                              {m.name}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                                You
                              </span>
                            )}
                            {isThisMemberCreator && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                Creator
                              </span>
                            )}
                          </div>
                          {m.username && (
                            <p className="text-xs text-muted-foreground truncate">
                              @{m.username}
                            </p>
                          )}
                        </div>

                        {isCreator && !isSelf && (
                          <button
                            onClick={() => handleRemoveMember(m._id, m.name)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Remove member"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-destructive/5 rounded-3xl border border-destructive/20 p-5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-destructive">
                    {isCreator ? "Delete this group" : "Leave this group"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isCreator
                      ? "Permanently removes all messages, media, and members for this group."
                      : "You will no longer receive updates or messages from this group."}
                  </p>
                </div>
                {isCreator ? (
                  <button
                    onClick={handleDeleteGroup}
                    className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:opacity-90 transition-opacity shrink-0 cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Group</span>
                  </button>
                ) : (
                  <button
                    onClick={handleLeaveGroup}
                    className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs font-semibold transition-colors shrink-0 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Leave Group</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE GROUP MODAL ── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-white",
                      activeTheme.dotColor
                    )}
                  >
                    <UsersRound className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm">Create New Group</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
                    Group Name
                  </label>
                  <input
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter group title..."
                    className="w-full bg-muted/60 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-border placeholder:text-muted-foreground"
                    autoFocus
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Select Friends (min. 2)
                    </label>
                    <span className="text-xs text-primary font-semibold">
                      {selectedFriendsForCreate.length} selected
                    </span>
                  </div>

                  {friendsForCreateLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  ) : allFriends.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl">
                      No friends available to add. Connect with friends first!
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40 rounded-xl border border-border max-h-48 overflow-y-auto bg-background/50">
                      {allFriends.map((f) => {
                        const isChecked = selectedFriendsForCreate.includes(f._id);
                        return (
                          <label
                            key={f._id}
                            className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-accent/40 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedFriendsForCreate([...selectedFriendsForCreate, f._id]);
                                } else {
                                  setSelectedFriendsForCreate(
                                    selectedFriendsForCreate.filter((id) => id !== f._id)
                                  );
                                }
                              }}
                              className="rounded border-border text-primary focus:ring-primary"
                            />
                            <ChatAvatar name={f.name} src={f.avatar} size="sm" />
                            <span className="text-xs font-medium flex-1 truncate">{f.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/80 text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={creatingGroup || !newGroupName.trim() || selectedFriendsForCreate.length < 2}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50",
                    activeTheme.dotColor
                  )}
                >
                  {creatingGroup ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create Group</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── ADD MEMBER TO EXISTING GROUP MODAL ── */}
      <AnimatePresence>
        {showAddMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm">Add Members to Group</h3>
                </div>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Select friends to add to this group</p>
                  <span className="text-xs text-primary font-semibold">
                    {selectedFriendsToAdd.length} selected
                  </span>
                </div>

                {friendsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : availableFriends.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl">
                    All your friends are already in this group!
                  </div>
                ) : (
                  <div className="divide-y divide-border/40 rounded-xl border border-border max-h-56 overflow-y-auto bg-background/50">
                    {availableFriends.map((f) => {
                      const isChecked = selectedFriendsToAdd.includes(f._id);
                      return (
                        <label
                          key={f._id}
                          className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-accent/40 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFriendsToAdd([...selectedFriendsToAdd, f._id]);
                              } else {
                                setSelectedFriendsToAdd(
                                  selectedFriendsToAdd.filter((id) => id !== f._id)
                                );
                              }
                            }}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          <ChatAvatar name={f.name} src={f.avatar} size="sm" />
                          <span className="text-xs font-medium flex-1 truncate">{f.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-border bg-muted/20 flex gap-2">
                <button
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/80 text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMembers}
                  disabled={addingMembers || selectedFriendsToAdd.length === 0}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50",
                    activeTheme.dotColor
                  )}
                >
                  {addingMembers ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Add {selectedFriendsToAdd.length > 0 && `(${selectedFriendsToAdd.length})`}</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


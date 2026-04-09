import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { getMyGroups, getChatDetails, renameGroup, removeMember, deleteChat, addMembers, getMyFriends } from "@/services/api";
import ChatAvatar from "@/components/chat/Avatar";
import { ArrowLeft, Edit2, Check, Trash2, UserPlus, UserMinus, Users, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Group {
  _id: string;
  name: string;
  avatar: string[];
  groupChat: boolean;
}

interface Member {
  _id: string;
  name: string;
  avatar?: { url: string };
}

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatId = searchParams.get("group");

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupName, setGroupName] = useState("");
  const [editName, setEditName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add member
  const [showAddMember, setShowAddMember] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (chatId) fetchGroupDetails();
  }, [chatId]);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await getMyGroups();
      setGroups(data.groups || []);
    } catch { }
    finally { setLoading(false); }
  };

  const fetchGroupDetails = async () => {
    if (!chatId) return;
    setDetailLoading(true);
    try {
      const { data } = await getChatDetails(chatId, true);
      setGroupName(data.chat.name);
      setEditName(data.chat.name);
      setMembers(data.chat.members || []);
    } catch { }
    finally { setDetailLoading(false); }
  };

  const handleRename = async () => {
    if (!chatId || !editName.trim()) return;
    try {
      await renameGroup(chatId, editName);
      toast.success("Group renamed!");
      setGroupName(editName);
      setIsEditing(false);
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!chatId) return;
    try {
      await removeMember(chatId, userId);
      toast.success("Member removed");
      setMembers((prev) => prev.filter((m) => m._id !== userId));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const handleDelete = async () => {
    if (!chatId) return;
    if (!confirm("Delete this group?")) return;
    try {
      await deleteChat(chatId);
      toast.success("Group deleted");
      setSearchParams({});
      fetchGroups();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const openAddMember = async () => {
    setShowAddMember(true);
    setFriendsLoading(true);
    try {
      const { data } = await getMyFriends(chatId || undefined);
      setFriends(data.friends || []);
    } catch { setFriends([]); }
    finally { setFriendsLoading(false); }
  };

  const handleAddMembers = async () => {
    if (!chatId || selectedFriends.length === 0) return;
    try {
      await addMembers(chatId, selectedFriends);
      toast.success("Members added!");
      setShowAddMember(false);
      setSelectedFriends([]);
      fetchGroupDetails();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Groups list sidebar */}
      <div className={cn("w-full md:w-80 flex-shrink-0 border-r border-border bg-card flex flex-col", chatId ? "hidden md:flex" : "flex")}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <button onClick={() => navigate("/")} className="p-1.5 rounded-full hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">My Groups</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-sm">No groups yet</p>
            </div>
          ) : (
            groups.map((g) => (
              <button key={g._id} onClick={() => setSearchParams({ group: g._id })}
                className={cn("w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 text-left transition-colors",
                  chatId === g._id && "bg-accent")}>
                <ChatAvatar name={g.name} src={g.avatar?.[0]} size="lg" />
                <span className="font-semibold text-sm truncate">{g.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Group details */}
      <div className={cn("flex-1 flex flex-col", chatId ? "flex" : "hidden md:flex")}>
        {!chatId ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Select a group to manage</p>
          </div>
        ) : detailLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Header on mobile */}
            <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border">
              <button onClick={() => setSearchParams({})} className="p-1.5 rounded-full hover:bg-accent">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-semibold">Group Details</span>
            </div>

            <div className="flex flex-col items-center p-6 gap-4">
              {/* Group avatar */}
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                <Users className="w-10 h-10 text-primary-foreground" />
              </div>

              {/* Name */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="bg-muted rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                    <button onClick={handleRename} className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setIsEditing(false); setEditName(groupName); }}
                      className="p-2 rounded-full hover:bg-accent"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold">{groupName}</h2>
                    <button onClick={() => setIsEditing(true)} className="p-2 rounded-full hover:bg-accent text-muted-foreground">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Members */}
              <div className="w-full max-w-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted-foreground">{members.length} Members</span>
                  <button onClick={openAddMember}
                    className="flex items-center gap-1 text-sm text-primary hover:underline">
                    <UserPlus className="w-4 h-4" /> Add
                  </button>
                </div>

                {/* Add member panel */}
                {showAddMember && (
                  <div className="bg-muted rounded-xl p-4 mb-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Add Members</span>
                      <button onClick={() => setShowAddMember(false)}><X className="w-4 h-4" /></button>
                    </div>
                    {friendsLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                    ) : friends.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center">No friends available to add</p>
                    ) : (
                      <>
                        <div className="space-y-1 max-h-32 overflow-y-auto mb-2">
                          {friends.map((f) => (
                            <label key={f._id} className="flex items-center gap-2 py-1 cursor-pointer">
                              <input type="checkbox" checked={selectedFriends.includes(f._id)}
                                onChange={(e) => setSelectedFriends(e.target.checked
                                  ? [...selectedFriends, f._id]
                                  : selectedFriends.filter((id) => id !== f._id)
                                )}
                                className="rounded" />
                              <ChatAvatar name={f.name} src={f.avatar} size="sm" />
                              <span className="text-sm">{f.name}</span>
                            </label>
                          ))}
                        </div>
                        <button onClick={handleAddMembers}
                          className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold hover:opacity-90">
                          Add ({selectedFriends.length})
                        </button>
                      </>
                    )}
                  </div>
                )}

                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  {members.map((m) => (
                    <div key={m._id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
                      <ChatAvatar name={m.name} src={m.avatar?.url} size="md" />
                      <span className="flex-1 text-sm font-medium truncate">{m.name}</span>
                      {m._id !== user?._id && (
                        <button onClick={() => handleRemoveMember(m._id)}
                          className="p-1.5 rounded-full text-destructive hover:bg-destructive/10 transition-colors">
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Delete */}
              <button onClick={handleDelete}
                className="flex items-center gap-2 text-sm text-destructive hover:underline mt-4">
                <Trash2 className="w-4 h-4" /> Delete Group
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

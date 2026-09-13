import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Shield,
  UserMinus,
  UserPlus,
  Phone,
  Trash2,
  LogOut,
  Edit2,
  Image,
  FileText,
  Music,
  Video,
  Download,
  Check,
  Loader2,
} from "lucide-react";
import { useAppStore, type Chat, type Message } from "@/store/appStore";
import ChatAvatar from "./Avatar";
import {
  getChatDetails,
  renameGroup,
  addMembers,
  removeMember,
  leaveGroup,
  deleteChat,
  getMyFriends,
} from "@/services/api";
import { toast } from "sonner";
import { fileFormat } from "@/lib/features";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat;
  messages: Message[];
  onCall?: () => void;
  onRefreshChats: () => void;
  onCloseChat?: () => void;
}

interface ChatMember {
  _id: string;
  name: string;
  avatar?: string;
}

interface FriendItem {
  _id: string;
  name: string;
  avatar: { url: string };
}

export default function ChatDetailsSheet({
  open,
  onOpenChange,
  chat,
  messages,
  onCall,
  onRefreshChats,
  onCloseChat,
}: Props) {
  const { user } = useAppStore();
  const [detail, setDetail] = useState<{
    _id: string;
    name: string;
    groupChat: boolean;
    creator?: string;
    members: ChatMember[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "media">("members");

  // Rename Dialog
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Add Members Dialog
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  // Leave & Delete Confirmations
  const [actionLoading, setActionLoading] = useState(false);

  const isCreator = chat.groupChat && detail?.creator === user?._id;

  const fetchDetails = async () => {
    if (!chat._id) return;
    setLoading(true);
    try {
      const { data } = await getChatDetails(chat._id, true);
      setDetail(data.chat);
      setNewName(data.chat.name);
    } catch {
      // Fallback to basic chat object
      setDetail({
        _id: chat._id,
        name: chat.name,
        groupChat: chat.groupChat,
        members: chat.members.map((m) => ({ _id: m, name: "Member" })),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchDetails();
    }
  }, [open, chat._id]);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim() === detail?.name) return;
    setRenaming(true);
    try {
      await renameGroup(chat._id, newName.trim());
      toast.success("Group renamed successfully");
      setRenameOpen(false);
      fetchDetails();
      onRefreshChats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to rename group");
    } finally {
      setRenaming(false);
    }
  };

  const handleOpenAddMembers = async () => {
    setAddMembersOpen(true);
    setSelectedFriends([]);
    try {
      const { data } = await getMyFriends(chat._id);
      setFriends(data.friends || []);
    } catch {
      toast.error("Failed to load friends");
    }
  };

  const handleAddMembers = async () => {
    if (!selectedFriends.length) return;
    setAddingMembers(true);
    try {
      await addMembers(chat._id, selectedFriends);
      toast.success("Members added successfully");
      setAddMembersOpen(false);
      setSelectedFriends([]);
      fetchDetails();
      onRefreshChats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to add members");
    } finally {
      setAddingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from the group?`)) return;
    try {
      await removeMember(chat._id, memberId);
      toast.success(`${memberName} removed`);
      fetchDetails();
      onRefreshChats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove member");
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    setActionLoading(true);
    try {
      await leaveGroup(chat._id);
      toast.success("You left the group");
      onOpenChange(false);
      onCloseChat?.();
      onRefreshChats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to leave group");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteChat = async () => {
    const promptText = chat.groupChat
      ? "Are you sure you want to delete this group? All messages and attachments will be deleted permanently."
      : "Are you sure you want to delete this chat history?";
    if (!confirm(promptText)) return;
    setActionLoading(true);
    try {
      await deleteChat(chat._id);
      toast.success("Chat deleted successfully");
      onOpenChange(false);
      onCloseChat?.();
      onRefreshChats();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete chat");
    } finally {
      setActionLoading(false);
    }
  };

  // Collect all attachments from messages
  const attachments = messages.flatMap((m) => m.attachments || []);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-border text-center flex flex-col items-center">
            <div className="relative mb-3">
              <ChatAvatar name={chat.name} src={chat.avatar?.[0]} size="lg" />
              {chat.groupChat && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shadow-md">
                  <Users className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <span>{detail?.name || chat.name}</span>
              {isCreator && (
                <button
                  onClick={() => setRenameOpen(true)}
                  className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                  title="Rename group"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </SheetTitle>

            <p className="text-xs text-muted-foreground mt-0.5">
              {chat.groupChat
                ? `Group • ${detail?.members.length || chat.members.length} members`
                : "Direct Conversation"}
            </p>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-center gap-4 mt-4 w-full">
              {!chat.groupChat && onCall && (
                <button
                  onClick={() => {
                    onOpenChange(false);
                    onCall();
                  }}
                  className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>Voice Call</span>
                </button>
              )}

              {isCreator && (
                <button
                  onClick={handleOpenAddMembers}
                  className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <span>Add Member</span>
                </button>
              )}
            </div>
          </SheetHeader>

          {/* Navigation Tabs */}
          <div className="flex border-b border-border bg-card">
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === "members"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {chat.groupChat ? `Members (${detail?.members.length || chat.members.length})` : "Chat Overview"}
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors cursor-pointer ${
                activeTab === "media"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Shared Media ({attachments.length})
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === "members" ? (
              <div className="space-y-3">
                {chat.groupChat ? (
                  <>
                    {loading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      detail?.members.map((member) => {
                        const isMemberCreator = member._id === detail.creator;
                        const isMe = member._id === user?._id;

                        return (
                          <div
                            key={member._id}
                            className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/60"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <ChatAvatar name={member.name} src={member.avatar} size="sm" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate flex items-center gap-1.5">
                                  <span>{member.name}</span>
                                  {isMe && <span className="text-[10px] text-muted-foreground">(You)</span>}
                                  {isMemberCreator && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold rounded-md">
                                      <Shield className="w-2.5 h-2.5" /> Admin
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>

                            {/* Creator controls: remove members */}
                            {isCreator && !isMemberCreator && (
                              <button
                                onClick={() => handleRemoveMember(member._id, member.name)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title="Remove member"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </>
                ) : (
                  <div className="p-4 rounded-xl border border-border bg-card text-center space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Direct encrypted messaging channel with {chat.name}.
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      Messages and attachments are delivered with end-to-end token verification.
                    </p>
                  </div>
                )}

                {/* Danger Zone Actions */}
                <div className="pt-4 border-t border-border space-y-2">
                  {chat.groupChat && !isCreator && (
                    <button
                      onClick={handleLeaveGroup}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors text-xs font-semibold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Leave Group
                    </button>
                  )}

                  <button
                    onClick={handleDeleteChat}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors text-xs font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> {chat.groupChat ? "Delete Group" : "Delete Conversation"}
                  </button>
                </div>
              </div>
            ) : (
              /* Media Gallery Tab */
              <div className="space-y-4">
                {attachments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    No attachments shared yet in this conversation.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {attachments.map((att, i) => {
                      const type = fileFormat(att.url);
                      return (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative group aspect-square rounded-xl overflow-hidden bg-card border border-border flex items-center justify-center hover:border-primary transition-colors"
                        >
                          {type === "image" ? (
                            <img src={att.url} alt="" className="w-full h-full object-cover" />
                          ) : type === "video" ? (
                            <Video className="w-6 h-6 text-muted-foreground" />
                          ) : type === "audio" ? (
                            <Music className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <FileText className="w-6 h-6 text-muted-foreground" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Download className="w-4 h-4 text-white" />
                          </div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRename} className="space-y-4 py-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new group name"
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <DialogFooter>
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renaming}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {renaming ? "Saving…" : "Save Changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog open={addMembersOpen} onOpenChange={setAddMembersOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members to Group</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto space-y-2 py-2">
            {friends.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                All of your friends are already in this group.
              </p>
            ) : (
              friends.map((friend) => {
                const isSelected = selectedFriends.includes(friend._id);
                return (
                  <div
                    key={friend._id}
                    onClick={() => {
                      setSelectedFriends((prev) =>
                        isSelected ? prev.filter((id) => id !== friend._id) : [...prev, friend._id]
                      );
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-accent/15"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ChatAvatar name={friend.name} src={friend.avatar?.url} size="sm" />
                      <span className="text-xs font-medium">{friend.name}</span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setAddMembersOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddMembers}
              disabled={addingMembers || !selectedFriends.length}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {addingMembers ? "Adding…" : `Add (${selectedFriends.length})`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

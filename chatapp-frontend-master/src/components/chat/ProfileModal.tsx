import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Camera, User as UserIcon, AtSign, FileText, Check, Loader2, Edit3, X } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { updateMyProfile } from "@/services/api";
import ChatAvatar from "./Avatar";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileModal({ open, onOpenChange }: Props) {
  const { user, setUser } = useAppStore();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever user or modal open changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setAvatarFile(null);
      setPreviewUrl(null);
      setIsEditing(false);
    }
  }, [user, open]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("bio", bio.trim());
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const { data } = await updateMyProfile(formData);
      if (data.user) {
        setUser(data.user);
      }
      toast.success(data.message || "Profile updated successfully!");
      setIsEditing(false);
      setAvatarFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
    }
    setAvatarFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100vw-32px)] p-0 overflow-hidden border-border/80 bg-card shadow-2xl rounded-3xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              <span>User Profile</span>
            </DialogTitle>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/10 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Avatar Section with Interactive Edit Button */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <div
                className="relative rounded-full ring-4 ring-primary/20 shadow-xl overflow-hidden cursor-pointer group-hover:ring-primary/40 transition-all"
                onClick={() => fileInputRef.current?.click()}
                title="Click image to change photo"
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <ChatAvatar
                    name={user?.name || "User"}
                    src={user?.avatar?.url}
                    size="2xl"
                  />
                )}

                {/* Overlay hover prompt */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-200">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium tracking-wide">Change</span>
                </div>
              </div>

              {/* Floating Camera Badge */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer border-2 border-card"
                title="Upload new avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground mt-3 font-medium text-center">
              Click photo to change avatar
            </p>
          </div>

          {/* Form / View Fields */}
          <div className="space-y-4">
            {/* Username (read-only handle) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5" />
                <span>Username</span>
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-sm text-muted-foreground font-mono">
                @{user?.username || "username"}
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-primary" />
                <span>Display Name</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/70 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-card border border-border/60 text-sm font-semibold text-foreground">
                  {user?.name || "No name provided"}
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>About / Bio</span>
              </label>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell others a little about yourself..."
                  rows={3}
                  maxLength={200}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-muted/70 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground resize-none"
                />
              ) : (
                <div className="px-3.5 py-2.5 rounded-xl bg-card border border-border/60 text-sm text-muted-foreground min-h-[56px] leading-relaxed">
                  {user?.bio || "No bio added yet."}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {isEditing && (
          <DialogFooter className="p-4 border-t border-border/60 bg-muted/20 flex flex-row items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

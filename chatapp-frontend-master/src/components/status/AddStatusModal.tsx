import { useState, useRef } from "react";
import { X, Type, Image, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addTextStatus, addImageStatus } from "@/services/api";
import { toast } from "sonner";

const TEXT_BACKGROUNDS = [
  "#075e54", "#128c7e", "#25d366",
  "#1a1a2e", "#16213e", "#0f3460",
  "#e94560", "#533483", "#2b2d42",
  "#ef233c", "#d90429", "#8d99ae",
];

interface Props {
  onClose: () => void;
  onAdded: () => void;
}

export default function AddStatusModal({ onClose, onAdded }: Props) {
  const [mode, setMode] = useState<"text" | "image" | null>(null);
  const [text, setText] = useState("");
  const [bg, setBg] = useState(TEXT_BACKGROUNDS[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (mode === "text") {
      if (!text.trim()) { toast.error("Write something!"); return; }
      setLoading(true);
      try {
        await addTextStatus(text.trim(), bg);
        toast.success("Status posted!");
        onAdded();
        onClose();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to post");
      } finally { setLoading(false); }
    } else if (mode === "image") {
      if (!imageFile) { toast.error("Pick an image"); return; }
      const fd = new FormData();
      fd.append("type", "image");
      fd.append("content", caption);
      fd.append("avatar", imageFile); // server uses singleAvatar multer
      setLoading(true);
      try {
        await addImageStatus(fd);
        toast.success("Status posted!");
        onAdded();
        onClose();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to post");
      } finally { setLoading(false); }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mode picker */}
        {!mode && (
          <div className="bg-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Add to Status</h2>
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode("text")}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Type className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium">Text</span>
              </button>
              <button
                onClick={() => { setMode("image"); fileRef.current?.click(); }}
                className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Image className="w-6 h-6 text-emerald-500" />
                </div>
                <span className="text-sm font-medium">Photo</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
          </div>
        )}

        {/* Text editor */}
        {mode === "text" && (
          <div className="flex flex-col" style={{ minHeight: 380 }}>
            <div
              className="flex-1 flex items-center justify-center p-6 min-h-[260px] relative"
              style={{ background: bg }}
            >
              <button onClick={() => setMode(null)} className="absolute top-3 left-3 p-1.5 rounded-full bg-black/30 text-white">
                <X className="w-4 h-4" />
              </button>
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={200}
                placeholder="Type your status..."
                className="w-full bg-transparent text-white text-xl font-semibold text-center outline-none resize-none placeholder:text-white/50"
                rows={4}
              />
            </div>
            {/* Background picker */}
            <div className="bg-card px-4 py-3">
              <p className="text-xs text-muted-foreground mb-2">Background</p>
              <div className="flex gap-2 flex-wrap">
                {TEXT_BACKGROUNDS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setBg(c)}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{ background: c, borderColor: bg === c ? "white" : "transparent" }}
                  />
                ))}
              </div>
            </div>
            <div className="bg-card px-4 pb-4">
              <button
                onClick={handleSubmit}
                disabled={loading || !text.trim()}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {loading ? "Posting..." : "Post Status"}
              </button>
            </div>
          </div>
        )}

        {/* Image editor */}
        {mode === "image" && (
          <div className="flex flex-col bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button onClick={() => setMode(null)} className="p-1.5 rounded-full hover:bg-accent"><X className="w-4 h-4" /></button>
              <span className="text-sm font-semibold">Photo Status</span>
              <div />
            </div>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="preview" className="w-full max-h-72 object-cover" />
                <button
                  onClick={() => { setImageFile(null); setImagePreview(null); fileRef.current?.click(); }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white"
                >
                  <Image className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-48 bg-muted cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                <div className="text-center text-muted-foreground">
                  <Image className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Tap to pick a photo</p>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            <div className="px-4 py-3 space-y-3">
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption (optional)..."
                className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
              <button
                onClick={handleSubmit}
                disabled={loading || !imageFile}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {loading ? "Posting..." : "Post Status"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

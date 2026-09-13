import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { markStatusViewed, deleteStatusSlide } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import ChatAvatar from "../chat/Avatar";
import { toast } from "sonner";

interface ViewerItem {
  user: { _id?: string; name?: string; username?: string; avatar?: string } | string;
  viewedAt: string;
}

interface Slide {
  _id: string;
  type: "text" | "image";
  content: string;
  media?: { url: string };
  background: string;
  createdAt: string;
  viewerCount: number;
  viewedByMe: boolean;
  viewers?: ViewerItem[];
}

interface StatusEntry {
  _id: string;
  user: { _id: string; name: string; avatar?: string };
  slides: Slide[];
  isOwn: boolean;
}

interface Props {
  statuses: StatusEntry[];
  initialIndex: number;
  onClose: () => void;
  onDeleted: () => void;
}

const SLIDE_DURATION = 5000; // ms per slide

export default function StatusViewer({ statuses, initialIndex, onClose, onDeleted }: Props) {
  const { user } = useAppStore();
  const [statusIdx, setStatusIdx] = useState(initialIndex);
  const [slideIdx, setSlideIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(Date.now());
  const elapsed = useRef(0);

  const currentStatus = statuses[statusIdx];
  const currentSlide = currentStatus?.slides[slideIdx];

  const goNextSlide = useCallback(() => {
    if (!currentStatus) return;
    if (slideIdx < currentStatus.slides.length - 1) {
      setSlideIdx((i) => i + 1);
    } else if (statusIdx < statuses.length - 1) {
      setStatusIdx((i) => i + 1);
      setSlideIdx(0);
    } else {
      onClose();
    }
  }, [currentStatus, slideIdx, statusIdx, statuses.length, onClose]);

  const goPrevSlide = () => {
    if (slideIdx > 0) {
      setSlideIdx((i) => i - 1);
    } else if (statusIdx > 0) {
      setStatusIdx((i) => i - 1);
      setSlideIdx(0);
    }
  };

  // Progress bar auto-advance
  useEffect(() => {
    setProgress(0);
    elapsed.current = 0;
    startedAt.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (paused) return;
      elapsed.current = Date.now() - startedAt.current;
      const pct = Math.min((elapsed.current / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current!);
        goNextSlide();
      }
    }, 50);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slideIdx, statusIdx, paused]);

  // Mark as viewed
  useEffect(() => {
    if (!currentSlide || !currentStatus) return;
    if (currentStatus.isOwn) return;
    if (currentSlide.viewedByMe) return;
    markStatusViewed(currentStatus._id, currentSlide._id).catch(() => {});
  }, [currentSlide?._id, currentStatus?._id]);

  const handleDelete = async () => {
    if (!currentStatus || !currentSlide) return;
    try {
      await deleteStatusSlide(currentStatus._id, currentSlide._id);
      toast.success("Deleted");
      onDeleted();
      onClose();
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (!currentStatus || !currentSlide) return null;

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ago`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-2xl overflow-hidden">
        {/* Slide background */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${statusIdx}-${slideIdx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={
              currentSlide.type === "text"
                ? { background: currentSlide.background }
                : { background: "#000" }
            }
          >
            {currentSlide.type === "image" && currentSlide.media?.url && (
              <img
                src={currentSlide.media.url}
                alt="status"
                className="w-full h-full object-contain"
              />
            )}
            {currentSlide.type === "text" && (
              <div className="flex items-center justify-center h-full px-8">
                <p className="text-white text-2xl font-bold text-center leading-relaxed">
                  {currentSlide.content}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Dark gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

        {/* Progress bars */}
        <div className="absolute top-3 inset-x-3 flex gap-1 z-10">
          {currentStatus.slides.map((s, i) => (
            <div key={s._id} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < slideIdx ? "100%" : i === slideIdx ? `${progress}%` : "0%",
                  transition: i === slideIdx ? "none" : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-7 inset-x-3 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/70 flex-shrink-0">
            {currentStatus.user.avatar ? (
              <img src={currentStatus.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                {currentStatus.user.name[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{currentStatus.user.name}</p>
            <p className="text-white/60 text-xs">{timeAgo(currentSlide.createdAt)}</p>
          </div>
          {currentStatus.isOwn && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-full bg-black/40 text-white hover:bg-red-500/80 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1.5 rounded-full bg-black/40 text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Caption for images */}
        {currentSlide.type === "image" && currentSlide.content && (
          <div className="absolute bottom-16 inset-x-4 z-10">
            <p className="text-white text-center text-sm font-medium drop-shadow-lg">{currentSlide.content}</p>
          </div>
        )}

        {/* Viewer count (own status) */}
        {currentStatus.isOwn && (
          <div className="absolute bottom-4 left-4 z-10">
            <button
              onClick={() => setShowViewers(!showViewers)}
              className="flex items-center gap-1.5 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              {currentSlide.viewerCount} view{currentSlide.viewerCount !== 1 ? "s" : ""}
            </button>
          </div>
        )}

        {/* Navigation areas (tap left/right) */}
        <button
          className="absolute left-0 top-16 bottom-0 w-1/3 z-10"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => { setPaused(false); goPrevSlide(); }}
          onClick={goPrevSlide}
        />
        <button
          className="absolute right-0 top-16 bottom-0 w-1/3 z-10"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => { setPaused(false); goNextSlide(); }}
          onClick={goNextSlide}
        />

        {/* Viewers drawer (own status) */}
        <AnimatePresence>
          {showViewers && currentStatus.isOwn && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 z-20 bg-card rounded-t-2xl max-h-72 overflow-y-auto border-t border-border shadow-2xl"
            >
              <div className="px-4 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-card/95 backdrop-blur-xs z-10">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">
                    Viewed by ({currentSlide.viewerCount})
                  </span>
                </div>
                <button
                  onClick={() => setShowViewers(false)}
                  className="p-1 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(currentSlide.viewers || []).length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">No views yet</p>
              ) : (
                <div className="divide-y divide-border/40">
                  {(currentSlide.viewers || []).map((v: any, i: number) => {
                    const viewerUser =
                      typeof v.user === "object" ? v.user : { name: "User", avatar: "" };
                    return (
                      <div
                        key={i}
                        className="px-4 py-2.5 flex items-center gap-3 hover:bg-accent/40 transition-colors"
                      >
                        <ChatAvatar
                          name={viewerUser.name || "User"}
                          src={viewerUser.avatar?.url || viewerUser.avatar}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {viewerUser.name || "User"}
                          </p>
                          {viewerUser.username && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              @{viewerUser.username}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {timeAgo(v.viewedAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

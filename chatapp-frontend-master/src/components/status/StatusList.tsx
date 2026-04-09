import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { getFriendsStatuses } from "@/services/api";
import { useAppStore } from "@/store/appStore";
import { useSocket } from "@/context/SocketContext";
import { EVENTS } from "@/config/constants";
import StatusViewer from "./StatusViewer";
import AddStatusModal from "./AddStatusModal";

interface Slide {
  _id: string;
  type: "text" | "image";
  content: string;
  media?: { url: string };
  background: string;
  createdAt: string;
  viewerCount: number;
  viewedByMe: boolean;
  viewers?: any[];
}

interface StatusEntry {
  _id: string;
  user: { _id: string; name: string; avatar?: string };
  slides: Slide[];
  isOwn: boolean;
}

export default function StatusList({ fullPage = false }: { fullPage?: boolean }) {
  const { user } = useAppStore();
  const socket = useSocket();
  const [statuses, setStatuses] = useState<StatusEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIdx, setViewerIdx] = useState(0);
  const [addOpen, setAddOpen] = useState(false);

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getFriendsStatuses();
      setStatuses(data.statuses || []);
    } catch {
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchStatuses();
    socket.on(EVENTS.STATUS_UPDATED, handler);
    return () => { socket.off(EVENTS.STATUS_UPDATED, handler); };
  }, [socket, fetchStatuses]);

  const openViewer = (idx: number) => {
    setViewerIdx(idx);
    setViewerOpen(true);
  };

  const ownStatus = statuses.find((s) => s.isOwn);
  const friendStatuses = statuses.filter((s) => !s.isOwn);
  const allForViewer = ownStatus ? [ownStatus, ...friendStatuses] : friendStatuses;
  const hasUnseenFor = (s: StatusEntry) => s.slides.some((sl) => !sl.viewedByMe);

  const modals = (
    <AnimatePresence>
      {viewerOpen && allForViewer.length > 0 && (
        <StatusViewer
          statuses={allForViewer}
          initialIndex={viewerIdx}
          onClose={() => setViewerOpen(false)}
          onDeleted={fetchStatuses}
        />
      )}
      {addOpen && (
        <AddStatusModal
          onClose={() => setAddOpen(false)}
          onAdded={fetchStatuses}
        />
      )}
    </AnimatePresence>
  );

  // ── Full-page vertical list (Status sidebar panel) ──
  if (fullPage) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">My Status</p>
          <div
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={ownStatus ? () => openViewer(allForViewer.indexOf(ownStatus)) : () => setAddOpen(true)}
          >
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${ownStatus ? "border-primary" : "border-dashed border-muted-foreground"}`}>
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                    {user?.name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{ownStatus ? "My Status" : "Add Status"}</p>
              <p className="text-xs text-muted-foreground">
                {ownStatus ? `${ownStatus.slides.length} slide${ownStatus.slides.length !== 1 ? "s" : ""}` : "Tap to add"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : friendStatuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">No friend statuses</p>
              <p className="text-xs mt-1 opacity-60">Your friends' updates will appear here</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-2">Recent Updates</p>
              {friendStatuses.map((s) => {
                const idx = allForViewer.indexOf(s);
                const unseen = hasUnseenFor(s);
                return (
                  <div
                    key={s._id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => openViewer(idx)}
                  >
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full overflow-hidden border-2 p-0.5 ${unseen ? "border-primary" : "border-muted-foreground/30"}`}>
                        {s.user.avatar ? (
                          <img src={s.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold">
                            {s.user.name[0]}
                          </div>
                        )}
                      </div>

                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.user.name}</p>
                      <p className={`text-xs ${unseen ? "text-primary font-medium" : "text-muted-foreground"}`}>
                        {unseen ? "New update" : "Viewed"} · {s.slides.length} slide{s.slides.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {modals}
      </div>
    );
  }

  // ── Horizontal strip layout (Chats panel) ──
  return (
    <>
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
          <div className="flex flex-col items-center gap-1 flex-shrink-0 w-16">
            <button
              onClick={ownStatus ? () => openViewer(allForViewer.indexOf(ownStatus)) : () => setAddOpen(true)}
              className="relative"
            >
              <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${ownStatus ? "border-primary" : "border-dashed border-muted-foreground"}`}>
                {user?.avatar?.url ? (
                  <img src={user.avatar.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-bold">
                    {user?.name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background">
                <Plus className="w-3 h-3" />
              </div>
            </button>
            <span className="text-[10px] text-muted-foreground truncate w-full text-center">
              {ownStatus ? "My Status" : "Add"}
            </span>
          </div>

          {friendStatuses.map((s) => {
            const idx = allForViewer.indexOf(s);
            const unseen = hasUnseenFor(s);
            return (
              <div key={s._id} className="flex flex-col items-center gap-1 flex-shrink-0 w-16">
                <button onClick={() => openViewer(idx)} className="relative">
                  <div className={`w-12 h-12 rounded-full overflow-hidden border-2 p-0.5 ${unseen ? "border-primary" : "border-muted-foreground/30"}`}>
                    {s.user.avatar ? (
                      <img src={s.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 rounded-full flex items-center justify-center text-primary text-sm font-bold">
                        {s.user.name[0]}
                      </div>
                    )}
                  </div>

                </button>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {s.user.name.split(" ")[0]}
                </span>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center justify-center w-12 h-12 ml-2">
              <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {modals}
    </>
  );
}

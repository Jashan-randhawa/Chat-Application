import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff } from "lucide-react";

export type CallStatus = "outgoing" | "incoming" | "active";

interface CallParty {
  _id: string;
  name: string;
}

interface Props {
  status: CallStatus;
  remoteUser: CallParty;
  remoteStream: MediaStream | null;
  onAccept?: () => void;
  onDecline?: () => void;
  onEnd?: () => void;
  onToggleMute?: () => boolean; // returns new muted state
}

export default function CallModal({
  status,
  remoteUser,
  remoteStream,
  onAccept,
  onDecline,
  onEnd,
  onToggleMute,
}: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Play remote audio stream
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Timer when call is active
  useEffect(() => {
    if (status !== "active") {
      setElapsed(0);
      return;
    }
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleMute = () => {
    if (onToggleMute) {
      const nowMuted = onToggleMute();
      setIsMuted(nowMuted);
    }
  };

  const initials = remoteUser.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Hidden audio element for remote stream */}
      <audio ref={audioRef} autoPlay playsInline />

      <div className="bg-card rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 w-80 max-w-full mx-4">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary ring-4 ring-primary/30">
          {initials}
        </div>

        {/* Name & status */}
        <div className="text-center">
          <h2 className="text-xl font-semibold">{remoteUser.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {status === "outgoing" && "Calling…"}
            {status === "incoming" && "Incoming call"}
            {status === "active" && formatTime(elapsed)}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-6 w-full">
          {/* INCOMING: decline + accept */}
          {status === "incoming" && (
            <>
              <button
                onClick={onDecline}
                className="flex flex-col items-center gap-1 group"
                title="Decline"
              >
                <span className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg group-hover:bg-destructive/80 transition-colors">
                  <PhoneOff className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs text-muted-foreground">Decline</span>
              </button>

              <button
                onClick={onAccept}
                className="flex flex-col items-center gap-1 group"
                title="Accept"
              >
                <span className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg group-hover:bg-green-600 transition-colors animate-pulse">
                  <Phone className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs text-muted-foreground">Accept</span>
              </button>
            </>
          )}

          {/* OUTGOING: only end */}
          {status === "outgoing" && (
            <button
              onClick={onEnd}
              className="flex flex-col items-center gap-1 group"
              title="Cancel"
            >
              <span className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg group-hover:bg-destructive/80 transition-colors">
                <PhoneOff className="w-6 h-6 text-white" />
              </span>
              <span className="text-xs text-muted-foreground">Cancel</span>
            </button>
          )}

          {/* ACTIVE: mute + end */}
          {status === "active" && (
            <>
              <button
                onClick={handleMute}
                className="flex flex-col items-center gap-1 group"
                title={isMuted ? "Unmute" : "Mute"}
              >
                <span
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    isMuted
                      ? "bg-muted text-foreground"
                      : "bg-accent text-foreground group-hover:bg-muted"
                  }`}
                >
                  {isMuted ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isMuted ? "Unmute" : "Mute"}
                </span>
              </button>

              <button
                onClick={onEnd}
                className="flex flex-col items-center gap-1 group"
                title="End call"
              >
                <span className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg group-hover:bg-destructive/80 transition-colors">
                  <PhoneOff className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs text-muted-foreground">End</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

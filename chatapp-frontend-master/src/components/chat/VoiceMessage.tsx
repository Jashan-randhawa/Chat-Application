import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Play, Pause, Check, CheckCheck, Volume2 } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { LUXURY_PALETTES } from "@/config/palette";
import { cn } from "@/lib/utils";

interface VoiceMessageProps {
  msg: {
    from: "me" | "other";
    time: string;
    duration?: number;
    waveform?: number[];
  };
  audioUrl: string;
  isRead?: boolean;
  isDelivered?: boolean;
}

function formatDuration(seconds: number): string {
  if (Number.isNaN(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function Waveform({
  waveform,
  progress,
  isOwn,
  activeColor,
  onSeek,
}: {
  waveform: number[];
  progress: number;
  isOwn: boolean;
  activeColor: string;
  onSeek: (value: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const value = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, value)));
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="flex h-9 flex-1 cursor-pointer select-none items-center gap-[2.5px] px-1 py-1"
      title="Click to seek"
    >
      {waveform.map((h, i) => {
        const isPlayed = i / waveform.length <= progress;
        return (
          <div
            key={`${i}-${h}`}
            className="w-[3px] shrink-0 rounded-full transition-all duration-75"
            style={{
              height: Math.max(5, Math.round(h * 26 + 4)),
              backgroundColor: isPlayed
                ? isOwn
                  ? "#ffffff"
                  : activeColor
                : isOwn
                ? "rgba(255, 255, 255, 0.35)"
                : "var(--muted-foreground, #94a3b8)",
              opacity: isPlayed ? 1 : 0.45,
            }}
          />
        );
      })}
    </div>
  );
}

export default function VoiceMessage({
  msg,
  audioUrl,
  isRead,
  isDelivered,
}: VoiceMessageProps) {
  const isOwn = msg.from === "me";
  const { palette } = useAppStore();
  const activeTheme = LUXURY_PALETTES[palette] || LUXURY_PALETTES.violet;

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(msg.duration ?? 0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);

  const waveform =
    msg.waveform && msg.waveform.length > 0
      ? msg.waveform
      : [
          0.3, 0.45, 0.7, 0.9, 0.5, 0.35, 0.6, 0.8, 0.4, 0.25, 0.55, 0.85, 0.95,
          0.6, 0.4, 0.7, 0.5, 0.3, 0.45, 0.75, 0.65, 0.4, 0.5, 0.7, 0.85, 0.6,
          0.35, 0.5, 0.7, 0.4, 0.3, 0.45, 0.6, 0.5, 0.35, 0.2, 0.3, 0.4, 0.3, 0.2,
        ];

  const progress = duration > 0 ? elapsed / duration : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => {
      if (!msg.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onTime = () => setElapsed(audio.currentTime);
    const onEnded = () => {
      setPlaying(false);
      setElapsed(0);
      audio.currentTime = 0;
    };

    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [msg.duration]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    audio.currentTime = value * duration;
    setElapsed(audio.currentTime);
  };

  const toggleSpeed = () => {
    const nextRate: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  return (
    <div
      className={cn(
        "min-w-[240px] sm:min-w-[270px] max-w-[320px] rounded-2xl p-2.5 shadow-md backdrop-blur-md transition-all duration-200 select-none",
        isOwn
          ? activeTheme.sentBubbleClass
          : "bg-card/90 dark:bg-zinc-900/90 border border-border/80 text-card-foreground"
      )}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Top row: Play/Pause, Waveform */}
      <div className="flex items-center gap-2.5">
        {/* Play Button */}
        <button
          onClick={togglePlay}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 shadow-sm cursor-pointer active:scale-95",
            isOwn
              ? "bg-white/20 hover:bg-white/30 text-white border border-white/25"
              : "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/25 shadow-md"
          )}
        >
          {playing ? (
            <Pause className="h-4 w-4 fill-current" />
          ) : (
            <Play className="h-4 w-4 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Waveform Visualization */}
        <Waveform
          waveform={waveform}
          progress={progress}
          isOwn={isOwn}
          activeColor={activeTheme.waveActiveColor}
          onSeek={handleSeek}
        />
      </div>

      {/* Bottom row: Timers, Speed button, and Status ticks */}
      <div className="mt-1.5 flex items-center justify-between px-1 text-[11px]">
        <div className="flex items-center gap-2">
          {/* Duration / Elapsed */}
          <span
            className={cn(
              "font-mono font-medium tracking-tight",
              isOwn ? "text-white/80" : "text-muted-foreground"
            )}
          >
            {formatDuration(playing || elapsed > 0 ? elapsed : duration)}
          </span>

          {/* Speed Toggle Pill */}
          <button
            onClick={toggleSpeed}
            className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-tight transition-all cursor-pointer",
              isOwn
                ? "bg-white/15 text-white/90 hover:bg-white/25"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
            title="Audio playback speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Timestamp and Delivery/Read Ticks */}
        <div className="flex items-center gap-1">
          <span className={cn("text-[10px]", isOwn ? "text-white/75" : "text-muted-foreground")}>
            {msg.time}
          </span>

          {isOwn && (
            <span className="inline-flex items-center ml-0.5">
              {isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-cyan-200 drop-shadow-xs" />
              ) : isDelivered ? (
                <CheckCheck className="w-3.5 h-3.5 text-white/70" />
              ) : (
                <Check className="w-3 h-3 text-white/60" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

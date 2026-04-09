import { cn } from "@/lib/utils";
import { transformImage } from "@/lib/features";

interface AvatarProps {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  className?: string;
}

const COLORS = [
  "bg-emerald-500", "bg-sky-500", "bg-violet-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-pink-500",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return COLORS[hash % COLORS.length];
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export default function ChatAvatar({ name, src, size = "md", isOnline, className }: AvatarProps) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const imgUrl = src ? transformImage(src, size === "sm" ? 50 : size === "md" ? 80 : size === "lg" ? 100 : 150) : "";

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      {imgUrl ? (
        <img src={imgUrl} alt={name} className={cn("rounded-full object-cover", sizes[size])} loading="lazy" />
      ) : (
        <div className={cn("rounded-full flex items-center justify-center font-semibold text-white", sizes[size], getColor(name))}>
          {initials}
        </div>
      )}

    </div>
  );
}

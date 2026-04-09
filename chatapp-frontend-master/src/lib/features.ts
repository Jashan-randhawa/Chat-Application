export const transformImage = (url = "", width = 100): string => {
  if (!url) return "";
  const newUrl = url.replace("upload/", `upload/dpr_auto/w_${width}/`);
  return newUrl;
};

export const getOrSaveFromStorage = ({ key, value, get }: { key: string; value?: unknown; get?: boolean }) => {
  if (get) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  localStorage.setItem(key, JSON.stringify(value));
};

export const fileFormat = (url = ""): string => {
  const fileExt = url.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "webm", "ogg"].includes(fileExt)) return "video";
  if (["mp3", "wav", "webm", "ogg", "m4a", "aac"].includes(fileExt)) return "audio";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(fileExt)) return "image";
  return "file";
};

export const formatDate = (date: string): string => {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const formatTime = (date: string): string => {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

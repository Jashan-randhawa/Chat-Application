import { create } from "zustand";
import { getMyProfile, logoutUser } from "@/services/api";
import { EVENTS } from "@/config/constants";
import { saveToken, clearAll, getStoredUser, saveUser, getToken } from "@/lib/token";

export interface User {
  _id: string;
  name: string;
  username: string;
  avatar?: { url: string; public_id: string };
  bio?: string;
}

export interface Chat {
  _id: string;
  name: string;
  avatar: string[];
  groupChat: boolean;
  members: string[];
}

export interface Message {
  _id: string;
  content: string;
  sender: { _id: string; name: string; avatar?: string };
  chat: string;
  createdAt: string;
  attachments?: { url: string; public_id: string }[];
}

interface NewMessageAlert {
  chatId: string;
  count: number;
}

interface AppState {
  user: User | null;
  isAdmin: boolean;
  loader: boolean;
  newMessagesAlert: NewMessageAlert[];
  notificationCount: number;
  onlineUsers: string[];

  setUser: (user: User | null, token?: string) => void;
  setIsAdmin: (val: boolean) => void;
  setLoader: (val: boolean) => void;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  incrementNotification: () => void;
  resetNotificationCount: () => void;
  setNewMessagesAlert: (chatId: string) => void;
  removeNewMessagesAlert: (chatId: string) => void;
  setOnlineUsers: (users: string[]) => void;
}

const getStoredAlerts = (): NewMessageAlert[] => {
  try {
    const stored = localStorage.getItem(EVENTS.NEW_MESSAGE_ALERT);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const cachedUser = getStoredUser();
const hasToken = !!getToken();

export const useAppStore = create<AppState>((set, get) => ({
  user: cachedUser,
  isAdmin: false,
  // KEY FIX: if we have both a cached user AND a token, don't show loader
  // This prevents the flash-to-login on reload
  loader: !(cachedUser && hasToken),
  newMessagesAlert: getStoredAlerts(),
  notificationCount: 0,
  onlineUsers: [],

  setUser: (user, token) => {
    if (token) saveToken(token);
    if (user) saveUser(user); else clearAll();
    set({ user, loader: false });
  },

  setIsAdmin: (val) => set({ isAdmin: val }),
  setLoader: (val) => set({ loader: val }),

  fetchUser: async () => {
    try {
      const { data } = await getMyProfile();
      saveUser(data.user);
      set({ user: data.user, loader: false });
    } catch {
      // Token is invalid/expired — clear storage and send to login
      clearAll();
      set({ user: null, loader: false });
    }
  },

  logout: async () => {
    try { await logoutUser(); } catch { }
    clearAll();
    set({ user: null });
  },

  incrementNotification: () =>
    set((s) => ({ notificationCount: s.notificationCount + 1 })),
  resetNotificationCount: () => set({ notificationCount: 0 }),

  setNewMessagesAlert: (chatId) => {
    const alerts = [...get().newMessagesAlert];
    const idx = alerts.findIndex((a) => a.chatId === chatId);
    if (idx !== -1) alerts[idx].count += 1;
    else alerts.push({ chatId, count: 1 });
    localStorage.setItem(EVENTS.NEW_MESSAGE_ALERT, JSON.stringify(alerts));
    set({ newMessagesAlert: alerts });
  },

  removeNewMessagesAlert: (chatId) => {
    const alerts = get().newMessagesAlert.filter((a) => a.chatId !== chatId);
    localStorage.setItem(EVENTS.NEW_MESSAGE_ALERT, JSON.stringify(alerts));
    set({ newMessagesAlert: alerts });
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),
}));

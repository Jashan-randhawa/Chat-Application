import { create } from "zustand";

interface UIStore {
  isNewGroup: boolean;
  isAddMember: boolean;
  isNotification: boolean;
  isSearch: boolean;
  isFileMenu: boolean;
  isDeleteMenu: boolean;
  isProfileMenu: boolean;
  isMobile: boolean;
  isSidebarOpen: boolean;
  isUploading: boolean;
  selectedDeleteChat: {
    chatId: string;
    groupChat: boolean;
  };
  setNewGroup: (value: boolean) => void;
  setAddMember: (value: boolean) => void;
  setNotification: (value: boolean) => void;
  setSearch: (value: boolean) => void;
  setFileMenu: (value: boolean) => void;
  setDeleteMenu: (value: boolean) => void;
  setProfileMenu: (value: boolean) => void;
  setMobile: (value: boolean) => void;
  setSidebarOpen: (value: boolean) => void;
  setUploading: (value: boolean) => void;
  setSelectedDeleteChat: (chatId: string, groupChat: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isNewGroup: false,
  isAddMember: false,
  isNotification: false,
  isSearch: false,
  isFileMenu: false,
  isDeleteMenu: false,
  isProfileMenu: false,
  isMobile: false,
  isSidebarOpen: true,
  isUploading: false,
  selectedDeleteChat: { chatId: "", groupChat: false },
  setNewGroup: (value) => set({ isNewGroup: value }),
  setAddMember: (value) => set({ isAddMember: value }),
  setNotification: (value) => set({ isNotification: value }),
  setSearch: (value) => set({ isSearch: value }),
  setFileMenu: (value) => set({ isFileMenu: value }),
  setDeleteMenu: (value) => set({ isDeleteMenu: value }),
  setProfileMenu: (value) => set({ isProfileMenu: value }),
  setMobile: (value) => set({ isMobile: value }),
  setSidebarOpen: (value) => set({ isSidebarOpen: value }),
  setUploading: (value) => set({ isUploading: value }),
  setSelectedDeleteChat: (chatId, groupChat) => set({ selectedDeleteChat: { chatId, groupChat } }),
}));

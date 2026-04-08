import { create } from "zustand";
import type { User } from "../types";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAdmin: false,
  setUser: (user) => set({ user, isLoading: false }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  logout: () => set({ user: null, isAdmin: false }),
}));

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  username: string;
}

interface AuthState {
  user: User | null;
  setAuth: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setAuth: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: "auth-storage", // stores in localStorage
      partialize: (state) => ({ user: state.user }), // Only persist 'user', ignore old tokens
    },
  ),
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

const cookieStorage = {
  getItem: (name: string): string | null => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
    return null;
  },
  setItem: (name: string, value: string): void => {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
  },
  removeItem: (name: string): void => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'talkova-auth',
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);
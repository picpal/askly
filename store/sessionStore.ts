import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SessionData {
  id: string;
  code: string;
  title: string;
  description?: string;
}

interface UserData {
  id: string;
  nickname: string;
  role: string;
}

interface SessionState {
  session: SessionData | null;
  user: UserData | null;
  token: string | null;
  setSession: (session: SessionData) => void;
  setUser: (user: UserData) => void;
  setToken: (token: string) => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      token: null,
      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      clearSession: () => set({ session: null, user: null, token: null }),
    }),
    {
      name: 'askly-session',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
    }
  )
);

import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';

interface UserState {
  user: User | null;
  session: Session | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  clearSession: () => void;
}

export const useUserStore = create<UserState>((set: (partial: Partial<UserState>) => void) => ({
  user: null,
  session: null,
  setUser: (user: User | null) => set({ user }),
  setSession: (session: Session | null) => set({ session }),
  clearSession: () => set({ user: null, session: null }),
}));

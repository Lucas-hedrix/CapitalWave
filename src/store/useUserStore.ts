import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';

interface UserState {
  user: User | null;
  session: Session | null;
  depositStatus: 'none' | 'pending' | 'approved';
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setDepositStatus: (status: 'none' | 'pending' | 'approved') => void;
  clearSession: () => void;
}

export const useUserStore = create<UserState>((set: (partial: Partial<UserState>) => void) => ({
  user: null,
  session: null,
  depositStatus: 'none',
  setUser: (user: User | null) => set({ user }),
  setSession: (session: Session | null) => set({ session }),
  setDepositStatus: (status: 'none' | 'pending' | 'approved') => set({ depositStatus: status }),
  clearSession: () => set({ user: null, session: null, depositStatus: 'none' }),
}));

import { create } from 'zustand';

interface UIState {
  isSubmitting: boolean;
  setSubmitting: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSubmitting: false,
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
}));

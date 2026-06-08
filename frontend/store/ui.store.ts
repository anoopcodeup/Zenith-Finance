import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  transferOpen: boolean;
  setTransferOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
  transferOpen: false,
  setTransferOpen: (open) => set({ transferOpen: open }),
}));

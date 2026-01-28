import { create } from 'zustand';

interface UIState {
  activeModule: string;
  isSecondarySidebarOpen: boolean;
  setActiveModule: (module: string) => void;
  toggleSecondarySidebar: () => void;
  setSecondarySidebarOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: 'chat', // Default module
  isSecondarySidebarOpen: true,
  setActiveModule: (module: string) => set({ activeModule: module }),
  toggleSecondarySidebar: () =>
    set((state) => ({ isSecondarySidebarOpen: !state.isSecondarySidebarOpen })),
  setSecondarySidebarOpen: (isOpen: boolean) => set({ isSecondarySidebarOpen: isOpen }),
}));

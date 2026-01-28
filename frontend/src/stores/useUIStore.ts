import { create } from 'zustand';

interface UIState {
  activeModule: string;
  isSecondarySidebarOpen: boolean;
  secondaryNavContent: React.ReactNode | null;
  setActiveModule: (module: string) => void;
  toggleSecondarySidebar: () => void;
  setSecondarySidebarOpen: (isOpen: boolean) => void;
  setSecondaryNavContent: (content: React.ReactNode | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: 'chat', // Default module
  isSecondarySidebarOpen: true,
  secondaryNavContent: null,
  setActiveModule: (module: string) => set({ activeModule: module }),
  toggleSecondarySidebar: () =>
    set((state) => ({ isSecondarySidebarOpen: !state.isSecondarySidebarOpen })),
  setSecondarySidebarOpen: (isOpen: boolean) => set({ isSecondarySidebarOpen: isOpen }),
  setSecondaryNavContent: (content: React.ReactNode | null) => set({ secondaryNavContent: content }),
}));

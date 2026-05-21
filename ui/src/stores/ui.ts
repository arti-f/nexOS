import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { NavPage } from '@/types';

interface UIStore {
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedContainerId: string | null;
  setSelectedContainer: (id: string | null) => void;
  theme: 'dark';  // NexOS is always dark — reserved for future
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      activePage: 'overview',
      setActivePage: (page) => set({ activePage: page }),
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      selectedContainerId: null,
      setSelectedContainer: (id) => set({ selectedContainerId: id }),
      theme: 'dark',
    }),
    { name: 'nexos-ui-store' }
  )
);

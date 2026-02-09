'use client'

import { create } from 'zustand'
import { persist, devtools } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  // State
  theme: Theme
  sidebarOpen: boolean
  mobileMenuOpen: boolean

  // Actions
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        theme: 'system',
        sidebarOpen: true,
        mobileMenuOpen: false,

        // Actions
        setTheme: (theme) => set({ theme }),

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

        setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
      }),
      {
        name: 'transcrilab-ui',
        partialize: (state) => ({
          theme: state.theme,
          sidebarOpen: state.sidebarOpen,
        }),
      }
    ),
    { name: 'UIStore' }
  )
)

// Selectors
export const useTheme = () => useUIStore((state) => state.theme)
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen)
export const useMobileMenuOpen = () => useUIStore((state) => state.mobileMenuOpen)

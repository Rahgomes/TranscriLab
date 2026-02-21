'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserProfile {
  name: string
  email: string
  avatarUrl?: string
}

interface UserState {
  profile: UserProfile
  isInitialized: boolean
}

interface UserActions {
  setProfile: (profile: Partial<UserProfile>) => void
  setName: (name: string) => void
  setEmail: (email: string) => void
  setAvatarUrl: (url: string | undefined) => void
  getInitials: () => string
  reset: () => void
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Usuário',
  email: '',
  avatarUrl: undefined,
}

export const useUserStore = create<UserState & UserActions>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      isInitialized: false,

      setProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates },
          isInitialized: true,
        })),

      setName: (name) =>
        set((state) => ({
          profile: { ...state.profile, name },
        })),

      setEmail: (email) =>
        set((state) => ({
          profile: { ...state.profile, email },
        })),

      setAvatarUrl: (avatarUrl) =>
        set((state) => ({
          profile: { ...state.profile, avatarUrl },
        })),

      getInitials: () => {
        const name = get().profile.name
        if (!name) return 'U'
        const parts = name.trim().split(' ')
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
      },

      reset: () => set({ profile: DEFAULT_PROFILE, isInitialized: false }),
    }),
    {
      name: 'transcrilab-user',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
)

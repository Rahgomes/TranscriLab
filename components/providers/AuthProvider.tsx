'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/store'

interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password']

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const setProfile = useUserStore((s) => s.setProfile)
  const resetProfile = useUserStore((s) => s.reset)

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route))

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setProfile({
          name: data.user.name,
          email: data.user.email,
          avatarUrl: data.user.avatarUrl,
        })
        return data.user
      } else {
        setUser(null)
        return null
      }
    } catch {
      setUser(null)
      return null
    }
  }, [setProfile])

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true)
      await refreshUser()
      setIsLoading(false)
    }
    checkAuth()
  }, [refreshUser])

  // Redirect based on auth state
  useEffect(() => {
    if (isLoading || isRedirecting) return

    if (!user && !isPublicRoute) {
      // Not authenticated and trying to access protected route
      setIsRedirecting(true)
      router.push('/login')
    } else if (user && isPublicRoute && pathname !== '/reset-password') {
      // Authenticated and trying to access auth pages (except reset-password)
      setIsRedirecting(true)
      router.push('/')
    }
  }, [user, isLoading, isPublicRoute, pathname, router, isRedirecting])

  // Reset redirecting state when pathname changes
  useEffect(() => {
    setIsRedirecting(false)
  }, [pathname])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Erro ao fazer login')
    }

    // Set user state immediately
    setUser(data.user)
    setProfile({
      name: data.user.name,
      email: data.user.email,
      avatarUrl: data.user.avatarUrl,
    })

    // Return the user so caller knows login succeeded
    return data.user
  }

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include',
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Erro ao criar conta')
    }

    setUser(data.user)
    setProfile({
      name: data.user.name,
      email: data.user.email,
      avatarUrl: data.user.avatarUrl,
    })

    return data.user
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
    resetProfile()
    router.push('/login')
  }

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl animate-pulse">
            T
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Show loading while redirecting
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl animate-pulse">
            T
          </div>
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated and not on public route
  if (!user && !isPublicRoute) {
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

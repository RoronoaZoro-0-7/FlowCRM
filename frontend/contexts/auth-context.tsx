'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { setTokenHandlers } from '@/lib/api-service'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  organizationId?: string
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, twoFactorToken?: string) => Promise<{ requires2FA?: boolean; userId?: string }>
  logout: () => Promise<void>
  accessToken: string | null
  refreshAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token refresh interval (14 minutes - before 15 min expiry)
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Access token stored in memory only (not localStorage for security)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const router = useRouter()
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshing = useRef(false)
  // Keep token in ref for stable access from api-service
  const accessTokenRef = useRef<string | null>(null)

  // Sync ref with state
  useEffect(() => {
    accessTokenRef.current = accessToken
  }, [accessToken])

  // Refresh access token using refresh token (httpOnly cookie)
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (isRefreshing.current) return accessTokenRef.current
    
    isRefreshing.current = true
    try {
      const response = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include', // Important: sends httpOnly cookie
      })

      if (!response.ok) {
        // Refresh token invalid/expired - logout user
        setAccessToken(null)
        accessTokenRef.current = null
        setUser(null)
        localStorage.removeItem('user')
        return null
      }

      const data = await response.json()
      setAccessToken(data.accessToken)
      accessTokenRef.current = data.accessToken // Update ref immediately
      return data.accessToken
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error)
      setAccessToken(null)
      accessTokenRef.current = null
      setUser(null)
      localStorage.removeItem('user')
      return null
    } finally {
      isRefreshing.current = false
    }
  }, []) // No dependencies needed since we use refs

  // Setup automatic token refresh - stored in ref so it doesn't recreate
  const setupTokenRefreshRef = useRef<() => void>()
  setupTokenRefreshRef.current = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
    }
    
    // Refresh token periodically before it expires
    refreshIntervalRef.current = setInterval(async () => {
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        console.log('[Auth] Auto-refreshing access token...')
        await refreshAccessToken()
      }
    }, TOKEN_REFRESH_INTERVAL)
  }
  
  const setupTokenRefresh = useCallback(() => {
    setupTokenRefreshRef.current?.()
  }, [])

  // Check if user is already logged in on mount
  useEffect(() => {
    // Register token handlers with api-service once
    // Using ref getter so it always gets current token value
    setTokenHandlers(
      () => accessTokenRef.current,
      refreshAccessToken
    )
  }, []) // Only run once on mount

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        
        if (storedUser) {
          // Try to refresh token to get new access token
          const newToken = await refreshAccessToken()
          
          if (newToken) {
            setUser(JSON.parse(storedUser))
            setupTokenRefresh()
          } else {
            // Refresh failed - clear stored user
            localStorage.removeItem('user')
          }
        }
      } catch (error) {
        console.error('[Auth] Auth check failed:', error)
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Cleanup on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string, twoFactorToken?: string): Promise<{ requires2FA?: boolean; userId?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: receives httpOnly cookie
        body: JSON.stringify({ email, password, twoFactorToken }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }

      const data = await response.json()

      // Check if 2FA is required
      if (data.requires2FA) {
        return { requires2FA: true, userId: data.userId }
      }

      const { accessToken: token, user: userData } = data

      // Store access token in memory only (not localStorage)
      setAccessToken(token)
      accessTokenRef.current = token // Update ref immediately for api-service
      // Store user info in localStorage for persistence (but not the token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      // Setup automatic token refresh
      setupTokenRefresh()

      router.push('/dashboard')
      return {}
    } catch (error) {
      console.error('[Auth] Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Clear refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }

      if (accessToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          credentials: 'include',
        })
      }
    } catch (error) {
      console.error('[Auth] Logout error:', error)
    } finally {
      // Clear in-memory token
      setAccessToken(null)
      // Clear user from localStorage
      localStorage.removeItem('user')
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user && !!accessToken,
        login,
        logout,
        accessToken,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

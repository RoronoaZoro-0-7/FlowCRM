'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const router = useRouter()

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const storedUser = localStorage.getItem('user')
        if (token && storedUser) {
          setAccessToken(token)
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('[v0] Auth check failed:', error)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string, twoFactorToken?: string): Promise<{ requires2FA?: boolean; userId?: string }> => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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

      localStorage.setItem('accessToken', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setAccessToken(token)
      setUser(userData)

      router.push('/dashboard')
      return {}
    } catch (error) {
      console.error('[v0] Login error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        })
      }
    } catch (error) {
      console.error('[v0] Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      setAccessToken(null)
      setUser(null)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        accessToken,
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

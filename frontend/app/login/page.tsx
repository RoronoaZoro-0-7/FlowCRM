'use client'

import React from "react"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
  if (isAuthenticated) {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login(email, password, requires2FA ? twoFactorToken : undefined)
      
      if (result.requires2FA) {
        setRequires2FA(true)
        toast.info('Please enter your 2FA code')
      } else {
        toast.success('Login successful!')
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Login failed. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">FlowCRM</h1>
          <p className="mt-2 text-muted-foreground">
            Enterprise CRM for Modern Sales Teams
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle>Sign In</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading || requires2FA}
                  autoComplete="current-password"
                />
              </div>

              {requires2FA && (
                <div className="space-y-2">
                  <label htmlFor="twoFactorToken" className="text-sm font-medium">
                    2FA Code
                  </label>
                  <Input
                    id="twoFactorToken"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={twoFactorToken}
                    onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, ''))}
                    required
                    disabled={isLoading}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the code from your authenticator app
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Credentials Info */}
            <div className="mt-6 rounded-lg border border-border/50 bg-muted/30 p-3">
              <p className="text-xs font-semibold text-muted-foreground">
                Demo Credentials
              </p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium">Admin:</span> admin@example.com / password
                </p>
                <p>
                  <span className="font-medium">Manager:</span> manager@example.com / password
                </p>
                <p>
                  <span className="font-medium">Sales:</span> sales@example.com / password
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to our{' '}
          <Link href="#" className="hover:text-foreground underline">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  )
}

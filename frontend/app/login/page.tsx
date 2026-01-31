'use client'

import React, { useEffect } from "react"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme-toggle'
import { TrendingUp, Users, BarChart3, Shield } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // Redirect if already logged in - use useEffect to avoid setState during render
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, loading, router])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Don't render login form if authenticated
  if (isAuthenticated) {
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
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Image 
              src="/flowcrm-logo-dark.svg" 
              alt="FlowCRM" 
              width={48} 
              height={48}
              className="rounded-xl bg-white/10 p-1"
            />
            <div>
              <h1 className="text-4xl font-bold">FlowCRM</h1>
              <p className="text-primary-foreground/80">Enterprise CRM Platform</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 space-y-8">
          <h2 className="text-3xl font-semibold leading-tight">
            Streamline your sales process with powerful CRM tools
          </h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Track Deals</h3>
                <p className="text-sm text-primary-foreground/70">Monitor your sales pipeline in real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Manage Leads</h3>
                <p className="text-sm text-primary-foreground/70">Convert prospects into customers</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Analytics</h3>
                <p className="text-sm text-primary-foreground/70">Data-driven insights for your team</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Secure</h3>
                <p className="text-sm text-primary-foreground/70">Enterprise-grade security</p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="relative z-10 text-sm text-primary-foreground/60">
          © 2025 FlowCRM. All rights reserved.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen bg-background">
        {/* Top Bar with Theme Toggle */}
        <div className="flex justify-between items-center p-4">
          <div className="lg:hidden">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">FlowCRM</h1>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        {/* Login Form Container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
              <p className="mt-2 text-muted-foreground">
                Sign in to your account to continue
              </p>
            </div>

            {/* Login Card */}
            <Card className="border shadow-lg">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Sign In</CardTitle>
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
                      className="h-11"
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
                      className="h-11"
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
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the code from your authenticator app
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>

                {/* Demo Credentials Info */}
                <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Demo Credentials
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-16 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">Admin</span>
                      <span>admin@example.com / password</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-16 items-center justify-center rounded bg-green-500/10 text-xs font-medium text-green-600">Manager</span>
                      <span>manager@example.com / password</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-16 items-center justify-center rounded bg-blue-500/10 text-xs font-medium text-blue-600">Sales</span>
                      <span>sales@example.com / password</span>
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
      </div>
    </div>
  )
}

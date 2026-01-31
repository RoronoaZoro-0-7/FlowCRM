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
import { TrendingUp, Users, BarChart3, Shield, Building2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  // Redirect if already logged in
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

  // Don't render form if authenticated
  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name,
          email,
          password,
          orgName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Store the access token
      localStorage.setItem('accessToken', data.accessToken)

      toast.success('Registration successful! Welcome to FlowCRM.')
      // Reload the page to pick up the new auth state
      window.location.href = '/dashboard'
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Registration failed. Please try again.'
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
              src="/pravarit.png" 
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
            Start managing your sales with powerful CRM tools
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

      {/* Right Side - Registration Form */}
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

        {/* Registration Form Container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
              <p className="mt-2 text-muted-foreground">
                Get started with FlowCRM for your organization
              </p>
            </div>

            {/* Registration Card */}
            <Card className="border shadow-lg">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">Sign Up</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Fill in your details to create an account
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Full Name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="name"
                      className="h-11"
                    />
                  </div>

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
                    <label htmlFor="orgName" className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Organization Name
                    </label>
                    <Input
                      id="orgName"
                      type="text"
                      placeholder="Your Company"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                      disabled={isLoading}
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
                      disabled={isLoading}
                      autoComplete="new-password"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm Password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>

                {/* Already have an account */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing up, you agree to our{' '}
              <Link href="#" className="hover:text-foreground underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="hover:text-foreground underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

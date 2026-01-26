'use client'

import React from "react"

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

export function ProtectedRoute({
  children,
  requiredRoles = [],
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }

    if (
      !loading &&
      isAuthenticated &&
      user &&
      requiredRoles.length > 0 &&
      !requiredRoles.includes(user.role)
    ) {
      router.push('/unauthorized')
    }
  }, [loading, isAuthenticated, user, requiredRoles, router])

  if (loading) {
    return (
      <div className="space-y-4 p-8">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (
    user &&
    requiredRoles.length > 0 &&
    !requiredRoles.includes(user.role)
  ) {
    return null
  }

  return <>{children}</>
}

'use client'

import { AppLayout } from '@/app/layout-app'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityFeed } from '@/components/activity-feed'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalLeads: number
  dealsInPipeline: number
  tasksOverdue: number
  teamMembers: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('[v0] Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const DashboardContent = () => {
    if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalLeads || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                +2 from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Deals in Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.dealsInPipeline || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                $542K total value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">
                {stats?.tasksOverdue || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.teamMembers || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Role-based content */}
          <div>
            {user?.role === 'ADMIN' && (
              <Card>
                <CardHeader>
                  <CardTitle>Admin Overview</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>Organization insights, audit logs, and system settings</p>
                </CardContent>
              </Card>
            )}

            {user?.role === 'MANAGER' && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>Manage your sales team, assign tasks, and track performance</p>
                </CardContent>
              </Card>
            )}

            {user?.role === 'SALES' && (
              <Card>
                <CardHeader>
                  <CardTitle>My Pipeline</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <p>Your leads, deals, and tasks at a glance</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed limit={5} />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.name}. Here's what's happening with your
            organization today.
          </p>
        </div>

        <DashboardContent />
      </div>
    </AppLayout>
  )
}

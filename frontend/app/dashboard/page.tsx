'use client'

import { AppLayout } from '@/app/layout-app'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ActivityFeed } from '@/components/activity-feed'
import { useEffect, useState } from 'react'
import {
  LeadsChart,
  RevenueChart,
  DealsPipelineChart,
  TasksChart,
  TeamPerformanceChart,
  StatsCard,
} from '@/components/dashboard-charts'
import { Users, TrendingUp, CheckSquare, Target, DollarSign, BarChart3 } from 'lucide-react'
import { getDashboardStats, getWeeklyStats, getPipelineStats, makeRequest } from '@/lib/api-service'

interface DashboardStats {
  totalLeads: number
  dealsInPipeline: number
  tasksOverdue: number
  teamMembers: number
  pipelineValue?: number
  conversionRate?: number
  newLeadsThisWeek?: number
  wonDealsThisMonth?: number
}

interface WeeklyData {
  leadsChart: Array<{ name: string; leads: number; converted: number }>
  tasksChart: Array<{ name: string; completed: number; pending: number; overdue: number }>
  revenueChart: Array<{ name: string; revenue: number; target: number }>
}

interface PipelineData {
  stage: string
  count: number
  value: number
}

interface TeamData {
  name: string
  deals: number
  revenue: number
}

// Fallback data if API fails
const fallbackLeadsChart = [
  { name: 'Mon', leads: 12, converted: 4 },
  { name: 'Tue', leads: 19, converted: 7 },
  { name: 'Wed', leads: 15, converted: 5 },
  { name: 'Thu', leads: 22, converted: 9 },
  { name: 'Fri', leads: 18, converted: 6 },
  { name: 'Sat', leads: 8, converted: 3 },
  { name: 'Sun', leads: 5, converted: 2 },
]

const fallbackRevenueChart = [
  { name: 'Jan', revenue: 45000, target: 50000 },
  { name: 'Feb', revenue: 52000, target: 50000 },
  { name: 'Mar', revenue: 48000, target: 55000 },
  { name: 'Apr', revenue: 61000, target: 55000 },
  { name: 'May', revenue: 55000, target: 60000 },
  { name: 'Jun', revenue: 67000, target: 60000 },
]

const fallbackTasksChart = [
  { name: 'Mon', completed: 8, pending: 5, overdue: 2 },
  { name: 'Tue', completed: 12, pending: 4, overdue: 1 },
  { name: 'Wed', completed: 10, pending: 6, overdue: 3 },
  { name: 'Thu', completed: 15, pending: 3, overdue: 1 },
  { name: 'Fri', completed: 11, pending: 7, overdue: 2 },
  { name: 'Sat', completed: 4, pending: 2, overdue: 0 },
  { name: 'Sun', completed: 2, pending: 1, overdue: 0 },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [leadsChartData, setLeadsChartData] = useState(fallbackLeadsChart)
  const [revenueChartData, setRevenueChartData] = useState(fallbackRevenueChart)
  const [tasksChartData, setTasksChartData] = useState(fallbackTasksChart)
  const [pipelineData, setPipelineData] = useState<Array<{ name: string; value: number; count: number }>>([])
  const [teamData, setTeamData] = useState<TeamData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch all dashboard data in parallel using api-service
        const [statsData, weeklyData, pipelineDataRes, teamDataRes] = await Promise.allSettled([
          getDashboardStats(),
          getWeeklyStats(),
          getPipelineStats(),
          makeRequest('/dashboard/team-performance'),
        ])

        // Process stats
        if (statsData.status === 'fulfilled') {
          setStats(statsData.value as DashboardStats)
        }

        // Process weekly data
        if (weeklyData.status === 'fulfilled') {
          const data = weeklyData.value as WeeklyData
          if (data.leadsChart) setLeadsChartData(data.leadsChart)
          if (data.tasksChart) setTasksChartData(data.tasksChart)
          if (data.revenueChart) setRevenueChartData(data.revenueChart)
        }

        // Process pipeline data
        if (pipelineDataRes.status === 'fulfilled') {
          const data = pipelineDataRes.value as PipelineData[]
          const formattedPipeline = data.map(p => ({
            name: p.stage.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
            value: p.value,
            count: p.count,
          }))
          setPipelineData(formattedPipeline)
        }

        // Process team data
        if (teamDataRes.status === 'fulfilled') {
          const data = teamDataRes.value as TeamData[]
          setTeamData(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const DashboardContent = () => {
    if (loading) {
      return (
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-[40px] w-full mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-8">

        {/* Stats Cards with Sparklines */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Leads"
            value={stats?.totalLeads || 0}
            description="Active leads in pipeline"
            trend={12}
            trendLabel="vs last month"
            icon={<Users className="h-5 w-5" />}
            sparklineData={[20, 25, 18, 32, 28, 35, 42]}
            variant="primary"
          />
          <StatsCard
            title="Pipeline Value"
            value={`$${((stats?.pipelineValue || 542000) / 1000).toFixed(0)}K`}
            description="Total deal value"
            trend={8}
            trendLabel="vs last month"
            icon={<DollarSign className="h-5 w-5" />}
            sparklineData={[400, 420, 450, 480, 510, 520, 542]}
            variant="success"
          />
          <StatsCard
            title="Overdue Tasks"
            value={stats?.tasksOverdue || 0}
            description="Require attention"
            trend={-15}
            trendLabel="vs last week"
            icon={<CheckSquare className="h-5 w-5" />}
            variant="warning"
          />
          <StatsCard
            title="Conversion Rate"
            value={`${stats?.conversionRate || 24}%`}
            description="Lead to deal conversion"
            trend={5}
            trendLabel="vs last month"
            icon={<Target className="h-5 w-5" />}
            sparklineData={[18, 19, 21, 20, 22, 23, 24]}
            variant="default"
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <LeadsChart data={leadsChartData} />
          <RevenueChart data={revenueChartData} />
        </div>

        {/* Secondary Charts Row */}
        <div className="grid gap-6 md:grid-cols-2">
          <DealsPipelineChart data={pipelineData.length > 0 ? pipelineData : [
            { name: 'Qualification', value: 125000, count: 15 },
            { name: 'Proposal', value: 85000, count: 8 },
            { name: 'Negotiation', value: 210000, count: 12 },
            { name: 'Closing', value: 122000, count: 5 },
          ]} />
          <TasksChart data={tasksChartData} />
        </div>

        {/* Bottom Section - Team Performance and Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TeamPerformanceChart data={teamData.length > 0 ? teamData : [
            { name: 'Sarah', deals: 12, revenue: 145000 },
            { name: 'Mike', deals: 9, revenue: 98000 },
            { name: 'Emily', deals: 15, revenue: 187000 },
            { name: 'James', deals: 7, revenue: 72000 },
            { name: 'Lisa', deals: 11, revenue: 134000 },
          ]} />
          
          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed limit={5} />
            </CardContent>
          </Card>
        </div>

        {/* Role-based Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  {user?.role === 'OWNER' ? 'Owner Overview' : 'Admin Overview'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>{user?.role === 'OWNER' ? 'Platform-wide insights and organization management' : 'Organization insights, audit logs, and system settings'}</p>
                <p className="text-primary mt-2 font-medium">{stats?.teamMembers || 0} active users</p>
              </CardContent>
            </Card>
          )}

          {(user?.role === 'OWNER' || user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Manage your sales team and track performance</p>
                <p className="text-green-600 mt-2 font-medium">{stats?.wonDealsThisMonth || 0} deals this month</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                My Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>Your leads, deals, and tasks at a glance</p>
              <p className="text-blue-600 mt-2 font-medium">{stats?.dealsInPipeline || 0} deals in progress</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.name}! Here's what's happening with your organization today.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        <DashboardContent />
      </div>
    </AppLayout>
  )
}

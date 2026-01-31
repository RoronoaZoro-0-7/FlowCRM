'use client'

import { useState, useEffect } from 'react'
import { getSalesForecast, getConversionFunnel, getTeamLeaderboard } from '@/lib/api-service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Users, Target, Award, Trophy, Medal } from 'lucide-react'

interface ForecastData {
  month: string
  predicted: number
  actual?: number
  confidence: number
}

interface FunnelStage {
  stage: string
  count: number
  value: number
  conversionRate: number
}

interface TeamMember {
  id: string
  name: string
  avatar?: string
  dealsWon: number
  dealValue: number
  leadsConverted: number
  totalLeads: number
}

const FUNNEL_COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
]

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Sales Forecast Component
export function SalesForecast() {
  const [forecast, setForecast] = useState<ForecastData[]>([])
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState('6')

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true)
      try {
        const data = await getSalesForecast(parseInt(months)) as { forecast: ForecastData[]; totalPredicted: number }
        setForecast(data.forecast || [])
      } catch (error) {
        console.error('Failed to fetch forecast:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()
  }, [months])

  const totalPredicted = forecast.reduce((sum, f) => sum + f.predicted, 0)
  const avgConfidence = forecast.length > 0 
    ? forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length 
    : 0

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">Sales Forecast</CardTitle>
          <CardDescription>Predicted revenue for upcoming months</CardDescription>
        </div>
        <Select value={months} onValueChange={setMonths}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 months</SelectItem>
            <SelectItem value="6">6 months</SelectItem>
            <SelectItem value="12">12 months</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Total Predicted</p>
            <p className="text-2xl font-bold">{formatCurrency(totalPredicted)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">Avg Confidence</p>
            <p className="text-2xl font-bold">{avgConfidence.toFixed(0)}%</p>
          </div>
        </div>

        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecast}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} className="text-xs" />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: 'var(--foreground)' }}
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="predicted"
                name="Predicted"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
              />
              {forecast.some((f) => f.actual !== undefined) && (
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Actual"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// Conversion Funnel Component
export function ConversionFunnel() {
  const [funnel, setFunnel] = useState<FunnelStage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFunnel = async () => {
      try {
        const data = await getConversionFunnel() as { funnel: FunnelStage[]; overallConversion: number }
        setFunnel(data.funnel || [])
      } catch (error) {
        console.error('Failed to fetch funnel:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFunnel()
  }, [])

  const totalLeads = funnel.length > 0 ? funnel[0].count : 0
  const wonDeals = funnel.find((f) => f.stage === 'WON')?.count || 0
  const overallConversion = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : '0'

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-medium">Conversion Funnel</CardTitle>
            <CardDescription>Lead to deal conversion rates</CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg">
            {overallConversion}% Overall
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {funnel.map((stage, index) => {
            const widthPercent = totalLeads > 0 ? (stage.count / totalLeads) * 100 : 0
            return (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.stage}</span>
                  <span className="text-muted-foreground">
                    {stage.count} ({stage.conversionRate.toFixed(1)}%)
                  </span>
                </div>
                <div className="relative h-8 bg-muted rounded-md overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                    style={{
                      width: `${Math.max(widthPercent, 5)}%`,
                      backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-medium text-white drop-shadow">
                      {formatCurrency(stage.value)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Team Leaderboard Component
export function TeamLeaderboard() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'dealValue' | 'dealsWon' | 'leadsConverted'>('dealValue')

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const data = await getTeamLeaderboard() as { leaderboard: TeamMember[] }
        setTeam(data.leaderboard || [])
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeam()
  }, [])

  const sortedTeam = [...team].sort((a, b) => b[sortBy] - a[sortBy])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 2:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank + 1}</span>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Team Leaderboard
          </CardTitle>
          <CardDescription>Top performers this month</CardDescription>
        </div>
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dealValue">Deal Value</SelectItem>
            <SelectItem value="dealsWon">Deals Won</SelectItem>
            <SelectItem value="leadsConverted">Leads Converted</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {sortedTeam.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No team data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTeam.map((member, index) => {
              const conversionRate =
                member.totalLeads > 0
                  ? ((member.leadsConverted / member.totalLeads) * 100).toFixed(0)
                  : '0'

              return (
                <div
                  key={member.id}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    index === 0 ? 'bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="w-8 flex justify-center">{getRankIcon(index)}</div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{member.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{member.dealsWon} deals</span>
                      <span>•</span>
                      <span>{conversionRate}% conversion</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">
                      {formatCurrency(member.dealValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">total value</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Combined Analytics Dashboard Component
export function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <SalesForecast />
        <ConversionFunnel />
      </div>
      <TeamLeaderboard />
    </div>
  )
}

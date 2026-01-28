'use client'

import { AppLayout } from '@/app/layout-app'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useEffect, useState } from 'react'
import { Building2, Users, TrendingUp, Activity, Calendar, MoreHorizontal, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

interface Organization {
  id: string
  name: string
  createdAt: string
  _count: {
    users: number
    leads: number
    deals: number
    tasks: number
  }
  stats?: {
    totalRevenue: number
    activeDeals: number
    conversionRate: number
  }
}

interface OrganizationStats {
  totalOrganizations: number
  totalUsers: number
  totalLeads: number
  totalDeals: number
  totalRevenue: number
}

export default function OrganizationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [stats, setStats] = useState<OrganizationStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect if not OWNER
    if (user && user.role !== 'OWNER') {
      router.push('/dashboard')
      return
    }

    const fetchOrganizations = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/organizations', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setOrganizations(data.organizations || [])
          setStats(data.stats || null)
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error)
        // For demo, show mock data
        setOrganizations([
          {
            id: 'org-techcorp-001',
            name: 'TechCorp Solutions',
            createdAt: '2024-01-15T00:00:00Z',
            _count: { users: 6, leads: 50, deals: 30, tasks: 40 },
            stats: { totalRevenue: 1250000, activeDeals: 18, conversionRate: 24 }
          },
          {
            id: 'org-startuphub-001',
            name: 'StartupHub Inc',
            createdAt: '2024-03-20T00:00:00Z',
            _count: { users: 3, leads: 15, deals: 8, tasks: 12 },
            stats: { totalRevenue: 340000, activeDeals: 5, conversionRate: 32 }
          },
          {
            id: 'demo-org-001',
            name: 'Demo Company',
            createdAt: '2024-06-01T00:00:00Z',
            _count: { users: 3, leads: 10, deals: 5, tasks: 8 },
            stats: { totalRevenue: 150000, activeDeals: 3, conversionRate: 20 }
          },
        ])
        setStats({
          totalOrganizations: 3,
          totalUsers: 12,
          totalLeads: 75,
          totalDeals: 43,
          totalRevenue: 1740000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [user, router])

  if (user?.role !== 'OWNER') {
    return null
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor all organizations in your platform
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Organization
          </Button>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Organizations
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrganizations || 0}</div>
                <p className="text-xs text-muted-foreground">Active accounts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">Across all orgs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Leads
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
                <p className="text-xs text-muted-foreground">In pipeline</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Deals
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalDeals || 0}</div>
                <p className="text-xs text-muted-foreground">Active deals</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${((stats?.totalRevenue || 0) / 1000000).toFixed(2)}M
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Organizations</CardTitle>
            <CardDescription>
              A list of all organizations and their performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead className="text-center">Users</TableHead>
                    <TableHead className="text-center">Leads</TableHead>
                    <TableHead className="text-center">Deals</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-center">Conversion</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-xs text-muted-foreground">{org.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{org._count.users}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{org._count.leads}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{org._count.deals}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(org.stats?.totalRevenue || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={
                            (org.stats?.conversionRate || 0) >= 25 
                              ? 'default' 
                              : (org.stats?.conversionRate || 0) >= 15 
                                ? 'secondary' 
                                : 'outline'
                          }
                        >
                          {org.stats?.conversionRate || 0}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        <div className="flex items-center justify-end gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(org.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Manage Users</DropdownMenuItem>
                            <DropdownMenuItem>View Reports</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Suspend Organization
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

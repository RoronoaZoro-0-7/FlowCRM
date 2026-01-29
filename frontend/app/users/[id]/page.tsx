'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/app/layout-app'
import { getUserById, getTasks, getLeads, getDeals } from '@/lib/api-service'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Mail, Calendar, CheckSquare, Users, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  lastLogin?: string
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string
  createdAt: string
}

interface Lead {
  id: string
  name: string
  company: string
  status: string
  value: number
  createdAt: string
}

interface Deal {
  id: string
  name: string
  value: number
  stage: string
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SALES: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  DONE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CONTACTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  QUALIFIED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  PROPOSAL: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  WON: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  LOST: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)

  const userId = params.id as string

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const userData = await getUserById(userId)
        setProfile(userData)

        // Fetch user's tasks, leads, deals
        const [tasksData, leadsData, dealsData] = await Promise.all([
          getTasks(),
          getLeads(),
          getDeals(),
        ])

        // Filter by user
        setTasks((tasksData as Task[]).filter((t: any) => t.assignedToId === userId))
        setLeads((leadsData as Lead[]).filter((l: any) => l.ownerId === userId))
        setDeals((dealsData as Deal[]).filter((d: any) => d.ownerId === userId))
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        toast.error('Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    if (userId) {
      fetchData()
    }
  }, [userId])

  // Check access
  useEffect(() => {
    if (!currentUser) return
    
    // Only OWNER, ADMIN, or MANAGER can view profiles
    if (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER') {
      router.push('/users')
      toast.error('You do not have permission to view this profile')
    }
  }, [currentUser, router])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-48" />
            <Skeleton className="h-48 md:col-span-2" />
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">User not found</p>
          <Button className="mt-4" onClick={() => router.push('/users')}>
            Back to Users
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/users')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Profile</h1>
            <p className="text-muted-foreground mt-1">View user details and activity</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarFallback className="text-xl font-bold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold">{profile.name}</h2>
                <Badge className={`mt-2 ${ROLE_COLORS[profile.role] || ''}`}>
                  {profile.role}
                </Badge>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground w-full">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {format(new Date(profile.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats & Activity */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Activity Summary</CardTitle>
              <CardDescription>Overview of user's work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <CheckSquare className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{tasks.length}</p>
                  <p className="text-sm text-muted-foreground">Tasks</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{leads.length}</p>
                  <p className="text-sm text-muted-foreground">Leads</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Zap className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold">{deals.length}</p>
                  <p className="text-sm text-muted-foreground">Deals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Tasks, Leads, Deals */}
        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="deals">Deals ({deals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No tasks assigned</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[task.status] || ''}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.priority}</TableCell>
                          <TableCell>
                            {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Owned Leads</CardTitle>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No leads owned</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.company}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[lead.status] || ''}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ${lead.value?.toLocaleString() || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Owned Deals</CardTitle>
              </CardHeader>
              <CardContent>
                {deals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No deals owned</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deals.map((deal) => (
                        <TableRow key={deal.id}>
                          <TableCell className="font-medium">{deal.name}</TableCell>
                          <TableCell>
                            <Badge className={STATUS_COLORS[deal.stage] || ''}>
                              {deal.stage}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            ${deal.value?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell>
                            {format(new Date(deal.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

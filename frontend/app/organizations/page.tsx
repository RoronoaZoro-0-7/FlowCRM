'use client'

import { AppLayout } from '@/app/layout-app'
import { useAuth } from '@/contexts/auth-context'
import { getOrganizations, createOrganization, deleteOrganization } from '@/lib/api-service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEffect, useState } from 'react'
import { Building2, Users, TrendingUp, Activity, Calendar, MoreHorizontal, Plus, Loader2, Trash2, Eye, FileText } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileUpload } from '@/components/file-upload'

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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewOrgDialog, setViewOrgDialog] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    currency: 'USD',
  })

  const fetchOrganizations = async () => {
    try {
      const data = await getOrganizations() as { organizations: Organization[], stats: OrganizationStats }
      setOrganizations(data.organizations || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
      toast.error('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Redirect if not OWNER
    if (user && user.role !== 'OWNER') {
      router.push('/dashboard')
      return
    }

    if (user?.role === 'OWNER') {
      fetchOrganizations()
    }
  }, [user, router])

  const handleCreateOrganization = async () => {
    if (!formData.name || !formData.adminName || !formData.adminEmail || !formData.adminPassword) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      await createOrganization(formData)
      toast.success('Organization created successfully')
      setDialogOpen(false)
      setFormData({ name: '', adminName: '', adminEmail: '', adminPassword: '', currency: 'USD' })
      fetchOrganizations()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create organization')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteOrganization = async () => {
    if (!orgToDelete) return

    setDeleting(true)
    try {
      await deleteOrganization(orgToDelete.id)
      toast.success('Organization deleted successfully')
      setDeleteDialogOpen(false)
      setOrgToDelete(null)
      fetchOrganizations()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete organization')
    } finally {
      setDeleting(false)
    }
  }

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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                  Create a new organization with an admin user
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name *</Label>
                  <Input
                    id="org-name"
                    placeholder="Enter organization name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Admin Name *</Label>
                  <Input
                    id="admin-name"
                    placeholder="Enter admin name"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email *</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Admin Password *</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="CAD">CAD ($)</SelectItem>
                      <SelectItem value="AUD">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrganization} disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Organization
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrg(org)
                                setViewOrgDialog(true)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrg(org)
                                setViewOrgDialog(true)
                              }}
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Agreements
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Users className="mr-2 h-4 w-4" />
                              Manage Users
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                setOrgToDelete(org)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Organization
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{orgToDelete?.name}</strong> and all its data including:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>{orgToDelete?._count.users || 0} users</li>
                  <li>{orgToDelete?._count.leads || 0} leads</li>
                  <li>{orgToDelete?._count.deals || 0} deals</li>
                  <li>{orgToDelete?._count.tasks || 0} tasks</li>
                </ul>
                <p className="mt-2 text-destructive font-medium">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteOrganization}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleting}
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Organization
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View Organization Dialog with Agreements */}
        <Dialog open={viewOrgDialog} onOpenChange={setViewOrgDialog}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedOrg?.name}
              </DialogTitle>
              <DialogDescription>
                Organization details and agreements
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrg && (
              <div className="space-y-6">
                {/* Organization Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Users</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedOrg._count.users}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Leads</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedOrg._count.leads}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Deals</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedOrg._count.deals}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-muted-foreground">Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        ${((selectedOrg.stats?.totalRevenue || 0) / 1000).toFixed(1)}k
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Organization Agreements - File Upload */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Organization Agreements
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload contracts, agreements, and other important documents for this organization
                  </p>
                  <FileUpload
                    entityType="organization"
                    entityId={selectedOrg.id}
                  />
                </div>

                {/* Created Date */}
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created: {new Date(selectedOrg.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewOrgDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}

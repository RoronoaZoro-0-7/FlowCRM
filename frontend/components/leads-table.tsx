'use client'

import { useEffect, useState } from 'react'
import { getLeads, updateLead, deleteLead, bulkDeleteLeads, bulkUpdateLeads, bulkAssignLeads, getUsers } from '@/lib/api-service'
import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/contexts/socket-context'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Edit2, Trash2, Eye, Search, Filter, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { BulkActions, BulkSelectCheckbox, useBulkSelection } from './bulk-actions'
import { ExportButton } from './export-button'
import { FilterPresetSelector } from './filter-preset-selector'
import { LeadScoreBadge } from './lead-score'

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'PROPOSAL' | 'WON' | 'LOST'

export interface Lead {
  id: string
  name: string
  email: string
  company: string
  status: LeadStatus
  value: number
  ownerId: string
  ownerName: string
  createdAt: string
  updatedAt: string
}

interface LeadsTableProps {
  onEditLead?: (lead: Lead) => void
  onViewLead?: (lead: Lead) => void
  onDeleteLead?: (id: string) => void
  refreshTrigger?: number
}

const STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CONTACTED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  QUALIFIED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  PROPOSAL: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  LOST: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  WON: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const STATUS_OPTIONS: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']

export function LeadsTable({
  onEditLead,
  onViewLead,
  onDeleteLead,
  refreshTrigger,
}: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const { user } = useAuth()
  const { socket } = useSocket()
  const { selectedIds, setSelectedIds, toggleSelection } = useBulkSelection<Lead>()

  const fetchLeads = async () => {
    try {
      const data = await getLeads() as Lead[]
      // Filter leads based on role
      let roleFilteredLeads = data
      if (user?.role === 'SALES') {
        roleFilteredLeads = data.filter((lead: Lead) => lead.ownerId === user.id)
      }
      setLeads(roleFilteredLeads)
      setFilteredLeads(roleFilteredLeads)
    } catch (error) {
      console.error('[v0] Failed to fetch leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const data = await getUsers()
      setUsers(data.map((u: any) => ({ id: u.id, name: u.name })))
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  useEffect(() => {
    fetchLeads()
    fetchUsers()
  }, [user, refreshTrigger])

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return

    const handleLeadCreated = () => {
      fetchLeads()
    }

    const handleLeadUpdated = () => {
      fetchLeads()
    }

    const handleLeadDeleted = () => {
      fetchLeads()
    }

    socket.on('LEAD_CREATED', handleLeadCreated)
    socket.on('LEAD_UPDATED', handleLeadUpdated)
    socket.on('LEAD_DELETED', handleLeadDeleted)

    return () => {
      socket.off('LEAD_CREATED', handleLeadCreated)
      socket.off('LEAD_UPDATED', handleLeadUpdated)
      socket.off('LEAD_DELETED', handleLeadDeleted)
    }
  }, [socket])

  // Apply search and status filters
  useEffect(() => {
    let filtered = [...leads]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.company.toLowerCase().includes(query)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((lead) => lead.status === statusFilter)
    }

    setFilteredLeads(filtered)
  }, [leads, searchQuery, statusFilter])

  const canEditLead = (lead: Lead) => {
    if (!user) return false
    if (user.role === 'OWNER' || user.role === 'ADMIN') return true
    if (user.role === 'MANAGER') return true
    return lead.ownerId === user.id
  }

  const canDeleteLead = (lead: Lead) => {
    if (!user) return false
    if (user.role === 'OWNER' || user.role === 'ADMIN') return true
    return false
  }

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateLead(leadId, { status: newStatus })
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      )
      toast.success('Lead status updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update lead status')
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    
    try {
      await deleteLead(leadId)
      setLeads((prev) => prev.filter((lead) => lead.id !== leadId))
      toast.success('Lead deleted')
      onDeleteLead?.(leadId)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete lead')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-24" /></th>
                <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
                <th className="px-4 py-3 text-right"><Skeleton className="h-4 w-12" /></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.length > 0 ? (
        <BulkActions
          items={filteredLeads}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onBulkDelete={async (ids) => {
            await bulkDeleteLeads(ids)
            setLeads((prev) => prev.filter((l) => !ids.includes(l.id)))
          }}
          onBulkAssign={async (ids, userId) => {
            await bulkAssignLeads(ids, userId)
            fetchLeads()
          }}
          onBulkUpdateStatus={async (ids, status) => {
            await bulkUpdateLeads(ids, { status })
            fetchLeads()
          }}
          users={users}
          statuses={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
          entityName="leads"
        />
      ) : (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <FilterPresetSelector
              entityType="leads"
              currentFilters={{ status: statusFilter, search: searchQuery }}
              onApplyPreset={(filters) => {
                if (filters.status) setStatusFilter(filters.status)
                if (filters.search) setSearchQuery(filters.search)
              }}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ExportButton
              entity="leads"
              data={filteredLeads}
              columns={['name', 'email', 'company', 'status', 'value', 'ownerName']}
              filename="leads-export"
            />
          </div>
        </>
      )}

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-lg border border-border/50 border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {leads.length === 0 ? 'No leads found. Create your first lead to get started.' : 'No leads match your filters.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-b border-border/50 hover:bg-muted/30">
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Owner</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                >
                  <TableCell>
                    <BulkSelectCheckbox
                      id={lead.id}
                      selectedIds={selectedIds}
                      onToggle={toggleSelection}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.company}</TableCell>
                  <TableCell className="text-sm">{lead.email}</TableCell>
                  <TableCell>
                    {canEditLead(lead) ? (
                      <Select
                        value={lead.status}
                        onValueChange={(value) => handleStatusChange(lead.id, value as LeadStatus)}
                      >
                        <SelectTrigger className="w-[130px] h-8">
                          <Badge variant="outline" className={STATUS_COLORS[lead.status] || 'bg-gray-100'}>
                            {lead.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              <Badge variant="outline" className={STATUS_COLORS[status]}>
                                {status}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={STATUS_COLORS[lead.status] || 'bg-gray-100'}>
                        {lead.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <LeadScoreBadge score={(lead as any).score || Math.floor(Math.random() * 100)} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${(lead.value ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {lead.ownerName}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewLead?.(lead)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        {lead.status === 'QUALIFIED' && canEditLead(lead) && (
                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'WON')}>
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Convert to Deal
                          </DropdownMenuItem>
                        )}
                        {canEditLead(lead) && (
                          <DropdownMenuItem onClick={() => onEditLead?.(lead)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canDeleteLead(lead) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteLead(lead.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

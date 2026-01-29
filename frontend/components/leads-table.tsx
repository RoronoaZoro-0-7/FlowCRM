'use client'

import { useEffect, useState } from 'react'
import { getLeads } from '@/lib/api-service'
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
import { MoreHorizontal, Edit2, Trash2, Eye, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'

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
  const { user } = useAuth()
  const { socket } = useSocket()

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

  useEffect(() => {
    fetchLeads()
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
      </div>

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
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.company}</TableCell>
                  <TableCell className="text-sm">{lead.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[lead.status] || 'bg-gray-100'}>
                      {lead.status}
                    </Badge>
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
                        <DropdownMenuItem onClick={() => onEditLead?.(lead)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteLead?.(lead.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
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

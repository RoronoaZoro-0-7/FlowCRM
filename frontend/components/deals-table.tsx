'use client'

import { useEffect, useState } from 'react'
import { getDeals, updateDeal, deleteDeal } from '@/lib/api-service'
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
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Eye, 
  Search, 
  Filter,
  Trophy,
  XCircle 
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export type DealStage = 'QUALIFICATION' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST'

export interface Deal {
  id: string
  title: string
  value: number
  stage: DealStage
  probability: number
  expectedCloseDate?: string
  actualCloseDate?: string
  ownerId: string
  owner?: {
    id: string
    name: string
  }
  assignedToId?: string
  assignedTo?: {
    id: string
    name: string
  }
  leadId?: string
  lead?: {
    id: string
    name: string
    company: string
  }
  createdAt: string
  updatedAt: string
}

interface DealsTableProps {
  onEditDeal?: (deal: Deal) => void
  onViewDeal?: (deal: Deal) => void
  refreshTrigger?: number
}

const STAGE_COLORS: Record<DealStage, string> = {
  QUALIFICATION: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  DISCOVERY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  PROPOSAL: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  NEGOTIATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  CLOSED_WON: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CLOSED_LOST: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const STAGE_OPTIONS: DealStage[] = ['QUALIFICATION', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']

const STAGE_LABELS: Record<DealStage, string> = {
  QUALIFICATION: 'Qualification',
  DISCOVERY: 'Discovery',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
}

export function DealsTable({ onEditDeal, onViewDeal, refreshTrigger }: DealsTableProps) {
  const [deals, setDeals] = useState<Deal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const { user } = useAuth()
  const { socket } = useSocket()

  const fetchDeals = async () => {
    try {
      const data = await getDeals() as Deal[]
      setDeals(data)
      setFilteredDeals(data)
    } catch (error) {
      console.error('Failed to fetch deals:', error)
      toast.error('Failed to load deals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeals()
  }, [refreshTrigger])

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket) return

    const handleDealCreated = () => fetchDeals()
    const handleDealUpdated = () => fetchDeals()
    const handleDealDeleted = () => fetchDeals()

    socket.on('DEAL_CREATED', handleDealCreated)
    socket.on('DEAL_UPDATED', handleDealUpdated)
    socket.on('DEAL_DELETED', handleDealDeleted)

    return () => {
      socket.off('DEAL_CREATED', handleDealCreated)
      socket.off('DEAL_UPDATED', handleDealUpdated)
      socket.off('DEAL_DELETED', handleDealDeleted)
    }
  }, [socket])

  // Apply filters
  useEffect(() => {
    let filtered = [...deals]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (deal) =>
          deal.title.toLowerCase().includes(query) ||
          deal.lead?.name.toLowerCase().includes(query) ||
          deal.lead?.company.toLowerCase().includes(query) ||
          deal.owner?.name.toLowerCase().includes(query)
      )
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter((deal) => deal.stage === stageFilter)
    }

    setFilteredDeals(filtered)
  }, [deals, searchQuery, stageFilter])

  const canEditDeal = (deal: Deal) => {
    if (!user) return false
    if (user.role === 'OWNER' || user.role === 'ADMIN') return true
    if (user.role === 'MANAGER') return true
    return deal.ownerId === user.id || deal.assignedToId === user.id
  }

  const canDeleteDeal = (deal: Deal) => {
    if (!user) return false
    if (user.role === 'OWNER' || user.role === 'ADMIN') return true
    return false
  }

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    try {
      await updateDeal(dealId, { stage: newStage })
      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === dealId ? { ...deal, stage: newStage } : deal
        )
      )
      if (newStage === 'CLOSED_WON') {
        toast.success('🎉 Deal won! Congratulations!')
      } else if (newStage === 'CLOSED_LOST') {
        toast.info('Deal marked as lost')
      } else {
        toast.success('Deal stage updated')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update deal stage')
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return
    
    try {
      await deleteDeal(dealId)
      setDeals((prev) => prev.filter((deal) => deal.id !== dealId))
      toast.success('Deal deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete deal')
    }
  }

  // Calculate pipeline value
  const pipelineValue = deals
    .filter(d => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage))
    .reduce((sum, deal) => sum + (deal.value * (deal.probability / 100)), 0)

  const wonValue = deals
    .filter(d => d.stage === 'CLOSED_WON')
    .reduce((sum, deal) => sum + deal.value, 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <div className="rounded-lg border overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Deals</p>
          <p className="text-2xl font-bold">{deals.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Pipeline Value</p>
          <p className="text-2xl font-bold">${pipelineValue.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Won This Month</p>
          <p className="text-2xl font-bold text-green-600">${wonValue.toLocaleString()}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Win Rate</p>
          <p className="text-2xl font-bold">
            {deals.length > 0 
              ? Math.round((deals.filter(d => d.stage === 'CLOSED_WON').length / deals.filter(d => d.stage.startsWith('CLOSED')).length) * 100) || 0
              : 0}%
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGE_OPTIONS.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {STAGE_LABELS[stage]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredDeals.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {deals.length === 0 ? 'No deals found. Create your first deal!' : 'No deals match your filters.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Lead/Company</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Expected Close</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.map((deal) => (
                <TableRow key={deal.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {deal.probability}% probability
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {canEditDeal(deal) && !deal.stage.startsWith('CLOSED') ? (
                      <Select
                        value={deal.stage}
                        onValueChange={(value) => handleStageChange(deal.id, value as DealStage)}
                      >
                        <SelectTrigger className="w-[150px] h-8">
                          <Badge className={STAGE_COLORS[deal.stage]}>
                            {STAGE_LABELS[deal.stage]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STAGE_OPTIONS.map((stage) => (
                            <SelectItem key={stage} value={stage}>
                              <Badge className={STAGE_COLORS[stage]}>
                                {STAGE_LABELS[stage]}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={STAGE_COLORS[deal.stage]}>
                        {STAGE_LABELS[deal.stage]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${deal.value.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {deal.lead ? (
                      <div>
                        <p className="text-sm font-medium">{deal.lead.name}</p>
                        <p className="text-xs text-muted-foreground">{deal.lead.company}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {deal.owner?.name || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {deal.expectedCloseDate ? (
                      <span className={
                        new Date(deal.expectedCloseDate) < new Date() && !deal.stage.startsWith('CLOSED')
                          ? 'text-destructive font-medium'
                          : 'text-muted-foreground'
                      }>
                        {format(new Date(deal.expectedCloseDate), 'MMM d, yyyy')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewDeal?.(deal)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {canEditDeal(deal) && !deal.stage.startsWith('CLOSED') && (
                          <>
                            <DropdownMenuItem onClick={() => handleStageChange(deal.id, 'CLOSED_WON')}>
                              <Trophy className="mr-2 h-4 w-4 text-green-600" />
                              Mark as Won
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStageChange(deal.id, 'CLOSED_LOST')}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              Mark as Lost
                            </DropdownMenuItem>
                          </>
                        )}
                        {canEditDeal(deal) && (
                          <DropdownMenuItem onClick={() => onEditDeal?.(deal)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canDeleteDeal(deal) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteDeal(deal.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

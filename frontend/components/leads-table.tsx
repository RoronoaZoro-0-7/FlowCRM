'use client'

import { useEffect, useState } from 'react'
import { getLeads } from '@/lib/api-service'
import { useAuth } from '@/contexts/auth-context'
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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreHorizontal, Edit2, Trash2, Eye } from 'lucide-react'
import { toast } from 'sonner'

export interface Lead {
  id: string
  name: string
  email: string
  company: string
  status: 'new' | 'contacted' | 'qualified' | 'lost' | 'won'
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
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  qualified:
    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  won: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export function LeadsTable({
  onEditLead,
  onViewLead,
  onDeleteLead,
}: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const data = await getLeads() as Lead[]
        // Filter leads based on role
        let filteredLeads = data
        if (user?.role === 'SALES') {
          filteredLeads = data.filter((lead: Lead) => lead.ownerId === user.id)
        }
        setLeads(filteredLeads)
      } catch (error) {
        console.error('[v0] Failed to fetch leads:', error)
        toast.error('Failed to load leads')
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [user])

  if (loading) {
    return (
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-left text-sm font-semibold">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold">
                <Skeleton className="h-4 w-12" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="h-8 w-8 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 border-dashed p-8 text-center">
        <p className="text-muted-foreground">No leads found. Create your first lead to get started.</p>
      </div>
    )
  }

  return (
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
          {leads.map((lead) => (
            <TableRow
              key={lead.id}
              className="border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <TableCell className="font-medium">{lead.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {lead.company}
              </TableCell>
              <TableCell className="text-sm">{lead.email}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={STATUS_COLORS[lead.status] || 'bg-gray-100'}
                >
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
  )
}

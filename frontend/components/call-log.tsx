'use client'

import { useState, useEffect } from 'react'
import {
  getCallLogs,
  createCallLog,
  updateCallLog,
  deleteCallLog,
  getCallStats,
} from '@/lib/api-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'

interface CallLog {
  id: string
  phoneNumber: string
  direction: string
  duration: number | null
  outcome: string | null
  notes: string | null
  createdAt: string
  lead?: { id: string; name: string }
  user: { id: string; name: string }
}

interface CallStats {
  totalCalls: number
  inbound: number
  outbound: number
  avgDuration: number
  outcomeBreakdown: Record<string, number>
}

interface CallLogFormProps {
  leadId?: string
  onComplete?: () => void
}

const DIRECTIONS = [
  { value: 'outbound', label: 'Outbound', icon: PhoneOutgoing },
  { value: 'inbound', label: 'Inbound', icon: PhoneIncoming },
]

const OUTCOMES = [
  { value: 'answered', label: 'Answered' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'busy', label: 'Busy' },
]

const OUTCOME_COLORS: Record<string, string> = {
  answered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  voicemail: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  no_answer: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  busy: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function CallLogForm({ leadId, onComplete }: CallLogFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    phoneNumber: '',
    direction: 'outbound',
    duration: '',
    outcome: 'answered',
    notes: '',
  })

  const handleSave = async () => {
    if (!formData.phoneNumber) {
      toast.error('Please enter a phone number')
      return
    }

    setSaving(true)
    try {
      await createCallLog({
        phoneNumber: formData.phoneNumber,
        direction: formData.direction,
        duration: formData.duration ? parseInt(formData.duration) * 60 : undefined,
        outcome: formData.outcome,
        notes: formData.notes || undefined,
        leadId,
      })
      toast.success('Call logged successfully')
      setShowForm(false)
      setFormData({
        phoneNumber: '',
        direction: 'outbound',
        duration: '',
        outcome: 'answered',
        notes: '',
      })
      onComplete?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to log call')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button onClick={() => setShowForm(true)} size="sm">
        <Phone className="h-4 w-4 mr-2" />
        Log Call
      </Button>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
            <DialogDescription>
              Record details of a phone call
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(v) => setFormData({ ...formData, direction: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIRECTIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        <div className="flex items-center gap-2">
                          <d.icon className="h-4 w-4" />
                          {d.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select
                  value={formData.outcome}
                  onValueChange={(v) => setFormData({ ...formData, outcome: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTCOMES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="5"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Call notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function CallLogList({ leadId }: { leadId?: string }) {
  const [calls, setCalls] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCalls = async () => {
    try {
      const data = await getCallLogs(leadId) as { calls: CallLog[] }
      setCalls(data.calls || [])
    } catch (error) {
      console.error('Failed to fetch calls:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalls()
  }, [leadId])

  const handleDelete = async (id: string) => {
    try {
      await deleteCallLog(id)
      toast.success('Call log deleted')
      setCalls((prev) => prev.filter((c) => c.id !== id))
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete call')
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No call logs yet</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Direction</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Outcome</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calls.map((call) => {
          const DirectionIcon = call.direction === 'inbound' ? PhoneIncoming : PhoneOutgoing
          return (
            <TableRow key={call.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <DirectionIcon className="h-4 w-4" />
                  <span className="capitalize">{call.direction}</span>
                </div>
              </TableCell>
              <TableCell className="font-mono">{call.phoneNumber}</TableCell>
              <TableCell>
                {call.outcome && (
                  <Badge className={OUTCOME_COLORS[call.outcome] || ''}>
                    {call.outcome.replace('_', ' ')}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDuration(call.duration)}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(call.createdAt), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDelete(call.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export function CallStatsCard() {
  const [stats, setStats] = useState<CallStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getCallStats() as { stats: CallStats }
        setStats(data.stats)
      } catch (error) {
        console.error('Failed to fetch call stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Call Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalCalls}</p>
            <p className="text-xs text-muted-foreground">Total Calls</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</p>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </div>
          <div className="flex items-center gap-2">
            <PhoneOutgoing className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{stats.outbound} outbound</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIncoming className="h-4 w-4 text-green-500" />
            <span className="text-sm">{stats.inbound} inbound</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

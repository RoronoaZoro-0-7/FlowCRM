'use client'

import { useState, useEffect } from 'react'
import {
  getWebhookConfig,
  updateWebhookConfig,
  getWebhookLogs,
  testWebhook,
} from '@/lib/api-service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
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
} from '@/components/ui/dialog'
import {
  Webhook,
  Play,
  Copy,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Loader2,
  Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface WebhookLog {
  id: string
  eventType: string
  status: string
  statusCode: number | null
  payload: any
  response: string | null
  attempts: number
  createdAt: string
}

const WEBHOOK_EVENTS = [
  { value: 'lead.created', label: 'Lead Created' },
  { value: 'lead.updated', label: 'Lead Updated' },
  { value: 'lead.deleted', label: 'Lead Deleted' },
  { value: 'lead.status_changed', label: 'Lead Status Changed' },
  { value: 'deal.created', label: 'Deal Created' },
  { value: 'deal.updated', label: 'Deal Updated' },
  { value: 'deal.stage_changed', label: 'Deal Stage Changed' },
  { value: 'deal.won', label: 'Deal Won' },
  { value: 'deal.lost', label: 'Deal Lost' },
  { value: 'task.created', label: 'Task Created' },
  { value: 'task.completed', label: 'Task Completed' },
]

export function WebhookSettings() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showLogDetail, setShowLogDetail] = useState<WebhookLog | null>(null)

  useEffect(() => {
    fetchConfig()
    fetchLogs()
  }, [])

  const fetchConfig = async () => {
    try {
      const data = await getWebhookConfig() as { webhookUrl: string | null; webhookEvents: string[]; hasSecret: boolean }
      setWebhookUrl(data.webhookUrl || '')
      setSelectedEvents(data.webhookEvents || [])
    } catch (error) {
      console.error('Failed to fetch webhook config:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const data = await getWebhookLogs() as { logs: WebhookLog[] }
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error)
    }
  }

  const handleSave = async () => {
    if (webhookUrl && !isValidUrl(webhookUrl)) {
      toast.error('Please enter a valid URL')
      return
    }

    setSaving(true)
    try {
      await updateWebhookConfig({
        webhookUrl: webhookUrl || undefined,
        webhookEvents: selectedEvents,
        webhookSecret: webhookSecret || undefined,
      })
      toast.success('Webhook settings saved')
      setWebhookSecret('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save webhook settings')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL first')
      return
    }

    setTesting(true)
    try {
      const result = await testWebhook() as { success: boolean; statusCode?: number; error?: string }
      if (result.success) {
        toast.success(`Webhook test successful (${result.statusCode})`)
      } else {
        toast.error(`Webhook test failed: ${result.error}`)
      }
      fetchLogs()
    } catch (error: any) {
      toast.error(error.message || 'Webhook test failed')
    } finally {
      setTesting(false)
    }
  }

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  const copySecret = () => {
    navigator.clipboard.writeText(webhookSecret)
    toast.success('Secret copied to clipboard')
  }

  const generateSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    setWebhookSecret(secret)
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const getStatusBadge = (status: string, statusCode: number | null) => {
    if (status === 'success') {
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          {statusCode}
        </Badge>
      )
    }
    if (status === 'failed') {
      return (
        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          {statusCode || 'Error'}
        </Badge>
      )
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Send real-time notifications to your external services when events occur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Webhook URL */}
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="flex-1"
              />
              <Button variant="outline" onClick={handleTest} disabled={testing || !webhookUrl}>
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Signing Secret
            </Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Enter or generate a secret"
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={generateSecret} title="Generate">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={copySecret}
                disabled={!webhookSecret}
                title="Copy"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this secret to verify webhook payloads. Leave blank to keep existing secret.
            </p>
          </div>

          {/* Event Selection */}
          <div className="space-y-2">
            <Label>Events to Send</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {WEBHOOK_EVENTS.map((event) => (
                <div
                  key={event.value}
                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                    selectedEvents.includes(event.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => toggleEvent(event.value)}
                >
                  <Switch
                    checked={selectedEvents.includes(event.value)}
                    onCheckedChange={() => toggleEvent(event.value)}
                  />
                  <span className="text-sm">{event.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      {/* Webhook Logs */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg font-medium">Recent Deliveries</CardTitle>
            <CardDescription>View recent webhook delivery attempts</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No webhook deliveries yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">{log.eventType}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status, log.statusCode)}</TableCell>
                    <TableCell>{log.attempts}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowLogDetail(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={!!showLogDetail} onOpenChange={() => setShowLogDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Webhook Delivery Details</DialogTitle>
          </DialogHeader>
          {showLogDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Event</Label>
                  <p className="font-medium">{showLogDetail.eventType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(showLogDetail.status, showLogDetail.statusCode)}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Payload</Label>
                <ScrollArea className="h-48 mt-1">
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(showLogDetail.payload, null, 2)}
                  </pre>
                </ScrollArea>
              </div>

              {showLogDetail.response && (
                <div>
                  <Label className="text-muted-foreground">Response</Label>
                  <ScrollArea className="h-32 mt-1">
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                      {showLogDetail.response}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

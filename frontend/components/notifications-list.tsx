'use client'

import React from "react"

import { useEffect, useState } from 'react'
import { useSocket } from '@/contexts/socket-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Calendar,
  Zap,
  Clock,
  X,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface NotificationsListProps {
  compact?: boolean
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  TASK_ASSIGNED: <Calendar className="h-4 w-4 text-purple-600" />,
  USER_ADDED: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  LEAD_ASSIGNED: <Clock className="h-4 w-4 text-cyan-600" />,
  DEAL_UPDATED: <Zap className="h-4 w-4 text-yellow-600" />,
  SYSTEM: <AlertCircle className="h-4 w-4 text-blue-500" />,
}

export function NotificationsList({ compact = false }: NotificationsListProps) {
  const { notifications, isConnected, markAsRead, markAllAsRead } = useSocket()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
    } catch (error) {
      console.error('[v0] Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('All notifications marked as read')
    } catch (error) {
      console.error('[v0] Failed to mark all as read:', error)
      toast.error('Failed to mark all as read')
    }
  }

  const handleDismiss = (id: string) => {
    // Local dismiss only - could add API call if needed
  }

  const filteredNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications

  const displayedNotifications = compact
    ? filteredNotifications.slice(0, 5)
    : filteredNotifications

  const unreadCount = notifications.filter((n) => !n.isRead).length

  if (displayedNotifications.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <span>Real-time connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-red-500" />
              <span>Connecting...</span>
            </>
          )}
        </div>
        <div className="rounded-lg border border-border/50 border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {!compact && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {isConnected ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span>Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-red-500" />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
          <Separator />
        </>
      )}

      <div className="space-y-2">
        {displayedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 transition-colors',
              notification.isRead
                ? 'border-border/30 bg-muted/20'
                : 'border-border/50 bg-muted/50'
            )}
          >
            <div className="mt-1 shrink-0">
              {NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.SYSTEM}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm leading-tight">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead && (
                  <Badge variant="default" className="shrink-0 text-xs">
                    New
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleDateString()}
                </span>
                <div className="flex gap-1">
                  {!notification.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {compact && displayedNotifications.length < filteredNotifications.length && (
        <Button variant="outline" className="w-full bg-transparent">
          View All Notifications
        </Button>
      )}
    </div>
  )
}

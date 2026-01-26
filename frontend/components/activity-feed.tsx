'use client'

import { useState, useEffect } from 'react'
import { User, Activity } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface ActivityItem {
  id: string
  action: string
  actor: string
  target: string
  type: 'lead' | 'deal' | 'task' | 'user'
  timestamp: string
}

interface ActivityFeedProps {
  limit?: number
}

// Mock activity data - in real app, fetch from API
const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    action: 'created',
    actor: 'John Doe',
    target: 'New lead: Acme Inc',
    type: 'lead',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    action: 'updated',
    actor: 'Sarah Smith',
    target: 'Deal: Enterprise Package moved to Negotiation',
    type: 'deal',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: '3',
    action: 'completed',
    actor: 'Mike Johnson',
    target: 'Task: Follow up with client',
    type: 'task',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '4',
    action: 'added',
    actor: 'Admin User',
    target: 'New team member: Emily Chen',
    type: 'user',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: '5',
    action: 'created',
    actor: 'John Doe',
    target: 'New deal: Tech Solutions',
    type: 'deal',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
]

const TYPE_COLORS: Record<string, string> = {
  lead: 'bg-blue-100 dark:bg-blue-900/30',
  deal: 'bg-purple-100 dark:bg-purple-900/30',
  task: 'bg-green-100 dark:bg-green-900/30',
  user: 'bg-orange-100 dark:bg-orange-900/30',
}

const TYPE_BADGES: Record<string, string> = {
  lead: 'text-blue-700 dark:text-blue-300',
  deal: 'text-purple-700 dark:text-purple-300',
  task: 'text-green-700 dark:text-green-300',
  user: 'text-orange-700 dark:text-orange-300',
}

function formatTimeAgo(timestamp: string) {
  const now = new Date()
  const then = new Date(timestamp)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return then.toLocaleDateString()
}

export function ActivityFeed({ limit }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setActivities(limit ? MOCK_ACTIVITIES.slice(0, limit) : MOCK_ACTIVITIES)
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [limit])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3 relative">
          {/* Timeline line */}
          {index !== activities.length - 1 && (
            <div className="absolute left-3.5 top-8 w-0.5 h-12 bg-border/30" />
          )}

          {/* Activity avatar */}
          <div
            className={cn(
              'relative flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 border-background',
              TYPE_COLORS[activity.type]
            )}
          >
            {activity.type === 'user' ? (
              <User className="h-4 w-4" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
          </div>

          {/* Activity content */}
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm">
              <span className="font-medium">{activity.actor}</span>
              {' '}
              <span className="text-muted-foreground">{activity.action}</span>
              {' '}
              <span
                className={cn(
                  'font-medium inline-block px-2 py-0.5 rounded text-xs',
                  TYPE_BADGES[activity.type]
                )}
              >
                {activity.type}
              </span>
            </p>
            <p className="text-sm text-foreground mt-1">
              {activity.target}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

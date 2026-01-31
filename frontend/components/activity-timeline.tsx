'use client'

import { useState, useEffect } from 'react'
import { getActivityTimeline } from '@/lib/api-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  FileText,
  Phone,
  Mail,
  Calendar,
  Upload,
  ArrowRight,
  MessageSquare,
  User,
  Clock,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface Activity {
  id: string
  type: string
  content: string
  metadata?: any
  createdAt: string
  user: {
    id: string
    name: string
    avatar?: string
  }
  lead?: { id: string; name: string }
  deal?: { id: string; name: string }
}

interface ActivityTimelineProps {
  entityType?: 'lead' | 'deal'
  entityId?: string
  maxHeight?: string
  showHeader?: boolean
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  NOTE: <FileText className="h-4 w-4" />,
  CALL: <Phone className="h-4 w-4" />,
  EMAIL: <Mail className="h-4 w-4" />,
  MEETING: <Calendar className="h-4 w-4" />,
  FILE_UPLOAD: <Upload className="h-4 w-4" />,
  STATUS_CHANGE: <ArrowRight className="h-4 w-4" />,
  STAGE_CHANGE: <ArrowRight className="h-4 w-4" />,
}

const ACTIVITY_COLORS: Record<string, string> = {
  NOTE: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  CALL: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  EMAIL: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  MEETING: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  FILE_UPLOAD: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  STATUS_CHANGE: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  STAGE_CHANGE: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
}

export function ActivityTimeline({
  entityType,
  entityId,
  maxHeight = '500px',
  showHeader = true,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getActivityTimeline(entityType, entityId) as { activities: Activity[] }
        setActivities(data.activities || [])
      } catch (error) {
        console.error('Failed to fetch activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [entityType, entityId])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderActivityContent = (activity: Activity) => {
    if (activity.type === 'STATUS_CHANGE' && activity.metadata) {
      return (
        <span>
          Changed status from{' '}
          <Badge variant="outline" className="mx-1">
            {activity.metadata.oldStatus}
          </Badge>
          to
          <Badge variant="outline" className="mx-1">
            {activity.metadata.newStatus}
          </Badge>
        </span>
      )
    }

    if (activity.type === 'STAGE_CHANGE' && activity.metadata) {
      return (
        <span>
          Moved deal from{' '}
          <Badge variant="outline" className="mx-1">
            {activity.metadata.oldStage}
          </Badge>
          to
          <Badge variant="outline" className="mx-1">
            {activity.metadata.newStage}
          </Badge>
        </span>
      )
    }

    return <span>{activity.content}</span>
  }

  if (loading) {
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <CardTitle className="text-sm font-medium">Activity Timeline</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showHeader && (
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activities yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-6">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full ${
                        ACTIVITY_COLORS[activity.type] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {ACTIVITY_ICONS[activity.type] || <User className="h-4 w-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={activity.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {getInitials(activity.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{activity.user.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {activity.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                        </time>
                      </div>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {renderActivityContent(activity)}
                      </p>

                      {/* Related entity */}
                      {(activity.lead || activity.deal) && !entityId && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {activity.lead && (
                            <span>Lead: {activity.lead.name}</span>
                          )}
                          {activity.deal && (
                            <span>Deal: {activity.deal.name}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

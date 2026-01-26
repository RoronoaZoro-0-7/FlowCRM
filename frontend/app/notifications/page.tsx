'use client'

import { AppLayout } from '@/app/layout-app'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { NotificationsList } from '@/components/notifications-list'

export default function NotificationsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with all your important alerts and activities
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notification Center</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <NotificationsList />
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}

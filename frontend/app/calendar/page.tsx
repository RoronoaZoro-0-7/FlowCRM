'use client'

import { AppLayout } from '@/app/layout-app'
import { CalendarView } from '@/components/calendar-view'

export default function CalendarPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-2">
            Manage your events, meetings, and schedule
          </p>
        </div>

        <CalendarView />
      </div>
    </AppLayout>
  )
}

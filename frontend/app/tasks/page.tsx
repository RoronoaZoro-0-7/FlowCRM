'use client'

import { AppLayout } from '@/app/layout-app'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function TasksPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all tasks and assignments
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>Tasks list coming soon. Filter by status, assignee, and due date.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

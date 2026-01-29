'use client'

import { useState } from 'react'
import { AppLayout } from '@/app/layout-app'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { TasksTable } from '@/components/tasks-table'
import { CreateTaskModal } from '@/components/create-task-modal'
import { useAuth } from '@/contexts/auth-context'

export default function TasksPage() {
  const { user } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const canCreateTask = user?.role !== 'SALES'

  const handleTaskCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

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
          {canCreateTask && (
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Tasks</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <TasksTable refreshTrigger={refreshTrigger} />
          </div>
        </Card>

        {canCreateTask && (
          <CreateTaskModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onSuccess={handleTaskCreated}
          />
        )}
      </div>
    </AppLayout>
  )
}


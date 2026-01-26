'use client'

import { AppLayout } from '@/app/layout-app'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function DealsPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
            <p className="text-muted-foreground mt-2">
              Manage your sales pipeline with Kanban view
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sales Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            <p>Kanban board view for deals coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

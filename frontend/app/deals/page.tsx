'use client'

import { useState } from 'react'
import { AppLayout } from '@/app/layout-app'
import { DealsTable, Deal } from '@/components/deals-table'
import { CreateDealModal } from '@/components/create-deal-modal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function DealsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null)

  const handleDealCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
    setIsCreateModalOpen(false)
    setEditingDeal(null)
  }

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal)
    setIsCreateModalOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
            <p className="text-muted-foreground mt-2">
              Manage your sales pipeline and track deals
            </p>
          </div>
          <Button size="lg" className="gap-2" onClick={() => {
            setEditingDeal(null)
            setIsCreateModalOpen(true)
          }}>
            <Plus className="h-4 w-4" />
            New Deal
          </Button>
        </div>

        <DealsTable
          refreshTrigger={refreshTrigger}
          onEditDeal={handleEditDeal}
        />

        <CreateDealModal
          open={isCreateModalOpen}
          onOpenChange={(open) => {
            setIsCreateModalOpen(open)
            if (!open) {
              setEditingDeal(null)
            }
          }}
          onDealCreated={handleDealCreated}
          editingDeal={editingDeal}
        />
      </div>
    </AppLayout>
  )
}

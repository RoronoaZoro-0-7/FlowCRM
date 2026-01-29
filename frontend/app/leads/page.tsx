'use client'

import { useState } from 'react'
import { AppLayout } from '@/app/layout-app'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { LeadsTable, Lead } from '@/components/leads-table'
import { LeadDetailModal } from '@/components/lead-detail-modal'
import { CreateLeadModal } from '@/components/create-lead-modal'

export default function LeadsPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDetailModalOpen(true)
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setIsDetailModalOpen(true)
  }

  const handleDeleteLead = async (id: string) => {
    // TODO: Implement delete
    console.log('Delete lead:', id)
  }

  const handleLeadCreated = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-muted-foreground mt-2">
              Manage and track all your sales leads
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Leads</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <LeadsTable
              onViewLead={handleViewLead}
              onEditLead={handleEditLead}
              onDeleteLead={handleDeleteLead}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </Card>

        <LeadDetailModal
          lead={selectedLead}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedLead(null)
          }}
        />

        <CreateLeadModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleLeadCreated}
        />
      </div>
    </AppLayout>
  )
}

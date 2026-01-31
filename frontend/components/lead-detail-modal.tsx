'use client'

import React from "react"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Lead } from './leads-table'
import { toast } from 'sonner'
import { ActivityTimeline } from './activity-timeline'
import { LeadScoreCard } from './lead-score'
import { LeadEnrollments } from './follow-up-sequences'
import { getFollowUpSequences } from '@/lib/api-service'

interface LeadDetailModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
  onSave?: (lead: Lead) => void
}

const STATUS_OPTIONS = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST']

export function LeadDetailModal({
  lead,
  isOpen,
  onClose,
  onSave,
}: LeadDetailModalProps) {
  const [formData, setFormData] = useState<Partial<Lead> | null>(lead)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [sequences, setSequences] = useState<any[]>([])

  useEffect(() => {
    if (lead && isOpen) {
      setFormData(lead)
      fetchRelatedData()
    }
  }, [lead, isOpen])

  const fetchRelatedData = async () => {
    if (!lead?.id) return
    
    try {
      const seqData = await getFollowUpSequences()
      setSequences((seqData as any).sequences || [])
    } catch (error) {
      console.error('Failed to fetch related data:', error)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as any,
    }))
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      value: parseInt(e.target.value, 10) || 0,
    }))
  }

  const handleSave = async () => {
    if (!formData) return

    setIsLoading(true)
    try {
      // TODO: Implement API call to save lead
      toast.success('Lead saved successfully')
      onSave?.(formData as Lead)
      onClose()
    } catch (error) {
      toast.error('Failed to save lead')
    } finally {
      setIsLoading(false)
    }
  }

  if (!lead || !formData) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead: {lead.name}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="followups">Follow-ups</TabsTrigger>
            <TabsTrigger value="score">Score</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                placeholder="Lead name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ''}
                onChange={handleInputChange}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                name="company"
                value={formData.company || ''}
                onChange={handleInputChange}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Deal Value</Label>
              <Input
                id="value"
                type="number"
                value={formData.value || 0}
                onChange={handleValueChange}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Add any notes about this lead..."
              className="min-h-24"
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <p className="font-medium">Owner</p>
              <p>{formData.ownerName}</p>
            </div>
            <div>
              <p className="font-medium">Created</p>
              <p>
                {formData.createdAt &&
                  new Date(formData.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <ActivityTimeline
              entityType="lead"
              entityId={lead.id}
            />
          </TabsContent>

          <TabsContent value="followups" className="mt-4">
            <LeadEnrollments
              leadId={lead.id}
              sequences={sequences}
              onRefresh={fetchRelatedData}
            />
          </TabsContent>

          <TabsContent value="score" className="mt-4">
            <LeadScoreCard
              score={(lead as any).score || 50}
              previousScore={(lead as any).previousScore}
              lastUpdated={lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : undefined}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createDeal, updateDeal, getLeads, getUsers } from '@/lib/api-service'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Deal, DealStage } from './deals-table'

interface CreateDealModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDealCreated: () => void
  editingDeal?: Deal | null
}

interface Lead {
  id: string
  name: string
  company: string
}

interface User {
  id: string
  name: string
}

const STAGE_OPTIONS: { value: DealStage; label: string }[] = [
  { value: 'QUALIFICATION', label: 'Qualification' },
  { value: 'DISCOVERY', label: 'Discovery' },
  { value: 'PROPOSAL', label: 'Proposal' },
  { value: 'NEGOTIATION', label: 'Negotiation' },
  { value: 'CLOSED_WON', label: 'Closed Won' },
  { value: 'CLOSED_LOST', label: 'Closed Lost' },
]

export function CreateDealModal({
  open,
  onOpenChange,
  onDealCreated,
  editingDeal,
}: CreateDealModalProps) {
  const [loading, setLoading] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    stage: 'QUALIFICATION' as DealStage,
    leadId: '',
    assignedToId: '',
    expectedCloseDate: '',
    notes: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leadsData, usersData] = await Promise.all([
          getLeads() as Promise<Lead[]>,
          getUsers() as Promise<User[]>,
        ])
        setLeads(leadsData)
        setUsers(usersData)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

  useEffect(() => {
    if (editingDeal) {
      setFormData({
        title: editingDeal.title,
        value: editingDeal.value.toString(),
        stage: editingDeal.stage,
        leadId: editingDeal.leadId || '',
        assignedToId: editingDeal.assignedToId || '',
        expectedCloseDate: editingDeal.expectedCloseDate
          ? new Date(editingDeal.expectedCloseDate).toISOString().split('T')[0]
          : '',
        notes: '',
      })
    } else {
      setFormData({
        title: '',
        value: '',
        stage: 'QUALIFICATION',
        leadId: '',
        assignedToId: '',
        expectedCloseDate: '',
        notes: '',
      })
    }
  }, [editingDeal, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Please enter a deal title')
      return
    }

    if (!formData.value || isNaN(parseFloat(formData.value))) {
      toast.error('Please enter a valid deal value')
      return
    }

    setLoading(true)
    try {
      const dealData = {
        title: formData.title.trim(),
        value: parseFloat(formData.value),
        stage: formData.stage,
        leadId: formData.leadId || undefined,
        assignedToId: formData.assignedToId || undefined,
        expectedCloseDate: formData.expectedCloseDate || undefined,
      }

      if (editingDeal) {
        await updateDeal(editingDeal.id, dealData)
        toast.success('Deal updated successfully')
      } else {
        await createDeal(dealData)
        toast.success('Deal created successfully')
      }
      
      onDealCreated()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save deal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingDeal ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
          <DialogDescription>
            {editingDeal 
              ? 'Update the deal information below.'
              : 'Add a new deal to your pipeline.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Deal Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Enterprise Software License"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value ($) *</Label>
              <Input
                id="value"
                type="number"
                placeholder="50000"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value as DealStage })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((stage) => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead">Associated Lead</Label>
            <Select
              value={formData.leadId || '_none'}
              onValueChange={(value) => setFormData({ ...formData, leadId: value === '_none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a lead (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">None</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name} - {lead.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select
                value={formData.assignedToId || '_none'}
                onValueChange={(value) => setFormData({ ...formData, assignedToId: value === '_none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Unassigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : editingDeal ? 'Update Deal' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

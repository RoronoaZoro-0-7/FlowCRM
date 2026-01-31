'use client'

import { useState, useEffect } from 'react'
import {
  getFollowUpSequences,
  createFollowUpSequence,
  updateFollowUpSequence,
  deleteFollowUpSequence,
  enrollLeadInSequence,
  unenrollLead,
  getLeadEnrollments,
} from '@/lib/api-service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Mail,
  Clock,
  Bell,
  CheckSquare,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Loader2,
  ArrowRight,
  GripVertical,
} from 'lucide-react'
import { toast } from 'sonner'

interface FollowUpStep {
  id?: string
  stepOrder: number
  delayDays: number
  actionType: string
  subject?: string
  content: string
}

interface FollowUpSequence {
  id: string
  name: string
  active: boolean
  steps: FollowUpStep[]
  _count?: { enrollments: number }
}

interface Enrollment {
  id: string
  sequenceId: string
  leadId: string
  currentStep: number
  status: string
  nextRunAt: string | null
  sequence?: { name: string; steps: FollowUpStep[] }
}

const ACTION_TYPES = [
  { value: 'email', label: 'Send Email', icon: Mail },
  { value: 'task', label: 'Create Task', icon: CheckSquare },
  { value: 'notification', label: 'Send Notification', icon: Bell },
]

export function FollowUpSequenceManager() {
  const [sequences, setSequences] = useState<FollowUpSequence[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSequence, setEditingSequence] = useState<FollowUpSequence | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    steps: FollowUpStep[]
  }>({
    name: '',
    steps: [{ stepOrder: 1, delayDays: 1, actionType: 'email', subject: '', content: '' }],
  })

  useEffect(() => {
    fetchSequences()
  }, [])

  const fetchSequences = async () => {
    try {
      const data = await getFollowUpSequences() as { sequences: FollowUpSequence[] }
      setSequences(data.sequences || [])
    } catch (error) {
      console.error('Failed to fetch sequences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (sequence: FollowUpSequence) => {
    setEditingSequence(sequence)
    setFormData({
      name: sequence.name,
      steps: sequence.steps.map((s) => ({
        stepOrder: s.stepOrder,
        delayDays: s.delayDays,
        actionType: s.actionType,
        subject: s.subject || '',
        content: s.content,
      })),
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a sequence name')
      return
    }

    if (formData.steps.length === 0) {
      toast.error('Please add at least one step')
      return
    }

    setSaving(true)
    try {
      if (editingSequence) {
        await updateFollowUpSequence(editingSequence.id, {
          name: formData.name,
          steps: formData.steps,
        })
        toast.success('Sequence updated')
      } else {
        await createFollowUpSequence({
          name: formData.name,
          steps: formData.steps,
        })
        toast.success('Sequence created')
      }

      setShowForm(false)
      setEditingSequence(null)
      resetForm()
      fetchSequences()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save sequence')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteFollowUpSequence(deleteId)
      toast.success('Sequence deleted')
      setSequences((prev) => prev.filter((s) => s.id !== deleteId))
      setDeleteId(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete sequence')
    }
  }

  const handleToggleActive = async (sequence: FollowUpSequence) => {
    try {
      await updateFollowUpSequence(sequence.id, { active: !sequence.active })
      setSequences((prev) =>
        prev.map((s) => (s.id === sequence.id ? { ...s, active: !s.active } : s))
      )
      toast.success(sequence.active ? 'Sequence paused' : 'Sequence activated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update sequence')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      steps: [{ stepOrder: 1, delayDays: 1, actionType: 'email', subject: '', content: '' }],
    })
  }

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          stepOrder: prev.steps.length + 1,
          delayDays: 3,
          actionType: 'email',
          subject: '',
          content: '',
        },
      ],
    }))
  }

  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((s, i) => ({ ...s, stepOrder: i + 1 })),
    }))
  }

  const updateStep = (index: number, data: Partial<FollowUpStep>) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s, i) => (i === index ? { ...s, ...data } : s)),
    }))
  }

  const getActionIcon = (actionType: string) => {
    const action = ACTION_TYPES.find((a) => a.value === actionType)
    return action ? <action.icon className="h-4 w-4" /> : <Mail className="h-4 w-4" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Follow-up Sequences
            </CardTitle>
            <CardDescription>
              Automate follow-up emails, tasks, and notifications for leads
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingSequence(null)
              resetForm()
              setShowForm(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Sequence
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sequences.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No follow-up sequences yet</p>
            <Button
              variant="link"
              onClick={() => {
                setEditingSequence(null)
                resetForm()
                setShowForm(true)
              }}
              className="mt-2"
            >
              Create your first sequence
            </Button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {sequences.map((sequence) => (
              <AccordionItem
                key={sequence.id}
                value={sequence.id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      {sequence.active ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Paused</Badge>
                      )}
                    </div>
                    <span className="font-medium">{sequence.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {sequence.steps.length} step{sequence.steps.length !== 1 ? 's' : ''}
                    </span>
                    {sequence._count && (
                      <Badge variant="outline">
                        {sequence._count.enrollments} enrolled
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    {/* Steps Preview */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {sequence.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                            {getActionIcon(step.actionType)}
                            <span className="text-sm capitalize">
                              Day {step.delayDays}: {step.actionType}
                            </span>
                          </div>
                          {index < sequence.steps.length - 1 && (
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(sequence)}
                      >
                        {sequence.active ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(sequence)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(sequence.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Sequence Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSequence ? 'Edit Sequence' : 'New Follow-up Sequence'}
              </DialogTitle>
              <DialogDescription>
                Create automated follow-up actions for your leads
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Sequence Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., New Lead Welcome Series"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Steps</Label>
                  <Button variant="outline" size="sm" onClick={addStep}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>

                {formData.steps.map((step, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 space-y-4 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Step {index + 1}</Badge>
                        <span className="text-sm text-muted-foreground">
                          Day {step.delayDays}
                        </span>
                      </div>
                      {formData.steps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeStep(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Delay (days)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={step.delayDays}
                          onChange={(e) =>
                            updateStep(index, { delayDays: parseInt(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Action Type</Label>
                        <Select
                          value={step.actionType}
                          onValueChange={(v) => updateStep(index, { actionType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTION_TYPES.map((action) => (
                              <SelectItem key={action.value} value={action.value}>
                                <div className="flex items-center gap-2">
                                  <action.icon className="h-4 w-4" />
                                  {action.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {step.actionType === 'email' && (
                      <div className="space-y-2">
                        <Label>Subject</Label>
                        <Input
                          value={step.subject}
                          onChange={(e) => updateStep(index, { subject: e.target.value })}
                          placeholder="Email subject line"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>
                        {step.actionType === 'email'
                          ? 'Email Content'
                          : step.actionType === 'task'
                          ? 'Task Description'
                          : 'Notification Message'}
                      </Label>
                      <Textarea
                        value={step.content}
                        onChange={(e) => updateStep(index, { content: e.target.value })}
                        placeholder={
                          step.actionType === 'email'
                            ? 'Hi {{lead.name}},\n\nThank you for your interest...'
                            : 'Enter the content...'
                        }
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {'{{lead.name}}'}, {'{{lead.email}}'}, {'{{lead.company}}'} for dynamic values
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSequence ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Sequence</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this sequence? All enrolled leads will be
                unenrolled. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

// Enrollment component for lead detail view
interface LeadEnrollmentsProps {
  leadId: string
  sequences: FollowUpSequence[]
  onRefresh?: () => void
}

export function LeadEnrollments({ leadId, sequences, onRefresh }: LeadEnrollmentsProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    fetchEnrollments()
  }, [leadId])

  const fetchEnrollments = async () => {
    try {
      const data = await getLeadEnrollments(leadId) as { enrollments: Enrollment[] }
      setEnrollments(data.enrollments || [])
    } catch (error) {
      console.error('Failed to fetch enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (sequenceId: string) => {
    setEnrolling(true)
    try {
      await enrollLeadInSequence(sequenceId, leadId)
      toast.success('Lead enrolled in sequence')
      fetchEnrollments()
      onRefresh?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to enroll lead')
    } finally {
      setEnrolling(false)
    }
  }

  const handleUnenroll = async (sequenceId: string) => {
    try {
      await unenrollLead(leadId, sequenceId)
      toast.success('Lead unenrolled')
      setEnrollments((prev) => prev.filter((e) => e.sequenceId !== sequenceId))
    } catch (error: any) {
      toast.error(error.message || 'Failed to unenroll lead')
    }
  }

  const enrolledSequenceIds = enrollments.map((e) => e.sequenceId)
  const availableSequences = sequences.filter(
    (s) => s.active && !enrolledSequenceIds.includes(s.id)
  )

  if (loading) {
    return <Skeleton className="h-24 w-full" />
  }

  return (
    <div className="space-y-4">
      {/* Current Enrollments */}
      {enrollments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Active Sequences</Label>
          {enrollments.map((enrollment) => (
            <div
              key={enrollment.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">
                    {enrollment.sequence?.name || 'Sequence'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Step {enrollment.currentStep + 1} of{' '}
                    {enrollment.sequence?.steps.length || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={enrollment.status === 'active' ? 'default' : 'secondary'}
                >
                  {enrollment.status}
                </Badge>
                {enrollment.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnenroll(enrollment.sequenceId)}
                  >
                    <Pause className="h-4 w-4 mr-1" />
                    Stop
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enroll in Sequence */}
      {availableSequences.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Enroll in Sequence</Label>
          <Select
            onValueChange={handleEnroll}
            disabled={enrolling}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a sequence..." />
            </SelectTrigger>
            <SelectContent>
              {availableSequences.map((sequence) => (
                <SelectItem key={sequence.id} value={sequence.id}>
                  {sequence.name} ({sequence.steps.length} steps)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

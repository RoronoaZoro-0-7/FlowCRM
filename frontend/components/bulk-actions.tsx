'use client'

import { useState, useCallback } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  MoreHorizontal,
  Trash2,
  Edit,
  UserPlus,
  Tags,
  Archive,
  Mail,
  Download,
  Loader2,
  CheckSquare,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

interface BulkAction {
  id: string
  label: string
  icon: React.ReactNode
  variant?: 'default' | 'destructive'
  requiresConfirmation?: boolean
  confirmationMessage?: string
}

interface BulkActionsProps<T extends { id: string }> {
  items: T[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onBulkDelete?: (ids: string[]) => Promise<void>
  onBulkAssign?: (ids: string[], userId: string) => Promise<void>
  onBulkUpdateStatus?: (ids: string[], status: string) => Promise<void>
  onBulkAddTags?: (ids: string[], tags: string[]) => Promise<void>
  onBulkArchive?: (ids: string[]) => Promise<void>
  onBulkEmail?: (ids: string[]) => void
  onBulkExport?: (ids: string[]) => void
  users?: { id: string; name: string }[]
  statuses?: { value: string; label: string }[]
  availableTags?: string[]
  entityName?: string
}

export function BulkActions<T extends { id: string }>({
  items,
  selectedIds,
  onSelectionChange,
  onBulkDelete,
  onBulkAssign,
  onBulkUpdateStatus,
  onBulkAddTags,
  onBulkArchive,
  onBulkEmail,
  onBulkExport,
  users = [],
  statuses = [],
  availableTags = [],
  entityName = 'items',
}: BulkActionsProps<T>) {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const isAllSelected = items.length > 0 && selectedIds.length === items.length
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < items.length

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(items.map((item) => item.id))
    }
  }

  const handleClearSelection = () => {
    onSelectionChange([])
  }

  const handleDelete = async () => {
    if (!onBulkDelete) return
    setLoading(true)
    try {
      await onBulkDelete(selectedIds)
      toast.success(`${selectedIds.length} ${entityName} deleted`)
      onSelectionChange([])
      setShowDeleteConfirm(false)
    } catch (error: any) {
      toast.error(error.message || `Failed to delete ${entityName}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!onBulkAssign || !selectedUser) return
    setLoading(true)
    try {
      await onBulkAssign(selectedIds, selectedUser)
      toast.success(`${selectedIds.length} ${entityName} assigned`)
      onSelectionChange([])
      setShowAssignDialog(false)
      setSelectedUser('')
    } catch (error: any) {
      toast.error(error.message || `Failed to assign ${entityName}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!onBulkUpdateStatus || !selectedStatus) return
    setLoading(true)
    try {
      await onBulkUpdateStatus(selectedIds, selectedStatus)
      toast.success(`${selectedIds.length} ${entityName} updated`)
      onSelectionChange([])
      setShowStatusDialog(false)
      setSelectedStatus('')
    } catch (error: any) {
      toast.error(error.message || `Failed to update ${entityName}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTags = async () => {
    if (!onBulkAddTags || selectedTags.length === 0) return
    setLoading(true)
    try {
      await onBulkAddTags(selectedIds, selectedTags)
      toast.success(`Tags added to ${selectedIds.length} ${entityName}`)
      onSelectionChange([])
      setShowTagDialog(false)
      setSelectedTags([])
    } catch (error: any) {
      toast.error(error.message || `Failed to add tags`)
    } finally {
      setLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!onBulkArchive) return
    setLoading(true)
    try {
      await onBulkArchive(selectedIds)
      toast.success(`${selectedIds.length} ${entityName} archived`)
      onSelectionChange([])
    } catch (error: any) {
      toast.error(error.message || `Failed to archive ${entityName}`)
    } finally {
      setLoading(false)
    }
  }

  if (selectedIds.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAll}
          className="border-muted-foreground/50"
        />
        <span className="text-sm text-muted-foreground">Select all</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isAllSelected}
            ref={(el) => {
              if (el) {
                (el as any).indeterminate = isPartiallySelected
              }
            }}
            onCheckedChange={handleSelectAll}
          />
          <Badge variant="secondary">
            {selectedIds.length} selected
          </Badge>
          <Button variant="ghost" size="sm" onClick={handleClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-1">
          {onBulkUpdateStatus && statuses.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStatusDialog(true)}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          )}

          {onBulkAssign && users.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssignDialog(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign
            </Button>
          )}

          {onBulkEmail && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkEmail(selectedIds)}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
          )}

          {onBulkExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkExport(selectedIds)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>More Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {onBulkAddTags && availableTags.length > 0 && (
                <DropdownMenuItem onClick={() => setShowTagDialog(true)}>
                  <Tags className="h-4 w-4 mr-2" />
                  Add Tags
                </DropdownMenuItem>
              )}

              {onBulkArchive && (
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}

              {onBulkDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} {entityName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected {entityName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign {entityName}</DialogTitle>
            <DialogDescription>
              Assign {selectedIds.length} {entityName} to a team member
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={loading || !selectedUser}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedIds.length} {entityName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a status..." />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={loading || !selectedStatus}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tags Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tags</DialogTitle>
            <DialogDescription>
              Add tags to {selectedIds.length} {entityName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Select Tags</Label>
            <div className="flex flex-wrap gap-2 mt-3">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedTags((prev) =>
                      prev.includes(tag)
                        ? prev.filter((t) => t !== tag)
                        : [...prev, tag]
                    )
                  }
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTags} disabled={loading || selectedTags.length === 0}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Tags
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Row-level checkbox component
interface BulkSelectCheckboxProps {
  id: string
  selectedIds: string[]
  onToggle: (id: string) => void
}

export function BulkSelectCheckbox({ id, selectedIds, onToggle }: BulkSelectCheckboxProps) {
  return (
    <Checkbox
      checked={selectedIds.includes(id)}
      onCheckedChange={() => onToggle(id)}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

// Hook for managing bulk selection state
export function useBulkSelection<T extends { id: string }>() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }, [])

  const selectAll = useCallback((items: T[]) => {
    setSelectedIds(items.map((item) => item.id))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedIds([])
  }, [])

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  )

  return {
    selectedIds,
    setSelectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection: selectedIds.length > 0,
  }
}

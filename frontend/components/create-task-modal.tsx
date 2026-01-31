'use client'

import { useState, useEffect } from 'react'
import { createTask, updateTask, getUsers } from '@/lib/api-service'
import { useAuth } from '@/contexts/auth-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Task {
  id: string
  title: string
  description?: string
  priority: string
  dueDate?: string
  assignedToId: string
}

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingTask?: Task | null
}

export function CreateTaskModal({ isOpen, onClose, onSuccess, editingTask }: CreateTaskModalProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedToId: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
      if (editingTask) {
        setFormData({
          title: editingTask.title,
          description: editingTask.description || '',
          priority: editingTask.priority,
          dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : '',
          assignedToId: editingTask.assignedToId,
        })
      } else {
        setFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          dueDate: '',
          assignedToId: '',
        })
      }
    }
  }, [isOpen, editingTask])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const data = await getUsers()
      // Filter based on role - Manager can only assign to SALES
      let filteredUsers = data
      if (user?.role === 'MANAGER') {
        filteredUsers = data.filter((u: User) => u.role === 'SALES')
      } else if (user?.role === 'ADMIN' || user?.role === 'OWNER') {
        // Admin/Owner can assign to anyone except OWNER
        filteredUsers = data.filter((u: User) => u.role !== 'OWNER')
      }
      setUsers(filteredUsers)
    } catch (error) {
      console.error('Failed to fetch users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoadingUsers(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title || !formData.assignedToId) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setIsLoading(true)

    try {
      const taskData = {
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        dueDate: formData.dueDate || undefined,
        assignedToId: formData.assignedToId,
      }

      if (editingTask) {
        await updateTask(editingTask.id, taskData)
        toast.success('Task updated successfully')
      } else {
        await createTask(taskData)
        toast.success('Task created successfully')
      }
      
      setFormData({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: '',
        assignedToId: '',
      })
      onClose()
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : editingTask ? 'Failed to update task' : 'Failed to create task'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {editingTask ? 'Update the task details below.' : 'Add a new task and assign it to a team member.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter task title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assignedToId">Assign To *</Label>
              <Select
                value={formData.assignedToId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, assignedToId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingUsers ? "Loading..." : "Select team member"} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingTask ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

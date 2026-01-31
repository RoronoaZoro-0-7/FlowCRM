'use client'

import React, { useEffect } from "react"

import { useState } from 'react'
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
import { toast } from 'sonner'
import { createUser, updateUser } from '@/lib/api-service'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface AddUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingUser?: User | null
}

const ROLE_OPTIONS = [
  { value: 'SALES', label: 'Sales User' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'ADMIN', label: 'Admin' },
]

export function AddUserModal({ isOpen, onClose, onSuccess, editingUser }: AddUserModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'SALES',
  })

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
      })
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'SALES',
      })
    }
  }, [editingUser, isOpen])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: formData.name,
          role: formData.role,
        })
        toast.success('User updated successfully')
      } else {
        await createUser(formData)
        toast.success('User added successfully')
      }
      setFormData({
        name: '',
        email: '',
        role: 'SALES',
      })
      onClose()
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : editingUser ? 'Failed to update user' : 'Failed to add user'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingUser ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john@example.com"
              required
              disabled={!!editingUser}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!editingUser && (
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              An invitation email will be sent to the user with login credentials.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (editingUser ? 'Updating...' : 'Adding...') : (editingUser ? 'Update User' : 'Add User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

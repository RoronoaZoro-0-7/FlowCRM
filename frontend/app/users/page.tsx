'use client'

import { useState } from 'react'
import { AppLayout } from '@/app/layout-app'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { UsersTable, User } from '@/components/users-table'
import { AddUserModal } from '@/components/add-user-modal'

export default function UsersPage() {
  const { user } = useAuth()
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    // TODO: Open edit modal
  }

  const handleDeleteUser = async (id: string) => {
    // TODO: Implement delete/deactivate
    console.log('Delete user:', id)
  }

  return (
    <ProtectedRoute requiredRoles={['ADMIN']}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Users & Roles</h1>
              <p className="text-muted-foreground mt-2">
                Manage team members and their roles
              </p>
            </div>
            <Button
              size="lg"
              className="gap-2"
              onClick={() => setIsAddUserModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
            </CardHeader>
            <div className="px-6 pb-6">
              <UsersTable
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
              />
            </div>
          </Card>

          <AddUserModal
            isOpen={isAddUserModalOpen}
            onClose={() => setIsAddUserModalOpen(false)}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

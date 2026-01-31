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
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsAddUserModalOpen(true)
  }

  const handleDeleteUser = async (id: string) => {
    // TODO: Implement delete/deactivate
    console.log('Delete user:', id)
  }

  const handleUserSaved = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <ProtectedRoute requiredRoles={['OWNER', 'ADMIN']}>
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
              onClick={() => {
                setSelectedUser(null)
                setIsAddUserModalOpen(true)
              }}
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
                refreshTrigger={refreshTrigger}
              />
            </div>
          </Card>

          <AddUserModal
            isOpen={isAddUserModalOpen}
            onClose={() => {
              setIsAddUserModalOpen(false)
              setSelectedUser(null)
            }}
            onSuccess={handleUserSaved}
            editingUser={selectedUser}
          />
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}

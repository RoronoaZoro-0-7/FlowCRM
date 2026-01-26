'use client'

import { useEffect, useState } from 'react'
import { getUsers } from '@/lib/api-service'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MoreHorizontal, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'SALES'
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin?: string
}

interface UsersTableProps {
  onEditUser?: (user: User) => void
  onDeleteUser?: (id: string) => void
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SALES: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive:
    'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

export function UsersTable({ onEditUser, onDeleteUser }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers() as User[]
        setUsers(data)
      } catch (error) {
        console.error('[v0] Failed to fetch users:', error)
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) {
    return (
      <div className="rounded-lg border border-border/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="px-4 py-3 text-left text-sm font-semibold">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold">
                <Skeleton className="h-4 w-12" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-3 text-right">
                  <Skeleton className="h-8 w-8 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 border-dashed p-8 text-center">
        <p className="text-muted-foreground">No users found.</p>
      </div>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="border-b border-border/50 hover:bg-muted/30">
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Last Login</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="border-b border-border/50 hover:bg-muted/50 transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs font-bold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.email}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={ROLE_COLORS[user.role] || 'bg-gray-100'}
                >
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={STATUS_COLORS[user.status] || 'bg-gray-100'}
                >
                  {user.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleDateString()
                  : 'Never'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEditUser?.(user)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteUser?.(user.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUsers, updateUser } from '@/lib/api-service'
import { useAuth } from '@/contexts/auth-context'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Edit2, Trash2, Eye, Search, Filter } from 'lucide-react'
import { toast } from 'sonner'

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'SALES'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin?: string
}

interface UsersTableProps {
  onEditUser?: (user: User) => void
  onDeleteUser?: (id: string) => void
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  SALES: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
}

const ROLE_OPTIONS: UserRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'SALES']

export function UsersTable({ onEditUser, onDeleteUser }: UsersTableProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const { user: currentUser } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers() as User[]
        setUsers(data)
        setFilteredUsers(data)
      } catch (error) {
        console.error('[v0] Failed to fetch users:', error)
        toast.error('Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Apply search and role filters
  useEffect(() => {
    let filtered = [...users]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, roleFilter])

  const canViewUserProfile = (user: User) => {
    if (!currentUser) return false
    // OWNER and ADMIN can view all profiles
    if (currentUser.role === 'OWNER' || currentUser.role === 'ADMIN') return true
    // MANAGER can view SALES profiles
    if (currentUser.role === 'MANAGER' && user.role === 'SALES') return true
    return false
  }

  // Check if current user can change another user's role
  const canChangeRole = (targetUser: User): boolean => {
    if (!currentUser) return false
    // Can't change own role
    if (currentUser.id === targetUser.id) return false
    // Only OWNER and ADMIN can change roles
    if (currentUser.role !== 'OWNER' && currentUser.role !== 'ADMIN') return false
    // ADMIN cannot change OWNER roles
    if (currentUser.role === 'ADMIN' && targetUser.role === 'OWNER') return false
    return true
  }

  // Get available roles based on current user's role
  const getAvailableRoles = (): UserRole[] => {
    if (!currentUser) return []
    if (currentUser.role === 'OWNER') return ['ADMIN', 'MANAGER', 'SALES']
    if (currentUser.role === 'ADMIN') return ['MANAGER', 'SALES']
    return []
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUser(userId, { role: newRole })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      )
      toast.success('User role updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role')
    }
  }

  const handleViewProfile = (userId: string) => {
    router.push(`/users/${userId}`)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-24" /></th>
                <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-20" /></th>
                <th className="px-4 py-3 text-left"><Skeleton className="h-4 w-16" /></th>
                <th className="px-4 py-3 text-right"><Skeleton className="h-4 w-12" /></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLE_OPTIONS.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-border/50 border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            {users.length === 0 ? 'No users found.' : 'No users match your filters.'}
          </p>
        </div>
      ) : (
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
              {filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => canViewUserProfile(user) && handleViewProfile(user.id)}
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
                  <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canChangeRole(user) ? (
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as UserRole)}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <Badge variant="outline" className={ROLE_COLORS[user.role] || 'bg-gray-100'}>
                            {user.role}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoles().map((role) => (
                            <SelectItem key={role} value={role}>
                              <Badge variant="outline" className={ROLE_COLORS[role]}>
                                {role}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={ROLE_COLORS[user.role] || 'bg-gray-100'}>
                        {user.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[user.status] || 'bg-gray-100'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canViewUserProfile(user) && (
                          <DropdownMenuItem onClick={() => handleViewProfile(user.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                        )}
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
      )}
    </div>
  )
}

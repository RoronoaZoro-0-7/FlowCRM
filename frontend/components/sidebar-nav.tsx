'use client'

import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/contexts/socket-context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  Zap,
  CheckSquare,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/deals', label: 'Deals', icon: Zap },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
]

const adminNavItems = [
  { href: '/users', label: 'Users & Roles', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function SidebarNav() {
  const { user, logout } = useAuth()
  const { unreadCount } = useSocket()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  const isAdmin = user.role === 'ADMIN'
  const allNavItems = [...navItems, ...(isAdmin ? adminNavItems : [])]

  const handleLogout = async () => {
    await logout()
  }

  const NavContent = () => (
    <>
      <div className="flex flex-col gap-0.5">
        {allNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const showBadge = 'showBadge' in item && item.showBadge && unreadCount > 0
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start gap-2 relative"
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {showBadge && (
                  <span className="absolute right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-medium text-destructive-foreground">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          )
        })}
      </div>

      <div className="border-t border-border/50 pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden h-screen w-60 border-r border-border/50 bg-sidebar p-4 flex-col lg:flex sticky top-0">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-sidebar-foreground">FlowCRM</h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">
            {user.name}
          </p>
          <div className="inline-block mt-2 rounded-full bg-sidebar-primary/20 px-2 py-1">
            <p className="text-xs font-medium text-sidebar-primary">
              {user.role}
            </p>
          </div>
        </div>

        <nav className="flex flex-col flex-1 gap-2">
          <NavContent />
        </nav>
      </aside>

      {/* Mobile Sidebar Toggle */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border/50 bg-background/95 px-4 py-3 lg:hidden">
        <h1 className="text-lg font-bold">FlowCRM</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-30 bg-background/80 backdrop-blur-sm lg:hidden">
          <div className="border-r border-border/50 bg-sidebar p-4">
            <nav className="space-y-2">
              <NavContent />
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

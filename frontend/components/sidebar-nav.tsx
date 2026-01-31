'use client'

import { useAuth } from '@/contexts/auth-context'
import { useSocket } from '@/contexts/socket-context'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
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
  Building2,
  Calendar,
  Phone,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { ThemeToggle } from '@/components/theme-toggle'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/deals', label: 'Deals', icon: Zap },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/notifications', label: 'Notifications', icon: Bell, showBadge: true },
]

const adminNavItems = [
  { href: '/users', label: 'Users & Roles', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const ownerNavItems = [
  { href: '/organizations', label: 'Organizations', icon: Building2 },
  { href: '/users', label: 'Users & Roles', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function SidebarNav() {
  const { user, logout } = useAuth()
  const { unreadCount } = useSocket()
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!user) return null

  const logoSrc = mounted && resolvedTheme === 'dark' 
    ? '/flowcrm-logo-dark.svg' 
    : '/flowcrm-logo.svg'

  const isOwner = user.role === 'OWNER'
  const isAdmin = user.role === 'ADMIN'
  
  // Owner sees owner nav items, Admin sees admin nav items
  const additionalNavItems = isOwner ? ownerNavItems : isAdmin ? adminNavItems : []
  const allNavItems = [...navItems, ...additionalNavItems]

  const handleLogout = async () => {
    await logout()
  }

  const NavContent = () => (
    <>
      <div className="flex flex-col gap-1">
        {allNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const showBadge = 'showBadge' in item && item.showBadge && unreadCount > 0
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  "w-full justify-start gap-3 relative h-10 px-3",
                  isActive && "bg-primary/10 text-primary font-medium"
                )}
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

      <div className="border-t border-border/50 pt-4 space-y-2">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 h-10 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
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
      <aside className="hidden h-screen w-64 border-r border-border bg-card/50 backdrop-blur-sm flex-col lg:flex sticky top-0">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Image 
              src={logoSrc} 
              alt="FlowCRM" 
              width={36} 
              height={36}
              className="rounded-lg"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              FlowCRM
            </h1>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex flex-col flex-1 p-4 gap-2">
          <NavContent />
        </nav>
      </aside>

      {/* Mobile Sidebar Toggle */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <Image 
            src={logoSrc} 
            alt="FlowCRM" 
            width={28} 
            height={28}
            className="rounded-md"
          />
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            FlowCRM
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-30 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)}>
          <div className="w-64 border-r border-border bg-card/95 backdrop-blur-sm p-4 h-full" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3 pb-4 border-b border-border">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {user.role}
                </span>
              </div>
            </div>
            <nav className="space-y-2">
              <NavContent />
            </nav>
          </div>
        </div>
      )}
    </>
  )
}

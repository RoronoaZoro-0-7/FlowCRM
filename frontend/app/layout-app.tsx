'use client'

import React from "react"

import { SidebarNav } from '@/components/sidebar-nav'
import { ProtectedRoute } from '@/components/protected-route'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <SidebarNav />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

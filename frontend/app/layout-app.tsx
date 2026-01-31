'use client'

import React from "react"

import { SidebarNav } from '@/components/sidebar-nav'
import { ProtectedRoute } from '@/components/protected-route'
import { ChatPanel } from '@/components/chat-panel'
import { AIAssistant } from '@/components/ai-assistant'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <SidebarNav />
        <main className="flex-1 overflow-auto bg-muted/30">
          <div className="container mx-auto max-w-7xl p-6 lg:p-8">
            {children}
          </div>
        </main>
        {/* Chat Panel */}
        <ChatPanel />
        {/* AI Assistant */}
        <AIAssistant />
      </div>
    </ProtectedRoute>
  )
}

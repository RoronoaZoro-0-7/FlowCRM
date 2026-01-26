'use client'

import { AppLayout } from '@/app/layout-app'
import { useAuth } from '@/contexts/auth-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ProfileSettings,
  SecuritySettings,
  OrganizationSettings,
  BillingSettings,
} from '@/components/settings-sections'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account and organization settings
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <div className="mt-6 space-y-6">
            <TabsContent value="profile" className="space-y-6">
              <ProfileSettings />
              {user?.role === 'ADMIN' && <OrganizationSettings />}
              <BillingSettings />
            </TabsContent>

            <TabsContent value="security">
              <SecuritySettings />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  )
}

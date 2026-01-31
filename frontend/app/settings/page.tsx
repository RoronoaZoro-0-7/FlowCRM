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
import { WebhookSettings } from '@/components/webhook-settings'
import { CustomFieldsManager } from '@/components/custom-fields'
import { FollowUpSequenceManager } from '@/components/follow-up-sequences'
import { LogoUploader } from '@/components/logo-uploader'
import { CurrencySelector } from '@/components/currency'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useState } from 'react'
import { updateOrganizationSettings } from '@/lib/api-service'
import { toast } from 'sonner'

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
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            {user?.role === 'ADMIN' && (
              <>
                <TabsTrigger value="organization">Organization</TabsTrigger>
                <TabsTrigger value="custom-fields">Custom Fields</TabsTrigger>
                <TabsTrigger value="automations">Automations</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              </>
            )}
          </TabsList>

          <div className="mt-6 space-y-6">
            <TabsContent value="profile" className="space-y-6">
              <ProfileSettings />
              <BillingSettings />
            </TabsContent>

            <TabsContent value="security">
              <SecuritySettings />
            </TabsContent>

            {user?.role === 'ADMIN' && (
              <>
                <TabsContent value="organization" className="space-y-6">
                  <OrganizationSettings />
                  <OrganizationBrandingSettings />
                </TabsContent>

                <TabsContent value="custom-fields">
                  <CustomFieldsManager />
                </TabsContent>

                <TabsContent value="automations">
                  <FollowUpSequenceManager />
                </TabsContent>

                <TabsContent value="webhooks">
                  <WebhookSettings />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </AppLayout>
  )
}

function OrganizationBrandingSettings() {
  const [currency, setCurrency] = useState('USD')
  const [logos, setLogos] = useState<{ light: string | null; dark: string | null }>({
    light: null,
    dark: null,
  })

  const handleCurrencyChange = async (newCurrency: string) => {
    try {
      await updateOrganizationSettings({ currency: newCurrency })
      setCurrency(newCurrency)
      toast.success('Currency updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update currency')
    }
  }

  const handleLogoChange = async (newLogos: { light: string | null; dark: string | null }) => {
    try {
      await updateOrganizationSettings({
        logoLight: newLogos.light || undefined,
        logoDark: newLogos.dark || undefined,
      })
      setLogos(newLogos)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update logo')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Currency Settings</CardTitle>
          <CardDescription>
            Set the default currency for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <CurrencySelector
              value={currency}
              onChange={handleCurrencyChange}
              label="Default Currency"
            />
          </div>
        </CardContent>
      </Card>

      <LogoUploader currentLogo={logos} onLogoChange={handleLogoChange} />
    </div>
  )
}

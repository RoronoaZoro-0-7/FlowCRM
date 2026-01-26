'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Mail, Bell, Shield, Eye } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export function ProfileSettings() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 123-4567',
  })

  const handleSave = async () => {
    try {
      // TODO: API call to save profile
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your personal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            disabled={!isEditing}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Profile
            </Button>
          ) : (
            <>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    taskReminders: true,
    dealUpdates: true,
    weeklyReport: false,
  })

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async () => {
    try {
      // TODO: API call to save notification settings
      toast.success('Notification settings updated')
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="font-normal capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Label>
              <Switch
                id={key}
                checked={value}
                onCheckedChange={() =>
                  handleToggle(key as keyof typeof settings)
                }
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave}>Save Preferences</Button>
      </CardContent>
    </Card>
  )
}

export function SecuritySettings() {
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [verifyToken, setVerifyToken] = useState('')
  const [disableToken, setDisableToken] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisable2FA, setShowDisable2FA] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch 2FA status on mount
  useState(() => {
    const fetch2FAStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch(`${API_BASE}/2fa/status`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setTwoFactorEnabled(data.enabled)
        }
      } catch (error) {
        console.error('Failed to fetch 2FA status:', error)
      }
    }
    fetch2FAStatus()
  })

  const handleSetup2FA = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE}/2fa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setShow2FASetup(true)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to setup 2FA')
      }
    } catch (error) {
      toast.error('Failed to setup 2FA')
    }
    setLoading(false)
  }

  const handleVerify2FA = async () => {
    if (!verifyToken || verifyToken.length !== 6) {
      toast.error('Please enter a 6-digit code')
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE}/2fa/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: verifyToken }),
      })
      if (response.ok) {
        toast.success('2FA enabled successfully!')
        setTwoFactorEnabled(true)
        setShow2FASetup(false)
        setVerifyToken('')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Invalid verification code')
      }
    } catch (error) {
      toast.error('Failed to verify 2FA')
    }
    setLoading(false)
  }

  const handleDisable2FA = async () => {
    if (!disableToken || !disablePassword) {
      toast.error('Please enter both your password and 2FA code')
      return
    }
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_BASE}/2fa/disable`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ token: disableToken, password: disablePassword }),
      })
      if (response.ok) {
        toast.success('2FA disabled successfully')
        setTwoFactorEnabled(false)
        setShowDisable2FA(false)
        setDisableToken('')
        setDisablePassword('')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to disable 2FA')
      }
    } catch (error) {
      toast.error('Failed to disable 2FA')
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security
        </CardTitle>
        <CardDescription>
          Manage your account security and sessions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">Password</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Last changed 30 days ago
          </p>
          {!showPasswordForm ? (
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(true)}
            >
              Change Password
            </Button>
          ) : (
            <div className="space-y-3">
              <Input type="password" placeholder="Current password" />
              <Input type="password" placeholder="New password" />
              <Input type="password" placeholder="Confirm password" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPasswordForm(false)}>
                  Cancel
                </Button>
                <Button>Update Password</Button>
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Add an extra layer of security to your account
          </p>
          
          {twoFactorEnabled ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">2FA is enabled</span>
              </div>
              {!showDisable2FA ? (
                <Button variant="outline" onClick={() => setShowDisable2FA(true)}>
                  Disable 2FA
                </Button>
              ) : (
                <div className="space-y-3 max-w-sm">
                  <Input
                    type="password"
                    placeholder="Your password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="6-digit 2FA code"
                    maxLength={6}
                    value={disableToken}
                    onChange={(e) => setDisableToken(e.target.value.replace(/\D/g, ''))}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDisable2FA(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDisable2FA} disabled={loading}>
                      {loading ? 'Disabling...' : 'Disable 2FA'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : show2FASetup ? (
            <div className="space-y-4 max-w-sm">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              {qrCode && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Or enter this code manually:</Label>
                <code className="block p-2 bg-muted rounded text-xs break-all">
                  {secret}
                </code>
              </div>
              <div className="space-y-2">
                <Label>Enter the 6-digit code from your app:</Label>
                <Input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShow2FASetup(false)}>
                  Cancel
                </Button>
                <Button onClick={handleVerify2FA} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={handleSetup2FA} disabled={loading}>
              {loading ? 'Setting up...' : 'Enable 2FA'}
            </Button>
          )}
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-2">Active Sessions</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Manage devices that have access to your account
          </p>
          <Button variant="outline">View All Sessions</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function OrganizationSettings() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    orgName: 'Acme Corporation',
    industry: 'Technology',
    size: '50-100',
    website: 'https://acme.com',
  })

  const handleSave = async () => {
    try {
      // TODO: API call to save org settings
      toast.success('Organization settings updated')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update settings')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Organization
        </CardTitle>
        <CardDescription>
          Manage your organization information (admin only)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={formData.orgName}
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({ ...formData, orgName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={formData.industry}
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({ ...formData, industry: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="size">Organization Size</Label>
            <Input
              id="size"
              value={formData.size}
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({ ...formData, size: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              disabled={!isEditing}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              Edit Organization
            </Button>
          ) : (
            <>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function BillingSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Subscription</CardTitle>
        <CardDescription>
          Manage your billing information and subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-medium">Current Plan: Professional</h4>
              <p className="text-sm text-muted-foreground">
                $99/month, renews on January 26, 2027
              </p>
            </div>
            <span className="text-green-600 dark:text-green-400 text-sm font-medium">
              Active
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Payment Method</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Visa ending in 4242
          </p>
          <Button variant="outline">Update Payment Method</Button>
        </div>

        <Button variant="outline" className="text-destructive bg-transparent">
          Downgrade Plan
        </Button>
      </CardContent>
    </Card>
  )
}

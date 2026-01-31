'use client'

import { useState, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Upload, Sun, Moon, Trash2, Image, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Logo {
  light: string | null
  dark: string | null
}

interface LogoUploaderProps {
  currentLogo?: Logo
  onLogoChange: (logos: Logo) => void
  maxSize?: number // in MB
}

export function LogoUploader({ currentLogo, onLogoChange, maxSize = 2 }: LogoUploaderProps) {
  const [logos, setLogos] = useState<Logo>(currentLogo || { light: null, dark: null })
  const [uploading, setUploading] = useState<'light' | 'dark' | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const lightInputRef = useRef<HTMLInputElement>(null)
  const darkInputRef = useRef<HTMLInputElement>(null)

  const uploadLogo = async (file: File, mode: 'light' | 'dark') => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`)
      return
    }

    setUploading(mode)
    
    try {
      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', `logo_${mode}`)

      // Upload to your backend/Cloudinary
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      const newLogos = { ...logos, [mode]: data.url }
      setLogos(newLogos)
      onLogoChange(newLogos)
      toast.success(`${mode === 'light' ? 'Light' : 'Dark'} mode logo uploaded`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload logo')
    } finally {
      setUploading(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, mode: 'light' | 'dark') => {
    const file = e.target.files?.[0]
    if (file) {
      uploadLogo(file, mode)
    }
    e.target.value = '' // Reset input
  }

  const removeLogo = (mode: 'light' | 'dark') => {
    const newLogos = { ...logos, [mode]: null }
    setLogos(newLogos)
    onLogoChange(newLogos)
    toast.success(`${mode === 'light' ? 'Light' : 'Dark'} mode logo removed`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Image className="h-5 w-5" />
          Logo Settings
        </CardTitle>
        <CardDescription>
          Upload logos for light and dark modes. Recommended size: 200x50px
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="light" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="light" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Light Mode
            </TabsTrigger>
            <TabsTrigger value="dark" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Dark Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="light" className="mt-0">
            <LogoUploadArea
              logo={logos.light}
              mode="light"
              uploading={uploading === 'light'}
              onUploadClick={() => lightInputRef.current?.click()}
              onRemove={() => removeLogo('light')}
            />
            <input
              ref={lightInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload light mode logo"
              title="Upload light mode logo"
              onChange={(e) => handleFileSelect(e, 'light')}
            />
          </TabsContent>

          <TabsContent value="dark" className="mt-0">
            <LogoUploadArea
              logo={logos.dark}
              mode="dark"
              uploading={uploading === 'dark'}
              onUploadClick={() => darkInputRef.current?.click()}
              onRemove={() => removeLogo('dark')}
            />
            <input
              ref={darkInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload dark mode logo"
              title="Upload dark mode logo"
              onChange={(e) => handleFileSelect(e, 'dark')}
            />
          </TabsContent>
        </Tabs>

        {/* Preview Button */}
        {(logos.light || logos.dark) && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
            >
              Preview Logos
            </Button>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Logo Preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="p-6 bg-white rounded-lg border">
                <Label className="text-gray-500 mb-2 block">Light Mode</Label>
                {logos.light ? (
                  <img
                    src={logos.light}
                    alt="Light mode logo"
                    className="max-h-12 object-contain"
                  />
                ) : (
                  <span className="text-gray-400">No logo set</span>
                )}
              </div>
              <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
                <Label className="text-gray-400 mb-2 block">Dark Mode</Label>
                {logos.dark ? (
                  <img
                    src={logos.dark}
                    alt="Dark mode logo"
                    className="max-h-12 object-contain"
                  />
                ) : (
                  <span className="text-gray-500">No logo set</span>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

interface LogoUploadAreaProps {
  logo: string | null
  mode: 'light' | 'dark'
  uploading: boolean
  onUploadClick: () => void
  onRemove: () => void
}

function LogoUploadArea({ logo, mode, uploading, onUploadClick, onRemove }: LogoUploadAreaProps) {
  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 ${
        mode === 'light' ? 'bg-white' : 'bg-gray-900'
      }`}
    >
      {logo ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt={`${mode} mode logo`}
              className="max-h-12 object-contain"
            />
            <Badge variant="outline" className={mode === 'dark' ? 'text-white' : ''}>
              Uploaded
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onUploadClick}>
              Replace
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onRemove}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center cursor-pointer"
          onClick={onUploadClick}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload
                className={`h-8 w-8 mb-2 ${
                  mode === 'dark' ? 'text-gray-400' : 'text-muted-foreground'
                }`}
              />
              <p
                className={`text-sm ${
                  mode === 'dark' ? 'text-gray-400' : 'text-muted-foreground'
                }`}
              >
                Click to upload {mode} mode logo
              </p>
              <p
                className={`text-xs mt-1 ${
                  mode === 'dark' ? 'text-gray-500' : 'text-muted-foreground/70'
                }`}
              >
                PNG, JPG, SVG up to 2MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// Logo display component for header/sidebar
interface LogoDisplayProps {
  logos?: Logo
  fallbackText?: string
  className?: string
}

export function LogoDisplay({ logos, fallbackText = 'FlowCRM', className = '' }: LogoDisplayProps) {
  // Use system theme detection
  const [isDark, setIsDark] = useState(false)

  // Detect theme changes
  useState(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setIsDark(mediaQuery.matches || document.documentElement.classList.contains('dark'))
      
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
      mediaQuery.addEventListener('change', handler)
      
      // Also observe class changes
      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains('dark'))
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
      
      return () => {
        mediaQuery.removeEventListener('change', handler)
        observer.disconnect()
      }
    }
  })

  const logoUrl = isDark ? logos?.dark : logos?.light
  const fallbackUrl = isDark ? logos?.light : logos?.dark

  if (logoUrl || fallbackUrl) {
    return (
      <img
        src={logoUrl || fallbackUrl || ''}
        alt="Logo"
        className={`h-8 object-contain ${className}`}
      />
    )
  }

  return (
    <span className={`font-bold text-xl ${className}`}>
      {fallbackText}
    </span>
  )
}

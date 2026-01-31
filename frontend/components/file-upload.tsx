'use client'

import { useState, useCallback, useRef } from 'react'
import { uploadAttachment, getAttachments, deleteAttachment } from '@/lib/api-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Upload, File, Image, FileText, X, Download, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Attachment {
  id: string
  filename: string
  url: string
  mimeType: string
  size: number
  createdAt: string
  uploadedBy?: { name: string }
}

interface FileUploadProps {
  entityType: 'lead' | 'deal' | 'task'
  entityId: string
  onUploadComplete?: () => void
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />
  if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />
  return <File className="h-5 w-5 text-gray-500" />
}

export function FileUpload({ entityType, entityId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchAttachments = useCallback(async () => {
    try {
      const data = await getAttachments(entityType, entityId) as { attachments: Attachment[] }
      setAttachments(data.attachments || [])
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useState(() => {
    fetchAttachments()
  })

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90))
    }, 100)

    try {
      await uploadAttachment(file, entityType, entityId)
      setUploadProgress(100)
      toast.success('File uploaded successfully')
      fetchAttachments()
      onUploadComplete?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file')
    } finally {
      clearInterval(progressInterval)
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteAttachment(deleteId)
      toast.success('File deleted')
      setAttachments(prev => prev.filter(a => a.id !== deleteId))
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete file')
    } finally {
      setDeleteId(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Attachments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            aria-label="Upload file"
            title="Upload file"
            onChange={(e) => handleFileSelect(e.target.files)}
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop a file here, or
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse Files
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Max file size: 10MB
              </p>
            </>
          )}
        </div>

        {/* Attachments List */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                {getFileIcon(attachment.mimeType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.filename}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}</span>
                    {attachment.uploadedBy && (
                      <>
                        <span>•</span>
                        <span>by {attachment.uploadedBy.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(attachment.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No attachments yet
          </p>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this file? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

// Export AttachmentList as a standalone component for use in other contexts
interface AttachmentListProps {
  entityType: 'lead' | 'deal' | 'task'
  entityId: string
}

export function AttachmentList({ entityType, entityId }: AttachmentListProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchAttachments = useCallback(async () => {
    try {
      const data = await getAttachments(entityType, entityId) as { attachments: Attachment[] }
      setAttachments(data.attachments || [])
    } catch (error) {
      console.error('Failed to fetch attachments:', error)
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useState(() => {
    fetchAttachments()
  })

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteAttachment(deleteId)
      toast.success('File deleted')
      setAttachments(prev => prev.filter(a => a.id !== deleteId))
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete file')
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (attachments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No attachments yet
      </p>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            {getFileIcon(attachment.mimeType)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{attachment.filename}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatFileSize(attachment.size)}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(attachment.createdAt), { addSuffix: true })}</span>
                {attachment.uploadedBy && (
                  <>
                    <span>•</span>
                    <span>by {attachment.uploadedBy.name}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(attachment.url, '_blank')}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeleteId(attachment.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

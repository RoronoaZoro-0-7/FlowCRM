'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import {
  getWidgets,
  createWidget,
  updateWidget,
  deleteWidget,
  reorderWidgets,
  resetWidgets,
} from '@/lib/api-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  GripVertical,
  Plus,
  Trash2,
  RotateCcw,
  MoreVertical,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Activity,
  Calendar,
  Loader2,
  Lock,
  Unlock,
} from 'lucide-react'
import { toast } from 'sonner'

// Layout item type
interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  static?: boolean
}

// Widget type definitions
const WIDGET_TYPES = [
  { type: 'stats', label: 'Statistics Card', icon: BarChart3, defaultW: 3, defaultH: 2 },
  { type: 'chart_line', label: 'Line Chart', icon: TrendingUp, defaultW: 6, defaultH: 4 },
  { type: 'chart_bar', label: 'Bar Chart', icon: BarChart3, defaultW: 6, defaultH: 4 },
  { type: 'chart_pie', label: 'Pie Chart', icon: PieChart, defaultW: 4, defaultH: 4 },
  { type: 'activity', label: 'Recent Activity', icon: Activity, defaultW: 4, defaultH: 5 },
  { type: 'leaderboard', label: 'Team Leaderboard', icon: Users, defaultW: 4, defaultH: 5 },
  { type: 'deals_summary', label: 'Deals Summary', icon: DollarSign, defaultW: 6, defaultH: 3 },
  { type: 'tasks', label: 'My Tasks', icon: Target, defaultW: 4, defaultH: 4 },
  { type: 'calendar', label: 'Upcoming Events', icon: Calendar, defaultW: 4, defaultH: 4 },
]

interface Widget {
  id: string
  type: string
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
}

interface DashboardWidgetsProps {
  widgets: Widget[]
  onWidgetsChange: (widgets: Widget[]) => void
  isEditing?: boolean
  onEditingChange?: (editing: boolean) => void
  renderWidget: (widget: Widget) => React.ReactNode
}

export function DashboardWidgets({
  widgets,
  onWidgetsChange,
  isEditing = false,
  onEditingChange,
  renderWidget,
}: DashboardWidgetsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newWidgetType, setNewWidgetType] = useState('')
  const [newWidgetTitle, setNewWidgetTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const layout: LayoutItem[] = widgets.map((widget) => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: 2,
    minH: 2,
    static: !isEditing,
  }))

  const handleLayoutChange = async (newLayout: LayoutItem[]) => {
    if (!isEditing) return

    const updatedWidgets = widgets.map((widget) => {
      const layoutItem = newLayout.find((l) => l.i === widget.id)
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        }
      }
      return widget
    })

    onWidgetsChange(updatedWidgets)
  }

  const handleAddWidget = async () => {
    if (!newWidgetType || !newWidgetTitle) {
      toast.error('Please fill in all fields')
      return
    }

    const widgetTypeInfo = WIDGET_TYPES.find((t) => t.type === newWidgetType)
    if (!widgetTypeInfo) return

    setSaving(true)
    try {
      // Find next available position
      const maxY = widgets.reduce((max, w) => Math.max(max, w.position.y + w.position.h), 0)

      const newWidget = await createWidget({
        widgetType: newWidgetType,
        title: newWidgetTitle,
        position: maxY,
        size: `${widgetTypeInfo.defaultW}x${widgetTypeInfo.defaultH}`,
        config: {},
      }) as Widget

      onWidgetsChange([...widgets, newWidget])
      setShowAddDialog(false)
      setNewWidgetType('')
      setNewWidgetTitle('')
      toast.success('Widget added')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add widget')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWidget = async (widgetId: string) => {
    try {
      await deleteWidget(widgetId)
      onWidgetsChange(widgets.filter((w) => w.id !== widgetId))
      toast.success('Widget removed')
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove widget')
    }
  }

  const handleResetWidgets = async () => {
    try {
      const data = await resetWidgets() as { widgets: Widget[] }
      onWidgetsChange(data.widgets || [])
      toast.success('Dashboard reset to default')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset dashboard')
    }
  }

  const handleSaveLayout = async () => {
    setSaving(true)
    try {
      await reorderWidgets(widgets.map((w) => w.id))
      onEditingChange?.(false)
      toast.success('Layout saved')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save layout')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSaveLayout} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Lock className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEditingChange?.(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditingChange?.(true)}
            >
              <Unlock className="h-4 w-4 mr-2" />
              Edit Layout
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Widget
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleResetWidgets}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Grid Layout - Simplified without react-grid-layout for now */}
      <div className="grid grid-cols-12 gap-4">
        {widgets.map((widget) => (
          <div 
            key={widget.id} 
            className="bg-background"
            style={{
              gridColumn: `span ${Math.min(widget.position.w, 12)}`,
            }}
          >
            <WidgetWrapper
              widget={widget}
              isEditing={isEditing}
              onDelete={() => handleDeleteWidget(widget.id)}
            >
              {renderWidget(widget)}
            </WidgetWrapper>
          </div>
        ))}
      </div>

      {widgets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No widgets yet</p>
          <Button
            variant="link"
            onClick={() => setShowAddDialog(true)}
            className="mt-2"
          >
            Add your first widget
          </Button>
        </div>
      )}

      {/* Add Widget Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>
              Choose a widget type to add to your dashboard
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Widget Type</Label>
              <Select value={newWidgetType} onValueChange={setNewWidgetType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select widget type" />
                </SelectTrigger>
                <SelectContent>
                  {WIDGET_TYPES.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Widget Title</Label>
              <Input
                value={newWidgetTitle}
                onChange={(e) => setNewWidgetTitle(e.target.value)}
                placeholder="e.g., Sales Overview"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWidget} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface WidgetWrapperProps {
  widget: Widget
  isEditing: boolean
  onDelete: () => void
  children: React.ReactNode
}

function WidgetWrapper({ widget, isEditing, onDelete, children }: WidgetWrapperProps) {
  const widgetTypeInfo = WIDGET_TYPES.find((t) => t.type === widget.type)
  const Icon = widgetTypeInfo?.icon || BarChart3

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          {isEditing && (
            <div className="widget-drag-handle cursor-move p-1 hover:bg-muted rounded">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <Icon className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </div>
        {isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 h-[calc(100%-48px)] overflow-auto">
        {children}
      </CardContent>
    </Card>
  )
}

// Hook for managing widget state
export function useWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const fetchWidgets = useCallback(async () => {
    try {
      const data = await getWidgets() as { widgets: Widget[] }
      setWidgets(data.widgets || [])
    } catch (error) {
      console.error('Failed to fetch widgets:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWidgets()
  }, [fetchWidgets])

  return {
    widgets,
    setWidgets,
    loading,
    isEditing,
    setIsEditing,
    refreshWidgets: fetchWidgets,
  }
}

export { WIDGET_TYPES }
export type { Widget }

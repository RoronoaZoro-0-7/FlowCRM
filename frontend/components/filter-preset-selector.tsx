'use client'

import { useState, useEffect } from 'react'
import {
  getFilterPresets,
  createFilterPreset,
  updateFilterPreset,
  deleteFilterPreset,
} from '@/lib/api-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Save, Star, StarOff, Trash2, MoreVertical, Filter, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface FilterPreset {
  id: string
  name: string
  entityType: string
  filters: any
  isDefault: boolean
}

interface FilterPresetSelectorProps {
  entityType: 'leads' | 'deals' | 'tasks' | 'users'
  currentFilters: any
  onApplyPreset: (filters: any) => void
}

const STORAGE_KEY_PREFIX = 'flowcrm_filters_'

export function FilterPresetSelector({
  entityType,
  currentFilters,
  onApplyPreset,
}: FilterPresetSelectorProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [makeDefault, setMakeDefault] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load presets on mount
  useEffect(() => {
    fetchPresets()
    // Load last used filters from localStorage
    const savedFilters = localStorage.getItem(`${STORAGE_KEY_PREFIX}${entityType}`)
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters)
        onApplyPreset(parsed)
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, [entityType])

  // Save current filters to localStorage whenever they change
  useEffect(() => {
    if (currentFilters && Object.keys(currentFilters).length > 0) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${entityType}`, JSON.stringify(currentFilters))
    }
  }, [currentFilters, entityType])

  const fetchPresets = async () => {
    try {
      const data = await getFilterPresets(entityType) as { presets: FilterPreset[] }
      setPresets(data.presets || [])
      
      // Auto-apply default preset if no filters are currently set
      const defaultPreset = data.presets?.find((p: FilterPreset) => p.isDefault)
      if (defaultPreset && (!currentFilters || Object.keys(currentFilters).length === 0)) {
        setSelectedPresetId(defaultPreset.id)
        onApplyPreset(defaultPreset.filters)
      }
    } catch (error) {
      console.error('Failed to fetch presets:', error)
    }
  }

  const handleSelectPreset = (presetId: string) => {
    if (presetId === 'clear') {
      setSelectedPresetId(null)
      onApplyPreset({})
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${entityType}`)
      return
    }

    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setSelectedPresetId(preset.id)
      onApplyPreset(preset.filters)
    }
  }

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name')
      return
    }

    setLoading(true)
    try {
      await createFilterPreset({
        name: newPresetName,
        entityType,
        filters: currentFilters,
        isDefault: makeDefault,
      })
      toast.success('Filter preset saved')
      fetchPresets()
      setSaveDialogOpen(false)
      setNewPresetName('')
      setMakeDefault(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save preset')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (preset: FilterPreset) => {
    try {
      await updateFilterPreset(preset.id, { isDefault: !preset.isDefault })
      toast.success(preset.isDefault ? 'Default removed' : 'Set as default')
      fetchPresets()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update preset')
    }
  }

  const handleDeletePreset = async (presetId: string) => {
    try {
      await deleteFilterPreset(presetId)
      toast.success('Preset deleted')
      if (selectedPresetId === presetId) {
        setSelectedPresetId(null)
      }
      fetchPresets()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete preset')
    }
  }

  const hasActiveFilters = currentFilters && Object.keys(currentFilters).some(
    (key) => currentFilters[key] !== '' && currentFilters[key] !== 'all' && currentFilters[key] !== undefined
  )

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedPresetId || ''} onValueChange={handleSelectPreset}>
        <SelectTrigger className="w-[180px]">
          <Filter className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Filter presets" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="clear">
            <span className="text-muted-foreground">Clear filters</span>
          </SelectItem>
          {presets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {presets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center gap-2">
                    {preset.isDefault && <Star className="h-3 w-3 text-yellow-500" />}
                    {preset.name}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {/* Save current filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSaveDialogOpen(true)}
          title="Save current filters as preset"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}

      {/* Manage presets dropdown */}
      {presets.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                className="flex items-center justify-between"
              >
                <span className="truncate flex-1">{preset.name}</span>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetDefault(preset)
                    }}
                  >
                    {preset.isDefault ? (
                      <Star className="h-3 w-3 text-yellow-500" />
                    ) : (
                      <StarOff className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePreset(preset.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Save Preset Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Save your current filters as a preset for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="e.g., High Value Leads"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="make-default">Set as default</Label>
              <Switch
                id="make-default"
                checked={makeDefault}
                onCheckedChange={setMakeDefault}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

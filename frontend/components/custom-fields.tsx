'use client'

import { useState, useEffect } from 'react'
import {
  getCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
} from '@/lib/api-service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Edit,
  Trash2,
  Type,
  Hash,
  Calendar,
  List,
  CheckSquare,
  Loader2,
  Settings2,
} from 'lucide-react'
import { toast } from 'sonner'

interface CustomField {
  id: string
  name: string
  fieldType: string
  entityType: string
  options: string[]
  required: boolean
  createdAt: string
}

interface CustomFieldFormData {
  name: string
  fieldType: string
  entityType: string
  options: string
  required: boolean
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Dropdown', icon: List },
  { value: 'multiselect', label: 'Multi-select', icon: List },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
]

const ENTITY_TYPES = [
  { value: 'lead', label: 'Leads' },
  { value: 'deal', label: 'Deals' },
  { value: 'task', label: 'Tasks' },
]

export function CustomFieldsManager() {
  const [fields, setFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('lead')
  const [formData, setFormData] = useState<CustomFieldFormData>({
    name: '',
    fieldType: 'text',
    entityType: 'lead',
    options: '',
    required: false,
  })

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      // Fetch fields for all entity types
      const [leadFields, dealFields, taskFields] = await Promise.all([
        getCustomFields('lead') as Promise<{ fields: CustomField[] }>,
        getCustomFields('deal') as Promise<{ fields: CustomField[] }>,
        getCustomFields('task') as Promise<{ fields: CustomField[] }>,
      ])
      setFields([
        ...(leadFields.fields || []),
        ...(dealFields.fields || []),
        ...(taskFields.fields || []),
      ])
    } catch (error) {
      console.error('Failed to fetch custom fields:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (field: CustomField) => {
    setEditingField(field)
    setFormData({
      name: field.name,
      fieldType: field.fieldType,
      entityType: field.entityType,
      options: field.options.join(', '),
      required: field.required,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a field name')
      return
    }

    if (['select', 'multiselect'].includes(formData.fieldType) && !formData.options.trim()) {
      toast.error('Please enter options for this field type')
      return
    }

    setSaving(true)
    try {
      const options = formData.options
        ? formData.options.split(',').map((o) => o.trim()).filter(Boolean)
        : []

      if (editingField) {
        await updateCustomField(editingField.id, {
          name: formData.name,
          fieldType: formData.fieldType,
          options,
          required: formData.required,
        })
        toast.success('Field updated')
      } else {
        await createCustomField({
          name: formData.name,
          fieldType: formData.fieldType,
          entityType: formData.entityType,
          options,
          required: formData.required,
        })
        toast.success('Field created')
      }

      setShowForm(false)
      setEditingField(null)
      resetForm()
      fetchFields()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save field')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteCustomField(deleteId)
      toast.success('Field deleted')
      setFields((prev) => prev.filter((f) => f.id !== deleteId))
      setDeleteId(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete field')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      fieldType: 'text',
      entityType: activeTab,
      options: '',
      required: false,
    })
  }

  const openNewForm = () => {
    setEditingField(null)
    setFormData({
      ...formData,
      name: '',
      fieldType: 'text',
      entityType: activeTab,
      options: '',
      required: false,
    })
    setShowForm(true)
  }

  const getFieldIcon = (fieldType: string) => {
    const type = FIELD_TYPES.find((t) => t.value === fieldType)
    return type ? <type.icon className="h-4 w-4" /> : <Type className="h-4 w-4" />
  }

  const filteredFields = fields.filter((f) => f.entityType === activeTab)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Custom Fields
            </CardTitle>
            <CardDescription>
              Add custom fields to leads, deals, and tasks
            </CardDescription>
          </div>
          <Button onClick={openNewForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {ENTITY_TYPES.map((entity) => (
              <TabsTrigger key={entity.value} value={entity.value}>
                {entity.label}
                <Badge variant="secondary" className="ml-2">
                  {fields.filter((f) => f.entityType === entity.value).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {ENTITY_TYPES.map((entity) => (
            <TabsContent key={entity.value} value={entity.value}>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No custom fields for {entity.label.toLowerCase()}</p>
                  <Button variant="link" onClick={openNewForm} className="mt-2">
                    Add your first field
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Options</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getFieldIcon(field.fieldType)}
                            <span className="capitalize">{field.fieldType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {field.options.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {field.options.slice(0, 3).map((opt) => (
                                <Badge key={opt} variant="outline" className="text-xs">
                                  {opt}
                                </Badge>
                              ))}
                              {field.options.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{field.options.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={field.required ? 'default' : 'secondary'}>
                            {field.required ? 'Yes' : 'No'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(field)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(field.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Field Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Edit Field' : 'New Custom Field'}
              </DialogTitle>
              <DialogDescription>
                {editingField
                  ? 'Update the field configuration'
                  : 'Create a new custom field for your data'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Field Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Industry, Budget, Priority Level"
                />
              </div>

              {!editingField && (
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select
                    value={formData.entityType}
                    onValueChange={(v) => setFormData({ ...formData, entityType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((entity) => (
                        <SelectItem key={entity.value} value={entity.value}>
                          {entity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select
                  value={formData.fieldType}
                  onValueChange={(v) => setFormData({ ...formData, fieldType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {['select', 'multiselect'].includes(formData.fieldType) && (
                <div className="space-y-2">
                  <Label>Options (comma-separated)</Label>
                  <Input
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    placeholder="Option 1, Option 2, Option 3"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="required">Required field</Label>
                <Switch
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, required: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingField ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this field? All existing data for this field
                will be lost. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

// Dynamic Custom Field Input Component
interface CustomFieldInputProps {
  field: CustomField
  value: any
  onChange: (value: any) => void
}

export function CustomFieldInput({ field, value, onChange }: CustomFieldInputProps) {
  switch (field.fieldType) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label>
            {field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      )

    case 'number':
      return (
        <div className="space-y-2">
          <Label>
            {field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
            required={field.required}
          />
        </div>
      )

    case 'date':
      return (
        <div className="space-y-2">
          <Label>
            {field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          />
        </div>
      )

    case 'select':
      return (
        <div className="space-y-2">
          <Label>
            {field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )

    case 'multiselect':
      const selectedValues = Array.isArray(value) ? value : []
      return (
        <div className="space-y-2">
          <Label>
            {field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
            {field.options.map((option) => (
              <Badge
                key={option}
                variant={selectedValues.includes(option) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  if (selectedValues.includes(option)) {
                    onChange(selectedValues.filter((v: string) => v !== option))
                  } else {
                    onChange([...selectedValues, option])
                  }
                }}
              >
                {option}
              </Badge>
            ))}
          </div>
        </div>
      )

    case 'checkbox':
      return (
        <div className="flex items-center justify-between">
          <Label>
            {field.name}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Switch checked={!!value} onCheckedChange={onChange} />
        </div>
      )

    default:
      return null
  }
}

'use client'

import { useState, useEffect } from 'react'
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/api-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO,
} from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  allDay: boolean
  location?: string
}

interface EventFormData {
  title: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  allDay: boolean
  location: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    startDate: '',
    startTime: '09:00',
    endDate: '',
    endTime: '10:00',
    allDay: false,
    location: '',
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  useEffect(() => {
    fetchEvents()
  }, [currentMonth])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const start = startOfMonth(currentMonth).toISOString()
      const end = endOfMonth(currentMonth).toISOString()
      const data = await getCalendarEvents(start, end) as { events: CalendarEvent[] }
      setEvents(data.events || [])
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const eventDate = parseISO(event.startTime)
      return isSameDay(eventDate, date)
    })
  }

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const handleToday = () => setCurrentMonth(new Date())

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    const dateStr = format(date, 'yyyy-MM-dd')
    setFormData({
      ...formData,
      startDate: dateStr,
      endDate: dateStr,
    })
    setShowEventForm(true)
  }

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEvent(event)
    const startDate = parseISO(event.startTime)
    const endDate = parseISO(event.endTime)
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: format(startDate, 'yyyy-MM-dd'),
      startTime: format(startDate, 'HH:mm'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      endTime: format(endDate, 'HH:mm'),
      allDay: event.allDay,
      location: event.location || '',
    })
    setShowEventForm(true)
  }

  const handleSaveEvent = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter an event title')
      return
    }

    setSaving(true)
    try {
      const startTime = formData.allDay
        ? `${formData.startDate}T00:00:00`
        : `${formData.startDate}T${formData.startTime}:00`
      const endTime = formData.allDay
        ? `${formData.endDate}T23:59:59`
        : `${formData.endDate}T${formData.endTime}:00`

      const eventData = {
        title: formData.title,
        description: formData.description || undefined,
        startTime,
        endTime,
        allDay: formData.allDay,
        location: formData.location || undefined,
      }

      if (selectedEvent) {
        await updateCalendarEvent(selectedEvent.id, eventData)
        toast.success('Event updated')
      } else {
        await createCalendarEvent(eventData)
        toast.success('Event created')
      }

      setShowEventForm(false)
      setSelectedEvent(null)
      resetForm()
      fetchEvents()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!deleteEventId) return

    try {
      await deleteCalendarEvent(deleteEventId)
      toast.success('Event deleted')
      setDeleteEventId(null)
      setShowEventForm(false)
      setSelectedEvent(null)
      fetchEvents()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      startTime: '09:00',
      endDate: '',
      endTime: '10:00',
      allDay: false,
      location: '',
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="w-32 text-center font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <Skeleton key={day} className="h-8" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="h-8 flex items-center justify-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayEvents = getEventsForDay(day)
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isCurrentDay = isToday(day)

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 p-1 border rounded-md cursor-pointer transition-colors ${
                      isCurrentMonth
                        ? 'bg-background hover:bg-muted/50'
                        : 'bg-muted/30 text-muted-foreground'
                    } ${isCurrentDay ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isCurrentDay
                          ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center'
                          : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                    <ScrollArea className="h-16">
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs px-1 py-0.5 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20"
                            onClick={(e) => handleEventClick(event, e)}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Event Form Dialog */}
        <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedEvent ? 'Edit Event' : 'New Event'}
              </DialogTitle>
              <DialogDescription>
                {selectedDate && !selectedEvent
                  ? `Create an event for ${format(selectedDate, 'MMMM d, yyyy')}`
                  : 'Update event details'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Event title"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allDay">All day</Label>
                <Switch
                  id="allDay"
                  checked={formData.allDay}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allDay: checked })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDate: e.target.value,
                        endDate: formData.endDate || e.target.value,
                      })
                    }
                  />
                </div>
                {!formData.allDay && (
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
                {!formData.allDay && (
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Event location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Event description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              {selectedEvent && (
                <Button
                  variant="destructive"
                  onClick={() => setDeleteEventId(selectedEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEventForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEvent} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {selectedEvent ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteEventId} onOpenChange={() => setDeleteEventId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this event? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEvent}
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

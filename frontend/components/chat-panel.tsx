'use client'

import { useState, useEffect, useRef } from 'react'
import {
  getChatRooms,
  createChatRoom,
  getChatMessages,
  sendChatMessage,
  markChatAsRead,
  searchUsersForMention,
  getUnreadCount,
  deleteChatRoom,
} from '@/lib/api-service'
import { useSocket } from '@/contexts/socket-context'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  MessageCircle,
  Send,
  Plus,
  Users,
  Hash,
  AtSign,
  X,
  Loader2,
  Check,
  Trash2,
  ArrowLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

interface ChatRoom {
  id: string
  name: string | null
  type: string
  members: Array<{ user: { id: string; name: string; avatar?: string } }>
  lastMessage?: { content: string; createdAt: string; sender: { name: string } }
  unreadCount: number
}

interface ChatMessage {
  id: string
  content: string
  createdAt: string
  sender: { id: string; name: string; avatar?: string }
  mentions?: Array<{ user: { id: string; name: string } }>
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [showNewRoom, setShowNewRoom] = useState(false)
  const [searchUsers, setSearchUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [mentionSearch, setMentionSearch] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [mentionUsers, setMentionUsers] = useState<User[]>([])
  const [pendingMentions, setPendingMentions] = useState<string[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { socket, joinRoom, leaveRoom } = useSocket()
  const { user } = useAuth()

  // Fetch rooms when panel opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetchRooms()
      fetchUnreadCount()
    } else {
      // Reset state when panel closes
      setSelectedRoom(null)
      setMessages([])
    }
  }, [isOpen])

  // Socket listeners
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: ChatMessage & { roomId: string }) => {
      if (selectedRoom?.id === message.roomId) {
        setMessages((prev) => {
          // Avoid duplicates - check by ID and also by content+sender for recently sent messages
          if (prev.some(m => m.id === message.id)) return prev
          // Also check if this is a message we just sent (within last 5 seconds)
          const recentDuplicate = prev.some(m => 
            m.sender.id === message.sender.id && 
            m.content === message.content &&
            Math.abs(new Date(m.createdAt).getTime() - new Date(message.createdAt).getTime()) < 5000
          )
          if (recentDuplicate) return prev
          return [...prev, message]
        })
        scrollToBottom()
        markChatAsRead(message.roomId)
      } else {
        // Update unread count for other rooms
        setRooms((prev) =>
          prev.map((room) =>
            room.id === message.roomId
              ? { ...room, unreadCount: room.unreadCount + 1, lastMessage: message }
              : room
          )
        )
        setUnreadTotal((prev) => prev + 1)
      }
    }

    socket.on('newMessage', handleNewMessage)
    socket.on('chat:message', handleNewMessage)

    return () => {
      socket.off('newMessage', handleNewMessage)
      socket.off('chat:message', handleNewMessage)
    }
  }, [socket, selectedRoom])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchRooms = async () => {
    try {
      const data = await getChatRooms() as { rooms: ChatRoom[] }
      setRooms(data.rooms || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadCount() as { unreadCount: number }
      setUnreadTotal(data.unreadCount || 0)
    } catch (error) {
      console.error('Failed to fetch unread count:', error)
    }
  }

  const selectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room)
    setMessages([])

    try {
      const data = await getChatMessages(room.id) as { messages: ChatMessage[] }
      setMessages(data.messages || [])
      await markChatAsRead(room.id)

      // Update unread counts
      setRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
      )
      setUnreadTotal((prev) => Math.max(0, prev - room.unreadCount))

      // Join socket room
      joinRoom(room.id)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || sendingMessage || !user) return

    const messageContent = newMessage.trim()
    const mentionIds = [...pendingMentions]
    
    // Clear input immediately for better UX
    setNewMessage('')
    setPendingMentions([])
    setSendingMessage(true)
    
    // Optimistically add message to UI
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: ChatMessage = {
      id: tempId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      sender: { id: user.id, name: user.name, avatar: user.avatar }
    }
    setMessages((prev) => [...prev, optimisticMessage])
    scrollToBottom()

    try {
      const response = await sendChatMessage(selectedRoom.id, messageContent, mentionIds) as { message: ChatMessage }
      // Replace temp message with real one
      setMessages((prev) => prev.map(m => m.id === tempId ? response.message : m))
    } catch (error: any) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== tempId))
      setNewMessage(messageContent) // Restore message
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }

    // Handle @ mentions
    if (e.key === '@') {
      setShowMentions(true)
      setMentionSearch('')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)

    // Check for @ mentions
    const lastAtIndex = value.lastIndexOf('@')
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true)
      searchMentionUsers('')
    } else if (showMentions) {
      const searchText = value.slice(lastAtIndex + 1)
      if (searchText.includes(' ')) {
        setShowMentions(false)
      } else {
        searchMentionUsers(searchText)
      }
    }
  }

  const searchMentionUsers = async (query: string) => {
    try {
      const data = await searchUsersForMention(query) as { users: User[] }
      setMentionUsers(data.users || [])
    } catch (error) {
      console.error('Failed to search users:', error)
    }
  }

  const insertMention = (mentionUser: User) => {
    const lastAtIndex = newMessage.lastIndexOf('@')
    const newText = newMessage.slice(0, lastAtIndex) + `@${mentionUser.name} `
    setNewMessage(newText)
    setPendingMentions((prev) => [...prev, mentionUser.id])
    setShowMentions(false)
    inputRef.current?.focus()
  }

  const createNewRoom = async () => {
    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    try {
      const roomType = selectedUsers.length === 1 ? 'direct' : 'group'
      const data = await createChatRoom({
        type: roomType,
        memberIds: selectedUsers.map((u) => u.id),
        name: roomType === 'group' ? `Group Chat` : undefined,
      }) as { room: ChatRoom; existing?: boolean }

      if (data.existing) {
        // Room already exists, just select it
        toast.info('Chat already exists')
      }
      
      // Check if room already in list
      const existingIndex = rooms.findIndex(r => r.id === data.room.id)
      if (existingIndex === -1) {
        setRooms((prev) => [data.room, ...prev])
      }
      
      selectRoom(data.room)
      setShowNewRoom(false)
      setSelectedUsers([])
    } catch (error: any) {
      toast.error(error.message || 'Failed to create chat room')
    }
  }

  const handleDeleteRoom = async (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this conversation? All messages will be lost.')) return
    
    try {
      await deleteChatRoom(roomId)
      setRooms((prev) => prev.filter(r => r.id !== roomId))
      if (selectedRoom?.id === roomId) {
        setSelectedRoom(null)
        setMessages([])
      }
      toast.success('Conversation deleted')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete conversation')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoomName = (room: ChatRoom) => {
    if (room.name) return room.name
    if (room.type === 'direct') {
      const otherMember = room.members.find((m) => m.user.id !== user?.id)
      return otherMember?.user.name || 'Direct Message'
    }
    return 'Group Chat'
  }

  const formatMessageTime = (date: string) => {
    const d = new Date(date)
    if (isToday(d)) return format(d, 'h:mm a')
    if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`
    return format(d, 'MMM d, h:mm a')
  }

  const renderMessageContent = (content: string) => {
    // Highlight @mentions
    const parts = content.split(/(@\w+)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-primary font-medium">
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="h-5 w-5" />
          {unreadTotal > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center justify-between">
            <span>Messages</span>
            <Button size="icon" variant="ghost" onClick={() => setShowNewRoom(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Room List */}
          {!selectedRoom && (
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : rooms.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No conversations yet</p>
                    <Button
                      variant="link"
                      onClick={() => setShowNewRoom(true)}
                      className="mt-2"
                    >
                      Start a new conversation
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left group relative"
                      >
                        <button
                          className="flex items-start gap-3 flex-1 min-w-0"
                          onClick={() => selectRoom(room)}
                        >
                          <Avatar>
                            <AvatarImage
                              src={room.members[0]?.user.avatar}
                            />
                            <AvatarFallback>
                              {room.type === 'direct' ? (
                                getInitials(getRoomName(room))
                              ) : (
                                <Users className="h-4 w-4" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium truncate">
                                {getRoomName(room)}
                              </p>
                              {room.lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(room.lastMessage.createdAt), {
                                    addSuffix: false,
                                  })}
                                </span>
                              )}
                            </div>
                            {room.lastMessage && (
                              <p className="text-sm text-muted-foreground truncate">
                                {room.lastMessage.sender.name}: {room.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-1">
                          {room.unreadCount > 0 && (
                            <Badge variant="default">
                              {room.unreadCount}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => handleDeleteRoom(room.id, e)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          {/* Chat View */}
          {selectedRoom && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Header */}
              <div className="p-3 border-b flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedRoom(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {selectedRoom.type === 'direct' ? (
                      getInitials(getRoomName(selectedRoom))
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{getRoomName(selectedRoom)}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoom.members.length} member
                    {selectedRoom.members.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isOwnMessage = message.sender.id === user?.id
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                      >
                        {!isOwnMessage && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender.avatar} />
                            <AvatarFallback>
                              {getInitials(message.sender.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[75%] ${
                            isOwnMessage ? 'items-end' : 'items-start'
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {message.sender.name}
                            </p>
                          )}
                          <div
                            className={`rounded-lg px-3 py-2 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">
                              {renderMessageContent(message.content)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-3 border-t">
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message... (@ to mention)"
                    className="pr-10"
                  />
                  <Button
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>

                  {/* Mentions Popup */}
                  {showMentions && mentionUsers.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border rounded-md shadow-lg max-h-40 overflow-auto">
                      {mentionUsers.map((u) => (
                        <button
                          key={u.id}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left"
                          onClick={() => insertMention(u)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={u.avatar} />
                            <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{u.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* New Room Dialog */}
        <Dialog open={showNewRoom} onOpenChange={(open) => {
          setShowNewRoom(open)
          if (open) {
            // Load users when dialog opens
            searchUsersForMention('').then((data: any) => {
              setSearchUsers(data.users || [])
            }).catch(console.error)
          } else {
            setSearchUsers([])
            setSelectedUsers([])
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Conversation</DialogTitle>
              <DialogDescription>
                Select team members to start a conversation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Command className="border rounded-md" shouldFilter={false}>
                <CommandInput
                  placeholder="Search users..."
                  onValueChange={async (value) => {
                    try {
                      const data = await searchUsersForMention(value) as { users: User[] }
                      setSearchUsers(data.users || [])
                    } catch (error) {
                      console.error('Search failed:', error)
                    }
                  }}
                />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {searchUsers.filter(u => u.id !== user?.id).map((u) => (
                      <CommandItem
                        key={u.id}
                        value={u.id}
                        onSelect={() => {
                          if (!selectedUsers.find((su) => su.id === u.id)) {
                            setSelectedUsers((prev) => [...prev, u])
                          }
                        }}
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={u.avatar} />
                          <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <span>{u.name}</span>
                        {selectedUsers.find((su) => su.id === u.id) && (
                          <Check className="ml-auto h-4 w-4" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>

              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((u) => (
                    <Badge key={u.id} variant="secondary" className="gap-1">
                      {u.name}
                      <button
                        title={`Remove ${u.name}`}
                        aria-label={`Remove ${u.name}`}
                        onClick={() =>
                          setSelectedUsers((prev) => prev.filter((su) => su.id !== u.id))
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewRoom(false)}>
                Cancel
              </Button>
              <Button onClick={createNewRoom}>Start Conversation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  )
}

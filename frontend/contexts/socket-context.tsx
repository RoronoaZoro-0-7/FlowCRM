'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth-context'
import { toast } from 'sonner'
import { makeRequest } from '@/lib/api-service'

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
}

interface ChatMessage {
    id: string
    roomId: string
    content: string
    senderId: string
    sender?: {
        id: string
        name: string
        email: string
    }
    mentions?: string[]
    createdAt: string
}

interface TypingData {
    roomId: string
    userId: string
    userName: string
    isTyping: boolean
}

interface SocketContextType {
    socket: Socket | null
    isConnected: boolean
    notifications: Notification[]
    unreadCount: number
    markAsRead: (id: string) => Promise<void>
    markAllAsRead: () => Promise<void>
    refreshNotifications: () => Promise<void>
    // Chat methods
    joinRoom: (roomId: string) => void
    leaveRoom: (roomId: string) => void
    sendChatMessage: (roomId: string, content: string, mentionIds?: string[]) => void
    emitTyping: (roomId: string, isTyping: boolean) => void
    onChatMessage: (callback: (message: ChatMessage) => void) => () => void
    onTyping: (callback: (data: TypingData) => void) => () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const { user, accessToken } = useAuth()

    const fetchNotifications = useCallback(async () => {
        if (!accessToken) return

        try {
            const data = await makeRequest<Notification[]>('/notifications')
            setNotifications(data)
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        }
    }, [accessToken])

    useEffect(() => {
        if (!user || !accessToken) {
            // Disconnect if user logs out
            if (socket) {
                socket.disconnect()
                setSocket(null)
                setIsConnected(false)
                setNotifications([])
            }
            return
        }

        // Connect to socket server
        const newSocket = io(SOCKET_URL, {
            withCredentials: true,
        })

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id)
            setIsConnected(true)
            // Join user's room
            newSocket.emit('join', user.id)
        })

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected')
            setIsConnected(false)
        })

        // Listen for new notifications
        newSocket.on('notification', (notification: Notification) => {
            console.log('New notification received:', notification)
            setNotifications(prev => [notification, ...prev])
            
            // Show toast notification
            toast(notification.title, {
                description: notification.message,
            })
        })

        // Listen for read status updates
        newSocket.on('notification:read', (data: { id: string }) => {
            setNotifications(prev =>
                prev.map(n => (n.id === data.id ? { ...n, isRead: true } : n))
            )
        })

        // Listen for all read event
        newSocket.on('notification:all-read', () => {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        })

        setSocket(newSocket)

        // Fetch existing notifications
        fetchNotifications()

        return () => {
            newSocket.disconnect()
        }
    }, [user, accessToken])

    const markAsRead = async (id: string) => {
        try {
            await makeRequest(`/notifications/${id}/read`, { method: 'POST' })
            // Update local state immediately
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
            )
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            await makeRequest('/notifications/mark-all-read', { method: 'POST' })
            // Update local state immediately
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error)
        }
    }

    // Chat methods
    const joinRoom = useCallback((roomId: string) => {
        socket?.emit('chat:join', roomId)
    }, [socket])

    const leaveRoom = useCallback((roomId: string) => {
        socket?.emit('chat:leave', roomId)
    }, [socket])

    const sendChatMessage = useCallback((roomId: string, content: string, mentionIds?: string[]) => {
        socket?.emit('chat:message', { roomId, content, mentionIds })
    }, [socket])

    const emitTyping = useCallback((roomId: string, isTyping: boolean) => {
        socket?.emit('chat:typing', { roomId, isTyping })
    }, [socket])

    const onChatMessage = useCallback((callback: (message: ChatMessage) => void) => {
        socket?.on('chat:message', callback)
        return () => {
            socket?.off('chat:message', callback)
        }
    }, [socket])

    const onTyping = useCallback((callback: (data: TypingData) => void) => {
        socket?.on('chat:typing', callback)
        return () => {
            socket?.off('chat:typing', callback)
        }
    }, [socket])

    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <SocketContext.Provider
            value={{
                socket,
                isConnected,
                notifications,
                unreadCount,
                markAsRead,
                markAllAsRead,
                refreshNotifications: fetchNotifications,
                // Chat
                joinRoom,
                leaveRoom,
                sendChatMessage,
                emitTyping,
                onChatMessage,
                onTyping,
            }}
        >
            {children}
        </SocketContext.Provider>
    )
}

export function useSocket() {
    const context = useContext(SocketContext)
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider')
    }
    return context
}

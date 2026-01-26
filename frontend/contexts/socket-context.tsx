'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth-context'
import { toast } from 'sonner'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    createdAt: string
}

interface SocketContextType {
    socket: Socket | null
    isConnected: boolean
    notifications: Notification[]
    unreadCount: number
    markAsRead: (id: string) => void
    markAllAsRead: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const { user, accessToken } = useAuth()

    useEffect(() => {
        if (!user || !accessToken) {
            // Disconnect if user logs out
            if (socket) {
                socket.disconnect()
                setSocket(null)
                setIsConnected(false)
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
        newSocket.on('notification:read', (notification: Notification) => {
            setNotifications(prev =>
                prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
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

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('accessToken')
            if (!token) return

            const response = await fetch(`${API_BASE}/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            })

            if (response.ok) {
                const data = await response.json()
                setNotifications(data)
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        }
    }

    const markAsRead = async (id: string) => {
        try {
            const token = localStorage.getItem('accessToken')
            if (!token) return

            await fetch(`${API_BASE}/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            })
        } catch (error) {
            console.error('Failed to mark notification as read:', error)
        }
    }

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('accessToken')
            if (!token) return

            await fetch(`${API_BASE}/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                credentials: 'include',
            })
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error)
        }
    }

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

(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/contexts/auth-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:3000/api") || 'http://localhost:3000/api';
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
// Token refresh interval (14 minutes - before 15 min expiry)
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000;
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Access token stored in memory only (not localStorage for security)
    const [accessToken, setAccessToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const refreshIntervalRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isRefreshing = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(false);
    // Refresh access token using refresh token (httpOnly cookie)
    const refreshAccessToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[refreshAccessToken]": async ()=>{
            if (isRefreshing.current) return accessToken;
            isRefreshing.current = true;
            try {
                const response = await fetch(`${API_BASE}/auth/refresh-token`, {
                    method: 'POST',
                    credentials: 'include'
                });
                if (!response.ok) {
                    // Refresh token invalid/expired - logout user
                    setAccessToken(null);
                    setUser(null);
                    localStorage.removeItem('user');
                    return null;
                }
                const data = await response.json();
                setAccessToken(data.accessToken);
                return data.accessToken;
            } catch (error) {
                console.error('[Auth] Token refresh failed:', error);
                setAccessToken(null);
                setUser(null);
                localStorage.removeItem('user');
                return null;
            } finally{
                isRefreshing.current = false;
            }
        }
    }["AuthProvider.useCallback[refreshAccessToken]"], [
        accessToken
    ]);
    // Setup automatic token refresh
    const setupTokenRefresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "AuthProvider.useCallback[setupTokenRefresh]": ()=>{
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
            }
            // Refresh token periodically before it expires
            refreshIntervalRef.current = setInterval({
                "AuthProvider.useCallback[setupTokenRefresh]": async ()=>{
                    if (user) {
                        await refreshAccessToken();
                    }
                }
            }["AuthProvider.useCallback[setupTokenRefresh]"], TOKEN_REFRESH_INTERVAL);
        }
    }["AuthProvider.useCallback[setupTokenRefresh]"], [
        user,
        refreshAccessToken
    ]);
    // Check if user is already logged in on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            const checkAuth = {
                "AuthProvider.useEffect.checkAuth": async ()=>{
                    try {
                        const storedUser = localStorage.getItem('user');
                        if (storedUser) {
                            // Try to refresh token to get new access token
                            const newToken = await refreshAccessToken();
                            if (newToken) {
                                setUser(JSON.parse(storedUser));
                                setupTokenRefresh();
                            } else {
                                // Refresh failed - clear stored user
                                localStorage.removeItem('user');
                            }
                        }
                    } catch (error) {
                        console.error('[Auth] Auth check failed:', error);
                        localStorage.removeItem('user');
                    } finally{
                        setLoading(false);
                    }
                }
            }["AuthProvider.useEffect.checkAuth"];
            checkAuth();
            // Cleanup on unmount
            return ({
                "AuthProvider.useEffect": ()=>{
                    if (refreshIntervalRef.current) {
                        clearInterval(refreshIntervalRef.current);
                    }
                }
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], []); // eslint-disable-line react-hooks/exhaustive-deps
    const login = async (email, password, twoFactorToken)=>{
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email,
                    password,
                    twoFactorToken
                })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
            const data = await response.json();
            // Check if 2FA is required
            if (data.requires2FA) {
                return {
                    requires2FA: true,
                    userId: data.userId
                };
            }
            const { accessToken: token, user: userData } = data;
            // Store access token in memory only (not localStorage)
            setAccessToken(token);
            // Store user info in localStorage for persistence (but not the token)
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            // Setup automatic token refresh
            setupTokenRefresh();
            router.push('/dashboard');
            return {};
        } catch (error) {
            console.error('[Auth] Login error:', error);
            throw error;
        }
    };
    const logout = async ()=>{
        try {
            // Clear refresh interval
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
            if (accessToken) {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    credentials: 'include'
                });
            }
        } catch (error) {
            console.error('[Auth] Logout error:', error);
        } finally{
            // Clear in-memory token
            setAccessToken(null);
            // Clear user from localStorage
            localStorage.removeItem('user');
            setUser(null);
            router.push('/login');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            loading,
            isAuthenticated: !!user && !!accessToken,
            login,
            logout,
            accessToken,
            refreshAccessToken
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/auth-context.tsx",
        lineNumber: 198,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "OVJAvedgjn6oDVFq9Hb1MLUb5ps=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/contexts/socket-context.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SocketProvider",
    ()=>SocketProvider,
    "useSocket",
    ()=>useSocket
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/socket.io-client/build/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/contexts/auth-context.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
const API_BASE = ("TURBOPACK compile-time value", "http://localhost:3000/api") || 'http://localhost:3000/api';
const SOCKET_URL = ("TURBOPACK compile-time value", "http://localhost:3000") || 'http://localhost:3000';
const SocketContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function SocketProvider({ children }) {
    _s();
    const [socket, setSocket] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isConnected, setIsConnected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [notifications, setNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const { user, accessToken } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SocketProvider.useEffect": ()=>{
            if (!user || !accessToken) {
                // Disconnect if user logs out
                if (socket) {
                    socket.disconnect();
                    setSocket(null);
                    setIsConnected(false);
                }
                return;
            }
            // Connect to socket server
            const newSocket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$socket$2e$io$2d$client$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["io"])(SOCKET_URL, {
                withCredentials: true
            });
            newSocket.on('connect', {
                "SocketProvider.useEffect": ()=>{
                    console.log('Socket connected:', newSocket.id);
                    setIsConnected(true);
                    // Join user's room
                    newSocket.emit('join', user.id);
                }
            }["SocketProvider.useEffect"]);
            newSocket.on('disconnect', {
                "SocketProvider.useEffect": ()=>{
                    console.log('Socket disconnected');
                    setIsConnected(false);
                }
            }["SocketProvider.useEffect"]);
            // Listen for new notifications
            newSocket.on('notification', {
                "SocketProvider.useEffect": (notification)=>{
                    console.log('New notification received:', notification);
                    setNotifications({
                        "SocketProvider.useEffect": (prev)=>[
                                notification,
                                ...prev
                            ]
                    }["SocketProvider.useEffect"]);
                    // Show toast notification
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"])(notification.title, {
                        description: notification.message
                    });
                }
            }["SocketProvider.useEffect"]);
            // Listen for read status updates
            newSocket.on('notification:read', {
                "SocketProvider.useEffect": (notification)=>{
                    setNotifications({
                        "SocketProvider.useEffect": (prev)=>prev.map({
                                "SocketProvider.useEffect": (n)=>n.id === notification.id ? {
                                        ...n,
                                        isRead: true
                                    } : n
                            }["SocketProvider.useEffect"])
                    }["SocketProvider.useEffect"]);
                }
            }["SocketProvider.useEffect"]);
            // Listen for all read event
            newSocket.on('notification:all-read', {
                "SocketProvider.useEffect": ()=>{
                    setNotifications({
                        "SocketProvider.useEffect": (prev)=>prev.map({
                                "SocketProvider.useEffect": (n)=>({
                                        ...n,
                                        isRead: true
                                    })
                            }["SocketProvider.useEffect"])
                    }["SocketProvider.useEffect"]);
                }
            }["SocketProvider.useEffect"]);
            setSocket(newSocket);
            // Fetch existing notifications
            fetchNotifications();
            return ({
                "SocketProvider.useEffect": ()=>{
                    newSocket.disconnect();
                }
            })["SocketProvider.useEffect"];
        }
    }["SocketProvider.useEffect"], [
        user,
        accessToken
    ]);
    const fetchNotifications = async ()=>{
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            const response = await fetch(`${API_BASE}/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };
    const markAsRead = async (id)=>{
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            await fetch(`${API_BASE}/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };
    const markAllAsRead = async ()=>{
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            await fetch(`${API_BASE}/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };
    const unreadCount = notifications.filter((n)=>!n.isRead).length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SocketContext.Provider, {
        value: {
            socket,
            isConnected,
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/socket-context.tsx",
        lineNumber: 156,
        columnNumber: 9
    }, this);
}
_s(SocketProvider, "z9EhPWqjUh/8uDNwbhV8+sFPkvE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$contexts$2f$auth$2d$context$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = SocketProvider;
function useSocket() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
_s1(useSocket, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "SocketProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ui/sonner.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toaster",
    ()=>Toaster
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
const Toaster = ({ ...props })=>{
    _s();
    const { theme = 'system' } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toaster"], {
        theme: theme,
        className: "toaster group",
        style: {
            '--normal-bg': 'var(--popover)',
            '--normal-text': 'var(--popover-foreground)',
            '--normal-border': 'var(--border)'
        },
        ...props
    }, void 0, false, {
        fileName: "[project]/components/ui/sonner.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_s(Toaster, "bbCbBsvL7+LiaR8ofHlkcwveh/Y=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useTheme"]
    ];
});
_c = Toaster;
;
var _c;
__turbopack_context__.k.register(_c, "Toaster");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_1679392c._.js.map
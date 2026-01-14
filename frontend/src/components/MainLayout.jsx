/**
 * Main Layout Component
 * Global layout with sidebar and top navbar for all authenticated pages
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import IPetroLogo from './IPetroLogo'

// Icon Components
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Camera: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Bot: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Building: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  BarChart: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  FileCheck: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Activity: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  User: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  LogOut: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
}

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [selectedNotification, setSelectedNotification] = useState(null)

  // Inspector menu items
  const inspectorMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard, path: '/inspector/dashboard' },
    { id: 'inspection', label: 'Inspection Workflow', icon: Icons.Eye, path: '/inspection' },
    { id: 'photos', label: 'Inspection Schedule', icon: Icons.Camera, path: '/photo-upload' },
    { id: 'defect-ai', label: 'Defect AI', icon: Icons.Bot, path: '/defect-ai' },
    { id: 'equipment', label: 'Equipment', icon: Icons.Building, path: '/equipment' },
    { id: 'analytics', label: 'Inspection Analysis', icon: Icons.BarChart, path: '/analytics' },
  ]

  // Admin menu items
  const adminMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard, path: '/admin/dashboard' },
    { id: 'users', label: 'User Management', icon: Icons.Users, path: '/admin/users' },
    { id: 'sites', label: 'Sites / Assets', icon: Icons.Building, path: '/equipment' },
    { id: 'inspections', label: 'Inspections Overview', icon: Icons.Eye, path: '/inspection' },
    { id: 'monitoring', label: 'Report History & Review', icon: Icons.Activity, path: '/monitoring' },
    { id: 'monitoring', label: 'Report History & Review', icon: Icons.Activity, path: '/monitoring' },
  ]

  // Engineer menu items
  const engineerMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard, path: '/engineer/dashboard' },
    { id: 'photos', label: 'Create Inspection', icon: Icons.Camera, path: '/photo-upload' },
    { id: 'review', label: 'Review Inspection', icon: Icons.FileCheck, path: '/review-inspection' },
    { id: 'analytics', label: 'Inspection Analysis', icon: Icons.BarChart, path: '/analytics' },
  ]

  // Get menu items based on user role
  const getMenuItems = () => {
    if (!user) return inspectorMenuItems
    const role = user.role?.toUpperCase()
    if (role === 'ADMIN') return adminMenuItems
    if (role === 'ENGINEER') return engineerMenuItems
    return inspectorMenuItems
  }

  const menuItems = getMenuItems()

  // Check authentication and load user
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login')
      return
    }

    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
        // Check for login notifications passed from Login page
        const loginNotifsStr = localStorage.getItem('loginNotifications')
        if (loginNotifsStr) {
          try {
            const loginNotifs = JSON.parse(loginNotifsStr)
            // These are already formatted from backend, but MainLayout expects specific format?
            // Backend sends: { type, message, id, date }
            // MainLayout expects: { id, title, message, created_at, action_link }

            // We can map them or just use them if we display generic messages
            // Let's assume we want to alert immediately

            if (loginNotifs.length > 0 && !sessionStorage.getItem('hasShownPendingAlert')) {
              alert(`🔔 Login Notification: You have ${loginNotifs.length} new items.\n\n${loginNotifs.map(n => n.message).join('\n')}`)
              sessionStorage.setItem('hasShownPendingAlert', 'true')
            }

            // Clear it so it doesn't show again on refresh
            localStorage.removeItem('loginNotifications')

          } catch (e) {
            console.error("Error parsing login notifications", e)
          }
        }

        // Only fetch notifications on mount, not on every navigation
        // Use a cache key to prevent redundant fetches within 30 seconds
        const cacheKey = `notifications_cache_${userData.id}`
        const cacheTime = localStorage.getItem(cacheKey)
        const now = Date.now()
        const CACHE_DURATION = 5000 // 5 seconds

        if (!cacheTime || (now - parseInt(cacheTime)) > CACHE_DURATION) {
          fetchNotifications(userData.id)
          localStorage.setItem(cacheKey, now.toString())
        }
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }, [navigate, location.pathname]) // Run on mount and every navigation (debounced by cache)
  // Fetch on dropdown open to ensure freshness (e.g. after confirming an inspection on the same page)
  useEffect(() => {
    if (notificationDropdownOpen && user) {
      fetchNotifications(user.id)
    }
  }, [notificationDropdownOpen])

  const fetchNotifications = async (userId) => {
    try {
      // Use the new consolidated endpoint
      const response = await fetch(`http://localhost:8000/api/notifications/all/${userId}`)
      if (response.ok) {
        const activeNotifs = await response.json()

        // Filter out dismissed notifications
        // Note: Backend returns all active items. Front-end suppression handles "dismissed" items locally for the session/browser
        const visibleNotifs = activeNotifs.filter(n => !localStorage.getItem(`dismissed_notif_${n.id}`))

        setNotifications(visibleNotifs)
        setUnreadCount(visibleNotifs.length)

        // Alert user if there are items, but only ONCE per session
        const hasShownAlert = sessionStorage.getItem('hasShownPendingAlert')
        if (visibleNotifs.length > 0 && !hasShownAlert) {
          alert(`🔔 Notice: You have ${visibleNotifs.length} items requiring attention.`)
          sessionStorage.setItem('hasShownPendingAlert', 'true')
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  const handleNotificationClick = (notification) => {
    // Open Modal for ALL notification types (Schedules and Reports)
    setSelectedNotification(notification)
    setNotificationDropdownOpen(false)
  }

  const handleModalClose = () => {
    setSelectedNotification(null)
  }

  const handleModalAction = () => {
    if (selectedNotification) {
      if (selectedNotification.action_link) {
        navigate(selectedNotification.action_link)
      }
    }
    setSelectedNotification(null)
  }

  // Close dropdown when navigating to a different page
  useEffect(() => {
    setProfileDropdownOpen(false)
    setNotificationDropdownOpen(false)
  }, [location.pathname])

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownOpen && !event.target.closest('.profile-dropdown-container')) {
        setProfileDropdownOpen(false)
      }
      if (notificationDropdownOpen && !event.target.closest('.notification-dropdown-container')) {
        setNotificationDropdownOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false)
        setNotificationDropdownOpen(false)
      }
    }

    if (profileDropdownOpen || notificationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [profileDropdownOpen, notificationDropdownOpen])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
    setUser(null)
    setProfileDropdownOpen(false)
    navigate('/login')
  }

  // Determine if a menu item is active based on current path
  const isActiveMenuItem = (item) => {
    if (item.path === location.pathname) return true
    // Handle nested routes (e.g., /inspection/list should highlight inspection)
    if (location.pathname.startsWith(item.path + '/')) return true
    // Special case for dashboard routes
    if (item.id === 'dashboard') {
      if (item.path === '/inspector/dashboard' && location.pathname === '/inspector/dashboard') return true
      if (item.path === '/admin/dashboard' && location.pathname === '/admin/dashboard') return true
    }
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        <div className={`p-6 border-b border-gray-200 flex items-center justify-center ${!sidebarOpen ? 'flex-col' : ''}`}>
          {sidebarOpen ? (
            <div className="flex flex-col items-center w-full">
              <IPetroLogo size={80} className="mb-2" />
              <h1 className="text-xs font-semibold text-gray-600 mt-1">VISOR System</h1>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center mb-1">
                <span className="text-white text-xs font-bold">i</span>
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = isActiveMenuItem(item)
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.path) navigate(item.path)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                  ? 'bg-red-50 text-red-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className={`${isActive ? 'text-red-600' : 'text-gray-500'}`}>
                  <item.icon />
                </div>
                {sidebarOpen && <span className="text-sm">{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Search />
                </div>
                <input
                  type="text"
                  placeholder={user?.role?.toUpperCase() === 'ADMIN' ? 'Search users, inspections, sites...' : 'Search inspections, equipment, sites...'}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 ml-6">
              {/* Notification Bell */}
              <div className="relative notification-dropdown-container">
                <button
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative"
                >
                  <Icons.Bell />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notificationDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 max-h-96 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                      </div>
                      <span className="text-xs text-gray-500">{unreadCount} unread</span>
                    </div>

                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No new notifications
                      </div>
                    ) : (
                      <div>
                        {notifications.map((notif, index) => (
                          <div
                            key={index}
                            onClick={() => handleNotificationClick(notif)}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900 mb-1">{notif.title}</p>
                            <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Profile Dropdown */}
              <div className="relative pl-4 border-l border-gray-200 profile-dropdown-container">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  {user && (
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user.username}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                  )}
                  <Icons.ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false)
                        navigate('/profile')
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      <Icons.User className="w-4 h-4 text-gray-500" />
                      <span>Profile</span>
                    </button>

                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <Icons.LogOut className="w-4 h-4 text-red-600" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {selectedNotification.title}
            </h3>
            <div className="mb-6">
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedNotification.message}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Received: {new Date(selectedNotification.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
              {selectedNotification.action_link && (
                <button
                  onClick={handleModalAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  view details
                  <Icons.Search />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

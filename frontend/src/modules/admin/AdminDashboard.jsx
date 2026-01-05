/**
 * Admin Dashboard Module
 * Modern, clean, responsive Admin Dashboard for VISOR Inspection Management System
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../../services/api'

// Simple SVG Icon Components
const Icons = {
  Dashboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Users: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Building: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
  AlertCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  TrendingDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
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

function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [kpiData, setKpiData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [criticalAlerts, setCriticalAlerts] = useState([])
  const [userRoles, setUserRoles] = useState({})
  const [reportsByMonth, setReportsByMonth] = useState([])
  const [activeUsersByMonth, setActiveUsersByMonth] = useState([])

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
        
        if (userData.role?.toUpperCase() !== 'ADMIN') {
          if (userData.role?.toUpperCase() === 'INSPECTOR') {
            navigate('/inspector/dashboard')
          } else {
            navigate('/reports')
          }
        }
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }, [navigate])

  // Helper function to get time ago
  const getTimeAgo = (date) => {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const headers = { Authorization: `Bearer ${token}` }

        // Fetch users
        let users = []
        try {
          const usersRes = await axios.get(`${API_BASE}/users/`, { headers })
          // API returns {success: true, users: [...]}
          users = (usersRes.data?.users || usersRes.data || [])
          // Ensure it's an array
          if (!Array.isArray(users)) {
            users = []
          }
        } catch (e) {
          console.log('Could not fetch users:', e)
        }

        // Fetch inspections
        let inspections = []
        try {
          const inspectionsRes = await axios.get(`${API_BASE}/inspections/`, { headers })
          inspections = inspectionsRes.data || []
        } catch (e) {
          console.log('Could not fetch inspections:', e)
        }

        // Fetch reports
        let reports = []
        try {
          // The archive endpoint returns a list directly
          const reportsRes = await axios.get(`${API_BASE}/reports/history/archive`, { headers })
          // Response is a list, not wrapped in an object
          reports = Array.isArray(reportsRes.data) ? reportsRes.data : []
        } catch (e) {
          console.log('Could not fetch reports:', e)
          // Try search endpoint as fallback
          try {
            const searchRes = await axios.post(`${API_BASE}/reports/history/search`, 
              { start_date: null, end_date: null },
              { headers }
            )
            reports = Array.isArray(searchRes.data) ? searchRes.data : []
          } catch (searchErr) {
            console.log('Could not fetch reports via search:', searchErr)
          }
        }

        // Fetch equipment
        let equipment = []
        try {
          const equipmentRes = await axios.get(`${API_BASE}/equipment/`, { headers })
          equipment = equipmentRes.data || []
        } catch (e) {
          console.log('Could not fetch equipment:', e)
        }

        // Calculate user roles distribution
        const roleCounts = {}
        users.forEach(u => {
          const role = u.role || 'INSPECTOR'
          roleCounts[role] = (roleCounts[role] || 0) + 1
        })
        setUserRoles(roleCounts)

        // Calculate KPIs
        const totalUsers = users.length
        const activeUsers = users.filter(u => u.Account_status === 'ACTIVE' || !u.Account_status).length
        const submittedInspections = inspections.filter(i => 
          i.status === 'Submitted' || 
          i.status === 'SUBMITTED' ||
          i.status === 'QA Review' ||
          i.status === 'QA_REVIEW'
        ).length
        const approvedInspections = inspections.filter(i => 
          i.status === 'Approved' || 
          i.status === 'APPROVED'
        ).length
        const rejectedReports = reports.filter(r => 
          r.status === 'REJECTED' || 
          r.status === 'Rejected'
        ).length
        const totalEquipment = equipment.length

        // Set KPI data
        setKpiData([
          { title: 'Total Users', value: totalUsers.toString(), trend: '', trendUp: true, icon: Icons.Users, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
          { title: 'Total Equipment', value: totalEquipment.toString(), trend: '', trendUp: true, icon: Icons.Building, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
          { title: 'Submitted Inspections', value: submittedInspections.toString(), trend: '', trendUp: true, icon: Icons.Eye, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
          { title: 'Approved Inspections', value: approvedInspections.toString(), trend: '', trendUp: true, icon: Icons.FileCheck, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
          { title: 'Rejected Reports', value: rejectedReports.toString(), trend: '', trendUp: true, icon: Icons.BarChart, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
          { title: 'Active Users', value: activeUsers.toString(), trend: '', trendUp: true, icon: Icons.Users, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
        ])

        // Process reports by month for the current year
        const currentYear = new Date().getFullYear()
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        // Debug: Log reports data
        console.log('📊 Reports data:', reports.length, 'reports found')
        if (reports.length > 0) {
          console.log('📊 Sample report:', reports[0])
        }
        
        const reportsByMonthData = months.map((monthName, index) => {
          const monthReports = reports.filter(report => {
            // Try multiple possible date fields
            const dateField = report.created_at || report.createdAt || report.inspection_date || report.date
            if (!dateField) {
              return false
            }
            
            try {
              const reportDate = new Date(dateField)
              // Check if date is valid
              if (isNaN(reportDate.getTime())) {
                return false
              }
              
              const reportYear = reportDate.getFullYear()
              const reportMonth = reportDate.getMonth()
              
              // Match current year and month index (0-based)
              return reportYear === currentYear && reportMonth === index
            } catch (e) {
              console.warn('Error parsing date:', dateField, e)
              return false
            }
          })
          
          return {
            month: `${monthName} ${currentYear}`,
            reports: monthReports.length
          }
        })
        
        console.log('📊 Reports by month:', reportsByMonthData)
        setReportsByMonth(reportsByMonthData)

        // Process active users by month for the current year
        // Calculate cumulative active users at the end of each month
        console.log('👥 Users data:', users.length, 'users found')
        if (users.length > 0) {
          console.log('👥 Sample user:', users[0])
        }
        
        const activeUsersByMonthData = months.map((monthName, index) => {
          // Count all active users created up to and including this month
          const activeUsersUpToMonth = users.filter(user => {
            // Check if user is active
            const isActive = user.Account_status === 'ACTIVE' || !user.Account_status
            if (!isActive) return false
            
            // Try to get creation date from various possible fields
            const dateField = user.created_at || user.createdAt || user.account_created_at || user.date_created
            if (!dateField) {
              // If no date, only include if we're at the first month (they existed before tracking)
              return index === 0
            }
            
            try {
              const userDate = new Date(dateField)
              // Check if date is valid
              if (isNaN(userDate.getTime())) {
                console.warn('Invalid user date:', dateField, user)
                return index === 0 // Include in first month if date is invalid
              }
              
              const userYear = userDate.getFullYear()
              const userMonth = userDate.getMonth()
              
              // Include users created:
              // 1. Before current year (they existed at start of year)
              // 2. In current year up to and including this month
              return userYear < currentYear || (userYear === currentYear && userMonth <= index)
            } catch (e) {
              console.warn('Error parsing user date:', dateField, e, user)
              return index === 0 // Include in first month if parsing fails
            }
          })
          
          return {
            month: `${monthName} ${currentYear}`,
            activeUsers: activeUsersUpToMonth.length
          }
        })
        
        console.log('👥 Active users by month:', activeUsersByMonthData)
        setActiveUsersByMonth(activeUsersByMonthData)

        // Recent activity from reports
        const sortedReports = [...reports]
          .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at) : new Date(0)
            const dateB = b.created_at ? new Date(b.created_at) : new Date(0)
            return dateB - dateA
          })
          .slice(0, 5)

        const activityData = sortedReports.map(report => {
          const reportUser = users.find(u => u.id === report.created_by) || { username: 'Unknown' }
          return {
            user: reportUser.username || 'Unknown',
            action: `Generated Report ${report.report_id?.substring(0, 8) || 'N/A'}`,
            module: 'Reports',
            timestamp: report.created_at ? getTimeAgo(new Date(report.created_at)) : 'Unknown'
          }
        })
        setRecentActivity(activityData)

        // Critical alerts - inspections that are overdue or pending for too long
        const now = new Date()
        const alerts = inspections
          .filter(i => {
            if (i.status === 'Submitted' || i.status === 'SUBMITTED' || i.status === 'QA Review' || i.status === 'QA_REVIEW') {
              if (i.inspection_date) {
                const inspectionDate = new Date(i.inspection_date)
                const daysDiff = (now - inspectionDate) / (1000 * 60 * 60 * 24)
                return daysDiff > 30 // Over 30 days old
              }
            }
            return false
          })
          .slice(0, 3)
          .map(i => ({
            description: `Inspection ${i.inspection_id} is overdue`,
            priority: 'High',
            status: 'Open'
          }))
        setCriticalAlerts(alerts.length > 0 ? alerts : [
          { description: 'No critical alerts at this time', priority: 'Low', status: 'None' }
        ])

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set default empty data
        setKpiData([
          { title: 'Total Users', value: '0', trend: '', trendUp: true, icon: Icons.Users, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
          { title: 'Total Equipment', value: '0', trend: '', trendUp: true, icon: Icons.Building, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
          { title: 'Ongoing Inspections', value: '0', trend: '', trendUp: true, icon: Icons.Eye, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{kpi.value}</p>
                    <div className={`flex items-center gap-1 text-sm ${kpi.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.trendUp ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
                      <span>{kpi.trend}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${kpi.bgColor}`}>
                    <div className={kpi.iconColor}>
                      <kpi.icon />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Reports Created Over Time */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports Created Over Time</h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm">Loading...</p>
                </div>
              ) : reportsByMonth.length > 0 ? (
                <div className="space-y-4">
                  {/* Column chart visualization */}
                  <div className="flex items-end h-48 gap-2 pt-6">
                    {(() => {
                      const maxReports = Math.max(...reportsByMonth.map(m => m.reports), 1)
                      const maxBarHeight = 160
                      const minBarHeight = 8
                      
                      return reportsByMonth.map((monthData) => {
                        let height = 0
                        if (maxReports > 0) {
                          const proportion = monthData.reports / maxReports
                          height = Math.max(minBarHeight, proportion * maxBarHeight)
                        } else if (monthData.reports > 0) {
                          height = minBarHeight
                        }
                        
                        return (
                          <div key={monthData.month} className="flex-1 flex flex-col items-center">
                            <div className="text-xs text-gray-600 mb-2 text-center">{monthData.month.split(' ')[0]}</div>
                            <div 
                              className="w-full bg-gradient-to-t from-red-500 to-red-600 rounded-t-xl transition-all duration-300 hover:from-red-600 hover:to-red-700 flex items-end justify-center cursor-pointer"
                              style={{ height: `${height}px`, minHeight: `${minBarHeight}px` }}
                              title={`${monthData.reports} reports in ${monthData.month}`}
                            >
                              <div className="text-xs text-white text-center opacity-0 hover:opacity-100 pt-1 w-full">
                                {monthData.reports}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                  
                  {/* Summary */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total Reports This Year:</span>
                      <span className="font-bold text-red-600">
                        {reportsByMonth.reduce((sum, m) => sum + m.reports, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm">No report data available</p>
                </div>
              )}
            </div>

            {/* Active Users Over Time */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Users Over Time</h3>
              {loading ? (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm">Loading...</p>
                </div>
              ) : activeUsersByMonth.length > 0 ? (
                <div className="space-y-4">
                  {/* Column chart visualization */}
                  <div className="flex items-end h-48 gap-2 pt-6">
                    {(() => {
                      const maxUsers = Math.max(...activeUsersByMonth.map(m => m.activeUsers), 1)
                      const maxBarHeight = 160
                      const minBarHeight = 8
                      
                      return activeUsersByMonth.map((monthData) => {
                        let height = 0
                        if (maxUsers > 0) {
                          const proportion = monthData.activeUsers / maxUsers
                          height = Math.max(minBarHeight, proportion * maxBarHeight)
                        } else if (monthData.activeUsers > 0) {
                          height = minBarHeight
                        }
                        
                        return (
                          <div key={monthData.month} className="flex-1 flex flex-col items-center">
                            <div className="text-xs text-gray-600 mb-2 text-center">{monthData.month.split(' ')[0]}</div>
                            <div 
                              className="w-full bg-gradient-to-t from-green-500 to-green-600 rounded-t-xl transition-all duration-300 hover:from-green-600 hover:to-green-700 flex items-end justify-center cursor-pointer"
                              style={{ height: `${height}px`, minHeight: `${minBarHeight}px` }}
                              title={`${monthData.activeUsers} active users in ${monthData.month}`}
                            >
                              <div className="text-xs text-white text-center opacity-0 hover:opacity-100 pt-1 w-full">
                                {monthData.activeUsers}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                  
                  {/* Summary */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Current Active Users:</span>
                      <span className="font-bold text-green-600">
                        {activeUsersByMonth.length > 0 ? activeUsersByMonth[activeUsersByMonth.length - 1].activeUsers : 0}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl">
                  <p className="text-gray-500 text-sm">No user data available</p>
                </div>
              )}
            </div>
          </div>

            {/* User Roles Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles Distribution</h3>
            {loading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(userRoles).length > 0 ? (
                  Object.entries(userRoles).map(([role, count]) => (
                    <div key={role} className="text-center p-4 bg-gray-50 rounded-xl">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-red-100 flex items-center justify-center">
                        <Icons.Users className="w-8 h-8 text-red-600" />
                      </div>
                      <p className="font-semibold text-gray-900">{role}</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">{count}</p>
                    </div>
                  ))
                ) : (
                  <p className="col-span-4 text-center text-gray-500">No user data available</p>
                )}
              </div>
            )}
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity Log</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                      </tr>
                    ) : recentActivity.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No recent activity</td>
                      </tr>
                    ) : (
                      recentActivity.map((activity, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.user}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{activity.module}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.timestamp}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Critical Alerts</h3>
              </div>
              <div className="p-6 space-y-4">
                {loading ? (
                  <p className="text-sm text-gray-500 text-center">Loading...</p>
                ) : criticalAlerts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center">No alerts</p>
                ) : (
                  criticalAlerts.map((alert, index) => (
                    <div key={index} className={`p-4 border rounded-xl ${
                      alert.priority === 'High' ? 'bg-red-50 border-red-200' : 
                      alert.priority === 'Low' ? 'bg-gray-50 border-gray-200' : 
                      'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{alert.description}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          alert.priority === 'High' ? 'bg-red-100 text-red-800' : 
                          alert.priority === 'Low' ? 'bg-gray-100 text-gray-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          alert.status === 'Open' ? 'bg-red-100 text-red-800' : 
                          alert.status === 'None' ? 'bg-gray-100 text-gray-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {alert.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button
          onClick={() => navigate('/admin/users')}
          className="w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-110 flex items-center justify-center"
          title="Add User"
        >
          <Icons.Plus />
        </button>
      </div>
    </>
  )
}

export default AdminDashboard
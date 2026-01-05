/**
 * Inspector Dashboard Module
 * Modern, clean, responsive Inspector Dashboard for VISOR Inspection Management System
 * Matches Admin Dashboard design aesthetic
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../../services/api'

// Simple SVG Icon Components (matching Admin Dashboard)
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
  TrendingUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  TrendingDown: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6 6" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Image: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

function InspectorDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [kpiData, setKpiData] = useState([])
  const [recentInspections, setRecentInspections] = useState([])
  const [recentActivity, setRecentActivity] = useState([])

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
        
        if (userData.role?.toUpperCase() !== 'INSPECTOR') {
          if (userData.role?.toUpperCase() === 'ADMIN') {
            navigate('/admin/dashboard')
          } else if (userData.role?.toUpperCase() === 'ENGINEER') {
            navigate('/engineer/dashboard')
          } else {
            navigate('/inspector/dashboard')
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

        // Get current user ID to filter by inspector
        let currentUserId = user?.id || null
        if (!currentUserId) {
          const userStr = localStorage.getItem('user')
          if (userStr) {
            try {
              const userData = JSON.parse(userStr)
              currentUserId = userData.id
            } catch (e) {
              console.error('Error parsing user data:', e)
            }
          }
        }

        // Fetch inspections
        const inspectionsRes = await axios.get(`${API_BASE}/inspections/`, { headers })
        const inspections = inspectionsRes.data || []

        // Fetch reports - try to get all reports
        let reports = []
        try {
          // Try new endpoint first
          const allReportsRes = await axios.get(`${API_BASE}/reports/all`, { headers })
          reports = allReportsRes.data || []
        } catch (e) {
          // Fallback to history endpoint
          try {
            const reportsRes = await axios.get(`${API_BASE}/reports/history/archive`, { headers })
            reports = reportsRes.data?.reports || reportsRes.data || []
          } catch (e2) {
            console.log('Could not fetch reports:', e2)
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

        // Filter reports by current inspector (created_by)
        const inspectorReports = currentUserId 
          ? reports.filter(r => r.created_by === currentUserId || r.created_by === parseInt(currentUserId))
          : reports

        // Calculate KPIs for this inspector
        // Submitted Reports: Reports with status SUBMITTED or QA_REVIEW created by this inspector
        const submittedReports = inspectorReports.filter(r => {
          const status = (r.status || '').toUpperCase()
          return status === 'SUBMITTED' || status === 'QA_REVIEW'
        }).length

        // Approved Inspections: Count unique inspections that have approved reports or are approved
        // Get all approved report inspection IDs
        const approvedReportInspectionIds = new Set(
          inspectorReports
            .filter(r => {
              const status = (r.status || '').toUpperCase()
              return status === 'APPROVED' && r.inspection_id
            })
            .map(r => r.inspection_id)
        )
        
        // Count inspections that are approved or have approved reports
        const approvedInspections = inspections.filter(i => {
          const inspectionId = i.inspection_id || i.id
          const status = (i.status || '').toUpperCase()
          return status === 'APPROVED' || approvedReportInspectionIds.has(inspectionId)
        }).length

        const totalReports = inspectorReports.length
        const totalEquipment = equipment.length

        // Get today's date
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const completedToday = inspections.filter(i => {
          if (!i.inspection_date) return false
          const inspectionDate = new Date(i.inspection_date)
          inspectionDate.setHours(0, 0, 0, 0)
          return inspectionDate.getTime() === today.getTime() && i.status === 'Completed'
        }).length

        // Set KPI data
        setKpiData([
          { title: 'Submitted Reports', value: submittedReports.toString(), trend: '', trendUp: true, icon: Icons.Eye, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
          { title: 'Completed Today', value: completedToday.toString(), trend: '', trendUp: true, icon: Icons.CheckCircle, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
          { title: 'Total Inspections', value: inspections.length.toString(), trend: '', trendUp: true, icon: Icons.Eye, bgColor: 'bg-slate-100', iconColor: 'text-slate-700' },
          { title: 'Reports Generated', value: totalReports.toString(), trend: '', trendUp: true, icon: Icons.FileText, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
          { title: 'Approved Inspections', value: approvedInspections.toString(), trend: '', trendUp: true, icon: Icons.CheckCircle, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
          { title: 'Total Equipment', value: totalEquipment.toString(), trend: '', trendUp: true, icon: Icons.Building, bgColor: 'bg-slate-100', iconColor: 'text-slate-700' },
        ])

        // Get recent inspections (last 5)
        const sortedInspections = [...inspections]
          .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at) : new Date(0)
            const dateB = b.created_at ? new Date(b.created_at) : new Date(0)
            return dateB - dateA
          })
          .slice(0, 5)

        const recentInspectionsData = sortedInspections.map(inspection => {
          const equipmentName = equipment.find(eq => eq.id === inspection.equipment_id)?.tag || 'Unknown Equipment'
          const timeAgo = inspection.created_at ? getTimeAgo(new Date(inspection.created_at)) : 'Unknown'
          return {
            id: inspection.inspection_id,
            site: equipmentName,
            status: inspection.status || 'Pending',
            priority: inspection.priority || 'Medium',
            assigned: 'You',
            timestamp: timeAgo
          }
        })
        setRecentInspections(recentInspectionsData)

        // Recent activity from reports
        const sortedReports = [...reports]
          .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at) : new Date(0)
            const dateB = b.created_at ? new Date(b.created_at) : new Date(0)
            return dateB - dateA
          })
          .slice(0, 4)

        const activityData = sortedReports.map(report => ({
          action: `Generated Report ${report.report_id?.substring(0, 8) || 'N/A'}`,
          module: 'Reports',
          timestamp: report.created_at ? getTimeAgo(new Date(report.created_at)) : 'Unknown'
        }))
        setRecentActivity(activityData)

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set default empty data
        setKpiData([
          { title: 'Submitted Reports', value: '0', trend: '', trendUp: true, icon: Icons.Eye, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
          { title: 'Completed Today', value: '0', trend: '', trendUp: true, icon: Icons.CheckCircle, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
          { title: 'Total Inspections', value: '0', trend: '', trendUp: true, icon: Icons.Eye, bgColor: 'bg-slate-100', iconColor: 'text-slate-700' },
          { title: 'Reports Generated', value: '0', trend: '', trendUp: true, icon: Icons.FileText, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
          { title: 'Approved Inspections', value: '0', trend: '', trendUp: true, icon: Icons.CheckCircle, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <>
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.username || 'Inspector'}!
            </h1>
            <p className="text-gray-600">Here's what's happening with your inspections today.</p>
          </div>

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

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <button
              onClick={() => navigate('/inspection')}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
                  <Icons.Eye className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Start Inspection</h3>
                  <p className="text-sm text-gray-600">Begin a new inspection workflow</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/equipment')}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
                  <Icons.Building className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">View Equipment</h3>
                  <p className="text-sm text-gray-600">Manage equipment records</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate('/monitoring')}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
                  <Icons.FileText className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Report History</h3>
                  <p className="text-sm text-gray-600">View and review reports</p>
                </div>
              </div>
            </button>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Inspections */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Inspections</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                      </tr>
                    ) : recentInspections.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No recent inspections</td>
                      </tr>
                    ) : (
                      recentInspections.map((inspection) => (
                        <tr key={inspection.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/inspection/${inspection.id}`)}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inspection.site}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            inspection.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            inspection.status === 'In Progress' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {inspection.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            inspection.priority === 'High' ? 'bg-red-100 text-red-800' :
                            inspection.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {inspection.priority}
                          </span>
                        </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.timestamp}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-sm text-gray-500 text-center">Loading...</p>
                  ) : recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center">No recent activity</p>
                  ) : (
                    recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="p-2 rounded-lg bg-red-50">
                        <Icons.Clock className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{activity.module}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{activity.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button
          onClick={() => navigate('/inspection')}
          className="w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-110 flex items-center justify-center"
          title="Start New Inspection"
        >
          <Icons.Plus />
        </button>
      </div>
    </>
  )
}

export default InspectorDashboard
/**
 * Engineer Dashboard Module
 * QA Review Statistics Dashboard for Engineers
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../../services/api'
import { reportService } from '../../services/reportService'

// SVG Icon Components
const Icons = {
  FileCheck: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  XCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  AlertCircle: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
}

function EngineerDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [kpiData, setKpiData] = useState([])
  const [recentReports, setRecentReports] = useState([])
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
        
        // Redirect if not engineer
        if (userData.role?.toUpperCase() !== 'ENGINEER') {
          if (userData.role?.toUpperCase() === 'ADMIN') {
            navigate('/admin/dashboard')
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

        // Fetch all reports to calculate statistics
        let allReports = []
        
        // Try to get all reports from the new /all endpoint
        try {
          const allReportsData = await reportService.getAllReports()
          allReports = Array.isArray(allReportsData) ? allReportsData : []
          console.log('📊 Fetched all reports:', allReports.length)
        } catch (e) {
          console.error('❌ Could not fetch all reports, trying history endpoint:', e)
          // Fallback to history endpoint
          try {
            const reportsRes = await axios.get(`${API_BASE}/reports/history/archive`, { headers })
            const historyReports = reportsRes.data?.reports || reportsRes.data || []
            allReports = Array.isArray(historyReports) ? historyReports : []
            console.log('📊 Fetched reports from history (fallback):', allReports.length)
          } catch (e2) {
            console.error('❌ Could not fetch report history:', e2)
          }
        }

        // Log status breakdown for debugging
        console.log('📊 Total reports fetched:', allReports.length)
        if (allReports.length > 0) {
          const statusBreakdown = {
            approved: allReports.filter(r => {
              const status = r.status?.toUpperCase() || ''
              return status === 'APPROVED'
            }).length,
            rejected: allReports.filter(r => {
              const status = r.status?.toUpperCase() || ''
              return status === 'REJECTED'
            }).length,
            submitted: allReports.filter(r => {
              const status = r.status?.toUpperCase() || ''
              return status === 'SUBMITTED'
            }).length,
            qa_review: allReports.filter(r => {
              const status = r.status?.toUpperCase() || ''
              return status === 'QA_REVIEW'
            }).length,
            draft: allReports.filter(r => {
              const status = r.status?.toUpperCase() || ''
              return status === 'DRAFT'
            }).length,
          }
          console.log('📊 Status breakdown:', statusBreakdown)
          console.log('📊 Sample report statuses:', allReports.slice(0, 10).map(r => ({ 
            id: r.report_id || r.id, 
            status: r.status,
            statusUpper: r.status?.toUpperCase() 
          })))
        }

        // Calculate statistics - normalize status to uppercase for comparison
        const waitingReports = allReports.filter(r => {
          const status = (r.status || '').toUpperCase()
          return status === 'SUBMITTED' || status === 'QA_REVIEW'
        }).length

        const approvedReports = allReports.filter(r => {
          const status = (r.status || '').toUpperCase()
          return status === 'APPROVED'
        }).length

        const rejectedReports = allReports.filter(r => {
          const status = (r.status || '').toUpperCase()
          return status === 'REJECTED'
        }).length

        const totalReviewed = approvedReports + rejectedReports

        // Get today's reviews
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const reviewedToday = allReports.filter(r => {
          if (!r.updated_at) return false
          const reviewDate = new Date(r.updated_at)
          reviewDate.setHours(0, 0, 0, 0)
          const status = (r.status || '').toUpperCase()
          return reviewDate.getTime() === today.getTime() && 
                 (status === 'APPROVED' || status === 'REJECTED')
        }).length

        // Set KPI data
        setKpiData([
          { 
            title: 'Waiting for Review', 
            value: waitingReports.toString(), 
            trend: '', 
            trendUp: false, 
            icon: Icons.Clock, 
            bgColor: 'bg-yellow-50', 
            iconColor: 'text-yellow-600' 
          },
          { 
            title: 'Approved Reports', 
            value: approvedReports.toString(), 
            trend: '', 
            trendUp: true, 
            icon: Icons.CheckCircle, 
            bgColor: 'bg-green-50', 
            iconColor: 'text-green-600' 
          },
          { 
            title: 'Rejected Reports', 
            value: rejectedReports.toString(), 
            trend: '', 
            trendUp: false, 
            icon: Icons.XCircle, 
            bgColor: 'bg-red-50', 
            iconColor: 'text-red-600' 
          },
          { 
            title: 'Reviewed Today', 
            value: reviewedToday.toString(), 
            trend: '', 
            trendUp: true, 
            icon: Icons.FileCheck, 
            bgColor: 'bg-blue-50', 
            iconColor: 'text-blue-600' 
          },
          { 
            title: 'Total Reviewed', 
            value: totalReviewed.toString(), 
            trend: '', 
            trendUp: true, 
            icon: Icons.CheckCircle, 
            bgColor: 'bg-slate-100', 
            iconColor: 'text-slate-700' 
          },
          { 
            title: 'Total Reports', 
            value: allReports.length.toString(), 
            trend: '', 
            trendUp: true, 
            icon: Icons.FileCheck, 
            bgColor: 'bg-slate-100', 
            iconColor: 'text-slate-700' 
          },
        ])

        // Get recent reports waiting for review (last 5)
        const waitingReportsList = allReports
          .filter(r => {
            const status = (r.status || '').toUpperCase()
            return status === 'SUBMITTED' || status === 'QA_REVIEW'
          })
          .sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at) : new Date(0)
            const dateB = b.created_at ? new Date(b.created_at) : new Date(0)
            return dateB - dateA
          })
          .slice(0, 5)

        const recentReportsData = waitingReportsList.map(report => {
          const timeAgo = report.created_at ? getTimeAgo(new Date(report.created_at)) : 'Unknown'
          return {
            id: report.report_id || report.id,
            title: report.title || `Report ${(report.report_id || report.id).substring(0, 8)}`,
            status: report.status || 'SUBMITTED',
            timestamp: timeAgo,
            inspectionId: report.inspection_id
          }
        })
        setRecentReports(recentReportsData)

        // Recent activity (recently reviewed reports)
        const reviewedReports = allReports
          .filter(r => {
            const status = (r.status || '').toUpperCase()
            return status === 'APPROVED' || status === 'REJECTED'
          })
          .sort((a, b) => {
            const dateA = a.updated_at ? new Date(a.updated_at) : new Date(0)
            const dateB = b.updated_at ? new Date(b.updated_at) : new Date(0)
            return dateB - dateA
          })
          .slice(0, 5)

        const activityData = reviewedReports.map(report => {
          const status = (report.status || '').toUpperCase()
          return {
            action: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} Report ${(report.report_id || report.id).substring(0, 8)}`,
            status: status,
            timestamp: report.updated_at ? getTimeAgo(new Date(report.updated_at)) : 'Unknown'
          }
        })
        setRecentActivity(activityData)

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set default empty data
        setKpiData([
          { title: 'Waiting for Review', value: '0', trend: '', trendUp: false, icon: Icons.Clock, bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
          { title: 'Approved Reports', value: '0', trend: '', trendUp: true, icon: Icons.CheckCircle, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
          { title: 'Rejected Reports', value: '0', trend: '', trendUp: false, icon: Icons.XCircle, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
          { title: 'Reviewed Today', value: '0', trend: '', trendUp: true, icon: Icons.FileCheck, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <div className="p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.username || 'Engineer'}!
        </h1>
        <p className="text-gray-600">QA Review Dashboard - Monitor and review inspection reports.</p>
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
                  {kpi.trendUp ? <Icons.TrendingUp /> : null}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => navigate('/review-inspection')}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-50 group-hover:bg-red-100 transition-colors">
              <Icons.FileCheck className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Review Reports</h3>
              <p className="text-sm text-gray-600">Review and approve/reject submitted inspection reports</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/monitoring')}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-slate-200 transition-colors">
              <Icons.Eye className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Report History</h3>
              <p className="text-sm text-gray-600">View all reports and their review history</p>
            </div>
          </div>
        </button>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Waiting Reports */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Reports Waiting for Review</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td>
                  </tr>
                ) : recentReports.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">No reports waiting for review</td>
                  </tr>
                ) : (
                  recentReports.map((report) => (
                    <tr 
                      key={report.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer" 
                      onClick={() => navigate('/review-inspection')}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (report.status || '').toUpperCase() === 'SUBMITTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {(report.status || '').toUpperCase() === 'SUBMITTED' ? 'Submitted' : 'QA Review'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.timestamp}</td>
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
            <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-gray-500 text-center">Loading...</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No recent reviews</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className={`p-2 rounded-lg ${
                      (activity.status || '').toUpperCase() === 'APPROVED'
                        ? 'bg-green-50'
                        : 'bg-red-50'
                    }`}>
                      {(activity.status || '').toUpperCase() === 'APPROVED' ? (
                        <Icons.CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Icons.XCircle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EngineerDashboard

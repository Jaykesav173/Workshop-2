/**
 * Inspector Dashboard Module
 * Modern, clean, responsive Inspector Dashboard for VISOR Inspection Management System
 * Matches Admin Dashboard design aesthetic
 */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

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

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    // const token = localStorage.getItem('token')

    // if (!token) {
    //   navigate('/login')
    //   return
    // }

    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUser(userData)

        if (userData.role?.toUpperCase() !== 'INSPECTOR') {
          if (userData.role?.toUpperCase() === 'ADMIN') {
            navigate('/admin/dashboard')
          } else {
            navigate('/reports')
          }
        }
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }
  }, [navigate])

  // State for Real Data
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [kpiStats, setKpiStats] = useState({
    pending: 0,
    completedToday: 0,
    overdue: 0,
    total: 0
  })

  // Fetch Schedules on Mount
  useEffect(() => {
    if (user?.id) {
      fetchSchedules(user.id)
    }
  }, [user])

  const fetchSchedules = async (userId) => {
    try {
      const res = await fetch(`http://localhost:8000/schedules/all`)
      if (res.ok) {
        const all = await res.json()
        const mySchedules = all.filter(s => s.inspector_id == userId)

        // Sort by date (newest first)
        mySchedules.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))

        setSchedules(mySchedules)
        calculateKPIs(mySchedules)
      }
    } catch (e) {
      console.error("Failed to fetch schedules", e)
    } finally {
      setLoading(false)
    }
  }

  const calculateKPIs = (data) => {
    const today = new Date().toISOString().split('T')[0]
    const pending = data.filter(s => s.status === 'Pending').length
    const completedToday = data.filter(s => s.status === 'Completed' && s.scheduled_date === today).length
    const overdue = data.filter(s => s.status !== 'Completed' && s.scheduled_date < today).length

    setKpiStats({
      pending,
      completedToday,
      overdue,
      total: data.length
    })
  }

  // Derived KPI Data for UI
  const kpiData = [
    { title: 'Pending Actions', value: kpiStats.pending.toString(), trend: 'Active', trendUp: true, icon: Icons.Eye, bgColor: 'bg-blue-50', iconColor: 'text-blue-600' },
    { title: 'Completed Today', value: kpiStats.completedToday.toString(), trend: 'Good job', trendUp: true, icon: Icons.CheckCircle, bgColor: 'bg-green-50', iconColor: 'text-green-600' },
    { title: 'Overdue Items', value: kpiStats.overdue.toString(), trend: 'Action Needed', trendUp: false, icon: Icons.Clock, bgColor: 'bg-red-50', iconColor: 'text-red-600' },
  ]

  // Recent Activity (Mocked for now as we don't have an activity log endpoint yet)
  const recentActivity = [
    { action: 'System check', module: 'System', timestamp: 'Just now' }
  ]

  // Deep Linking & Modal State
  const [searchParams] = useSearchParams()
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  // Check URL for deep link
  useEffect(() => {
    const scheduleId = searchParams.get('scheduleId')
    if (scheduleId && schedules.length > 0) {
      const found = schedules.find(s => s.schedule_id == scheduleId)
      if (found) {
        setSelectedSchedule(found)
      }
    }
  }, [searchParams, schedules])

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule)
  }

  const handleConfirm = async (scheduleId) => {
    if (!scheduleId) return

    try {
      // Optimistic Update
      const updatedSchedules = schedules.map(s =>
        s.schedule_id === scheduleId ? { ...s, status: 'Confirmed' } : s
      )
      setSchedules(updatedSchedules)
      if (selectedSchedule && selectedSchedule.schedule_id === scheduleId) {
        setSelectedSchedule({ ...selectedSchedule, status: 'Confirmed' })
      }

      // API Call
      const res = await fetch(`http://localhost:8000/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Confirmed' })
      })

      if (!res.ok) {
        // Revert on failure (or fetch again)
        console.error("Failed to confirm schedule")
        fetchSchedules(user.id)
      }
    } catch (e) {
      console.error("Error confirming schedule:", e)
      fetchSchedules(user.id)
    }
  }

  // Modal Component
  const ScheduleDetailsModal = ({ schedule, onClose }) => {
    if (!schedule) return null
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
            <h2 className="text-xl font-bold text-gray-900">Inspection Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Header Info */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Icons.Building className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">EQ-{schedule.equipment_id}</h3>
                <p className="text-gray-600">{schedule.location || 'Unknown Location'}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${schedule.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  schedule.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                  {schedule.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Schedule Info</p>
                <div className="space-y-3">
                  <div><span className="text-gray-500 text-sm">Date:</span> <span className="font-medium text-gray-900 ml-2">{schedule.scheduled_date}</span></div>
                  <div><span className="text-gray-500 text-sm">Time:</span> <span className="font-medium text-gray-900 ml-2">{schedule.start_time} - {schedule.end_time}</span></div>
                  <div><span className="text-gray-500 text-sm">Priority:</span> <span className="font-medium text-gray-900 ml-2">{schedule.priority}</span></div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Technical Info</p>
                <div className="space-y-3">
                  <div><span className="text-gray-500 text-sm">Type:</span> <span className="font-medium text-gray-900 ml-2">{schedule.equipment_type || 'N/A'}</span></div>
                  <div><span className="text-gray-500 text-sm">Safety:</span> <span className="font-medium text-gray-900 ml-2">{schedule.safety_category || 'N/A'}</span></div>
                </div>
              </div>
            </div>

            {schedule.details && (
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                <p className="text-sm font-semibold text-yellow-800 mb-1">Inspector Notes / Instructions</p>
                <p className="text-sm text-yellow-700">{schedule.details}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              {schedule.status === 'Pending' && (
                <button onClick={() => handleConfirm(schedule.schedule_id)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg shadow-blue-200">
                  Confirm Schedule
                </button>
              )}
              {schedule.status === 'Confirmed' && (
                <button onClick={() => navigate('/inspection')} className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg shadow-blue-200">
                  Start Inspection
                </button>
              )}
              <button onClick={() => navigate('/photo-upload')} className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-semibold">
                Upload Photos
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
            <div className="p-3 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
              <Icons.Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Start Inspection</h3>
              <p className="text-sm text-gray-600">Begin a new inspection workflow</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/photo-upload')}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 group-hover:bg-purple-100 transition-colors">
              <Icons.Camera className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Upload Photos</h3>
              <p className="text-sm text-gray-600">Add inspection photos</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/reports')}
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100 text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors">
              <Icons.FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Generate Report</h3>
              <p className="text-sm text-gray-600">Create inspection report</p>
            </div>
          </div>
        </button>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inspections (Now Real Schedules) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Your Inspection Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment / Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-4">Loading your schedule...</td></tr>
                ) : schedules.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-4 text-gray-500">No schedules assigned.</td></tr>
                ) : (
                  schedules.map((schedule, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleScheduleClick(schedule)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        EQ-{schedule.equipment_id} <span className="text-gray-400">|</span> {schedule.location || 'Site'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${schedule.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          schedule.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                            schedule.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {schedule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${schedule.priority === 'High' ? 'bg-red-100 text-red-800' :
                          schedule.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                          {schedule.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{schedule.scheduled_date}</td>
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
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Icons.Clock className="w-4 h-4 text-blue-600" />
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <button
          onClick={() => navigate('/inspection')}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110 flex items-center justify-center"
          title="Start New Inspection"
        >
          <Icons.Plus />
        </button>
      </div>
      <ScheduleDetailsModal schedule={selectedSchedule} onClose={() => setSelectedSchedule(null)} />
    </>
  )
}

export default InspectorDashboard

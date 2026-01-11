/**
 * My Inspections Page
 * Main list view with summary cards, search, filter, and table
 */
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../../services/api'

const Icons = {
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Pencil: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Clipboard: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
}

function MyInspections() {
  const navigate = useNavigate()
  const location = useLocation()
  const [inspections, setInspections] = useState([])
  const [filteredInspections, setFilteredInspections] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [equipmentMap, setEquipmentMap] = useState({})
  const [userRole, setUserRole] = useState(null)
  const [reportStatusMap, setReportStatusMap] = useState({}) // Map of inspection_id -> report status

  // Get user role on mount
  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const userData = JSON.parse(userStr)
        setUserRole(userData.role?.toUpperCase() || 'INSPECTOR')
      } catch (e) {
        setUserRole('INSPECTOR')
      }
    } else {
      setUserRole('INSPECTOR')
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchInspections(), fetchEquipment()])
      } catch (err) {
        console.error('Error loading initial data:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    
    loadData()
    
    return () => {
      isMounted = false
    }
  }, [])

  // Refresh data when navigating back to this page
  useEffect(() => {
    if (location.pathname === '/inspection/list' || location.pathname === '/inspection') {
      const loadData = async () => {
        setLoading(true)
        try {
          await Promise.all([fetchInspections(), fetchEquipment()])
        } catch (err) {
          console.error('Error refreshing data:', err)
        } finally {
          setLoading(false)
        }
      }
      loadData()
    }
  }, [location.pathname])

  // Fetch report statuses after inspections are loaded (debounced to prevent rapid calls)
  useEffect(() => {
    if (inspections.length === 0) return
    
    // Debounce to prevent multiple rapid calls when inspections array changes
    const timeoutId = setTimeout(() => {
      fetchReportStatuses()
    }, 500) // Wait 500ms after inspections load before fetching reports
    
    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspections])

  // Fetch report statuses for inspections that might have reports
  // OPTIMIZED: Batch requests with timeout and throttling to prevent server overload
  const fetchReportStatuses = async () => {
    if (!inspections || inspections.length === 0) return
    
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      
      const statusMap = {}
      const inspectionsToCheck = inspections.slice(0, 50) // Limit to first 50
      
      // OPTIMIZATION: Process in batches of 10 with delays to prevent overwhelming server
      const BATCH_SIZE = 10
      const DELAY_MS = 100 // Delay between batches
      
      for (let i = 0; i < inspectionsToCheck.length; i += BATCH_SIZE) {
        const batch = inspectionsToCheck.slice(i, i + BATCH_SIZE)
        
        const batchPromises = batch.map(async (inspection) => {
          try {
            const inspectionId = inspection.inspection_id || inspection.id
            if (!inspectionId) return null
            
            const response = await axios.get(`${API_BASE}/reports/inspection/${inspectionId}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            
            // Handle new response format: { report: null } or { report: {...} }
            const reportData = response.data?.report !== undefined ? response.data.report : response.data
            
            if (reportData && reportData.status) {
              const reportStatus = reportData.status
              const statusMapping = {
                'SUBMITTED': 'Submitted',
                'Submitted': 'Submitted',
                'QA_REVIEW': 'QA Review',
                'QA Review': 'QA Review',
                'APPROVED': 'Approved',
                'Approved': 'Approved',
                'REJECTED': 'Rejected',
                'Rejected': 'Rejected',
                'DRAFT': 'Draft',
                'Draft': 'Draft'
              }
              const mappedStatus = statusMapping[reportStatus] || reportStatus
              return { inspectionId, status: mappedStatus }
            }
          } catch (err) {
            // Silently ignore errors - null report is valid
            // Only log unexpected errors (not 404s)
            if (err.response?.status !== 404) {
              console.warn(`Could not fetch report for inspection ${inspection.inspection_id || inspection.id}:`, err.message)
            }
            return null
          }
          return null
        })
        
        // Wait for batch to complete
        const batchResults = await Promise.allSettled(batchPromises)
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            statusMap[result.value.inspectionId] = result.value.status
          }
        })
        
        // Delay before next batch (except for last batch)
        if (i + BATCH_SIZE < inspectionsToCheck.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS))
        }
      }
      
      setReportStatusMap(statusMap)
    } catch (err) {
      console.warn('Error fetching report statuses:', err.message)
    }
  }

  useEffect(() => {
    filterInspections()
  }, [searchQuery, statusFilter, inspections, reportStatusMap])

  const fetchInspections = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('No auth token found')
        setInspections([])
        setFilteredInspections([])
        return
      }
      
      const response = await axios.get(`${API_BASE}/inspections/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const inspectionsData = response.data || []
      setInspections(inspectionsData)
      setFilteredInspections(inspectionsData)
    } catch (err) {
      console.error('Error fetching inspections:', err)
      // Set empty arrays on error to prevent showing stale data
      setInspections([])
      setFilteredInspections([])
      throw err // Re-throw so caller can handle it
    }
  }

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('No auth token found for equipment')
        return
      }
      
      const response = await axios.get(`${API_BASE}/equipment/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const map = {}
      ;(response.data || []).forEach(eq => {
        map[eq.id] = eq
      })
      setEquipmentMap(map)
    } catch (err) {
      console.error('Error fetching equipment:', err)
      // Keep existing equipmentMap on error (don't clear it)
      throw err // Re-throw so caller can handle it
    }
  }

  const filterInspections = () => {
    let filtered = [...inspections]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(inspection => {
        const vesselName = inspection.equipment_tag_no || 'N/A'
        const reportNo = `INSP-${inspection.inspection_id || inspection.id}`
        const searchLower = searchQuery.toLowerCase()
        return (
          reportNo.toLowerCase().includes(searchLower) ||
          vesselName.toLowerCase().includes(searchLower) ||
          (inspection.findings_summary || '').toLowerCase().includes(searchLower)
        )
      })
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'draft') {
        filtered = filtered.filter(i => 
          i.status === 'Draft' || 
          i.status === 'DRAFT' || 
          i.status === 'In Progress' || 
          i.status === 'IN_PROGRESS'
        )
      } else if (statusFilter === 'submitted') {
        filtered = filtered.filter(i => 
          i.status === 'Submitted' || 
          i.status === 'SUBMITTED' ||
          i.status === 'QA Review' ||
          i.status === 'QA_REVIEW'
        )
      } else if (statusFilter === 'approved') {
        filtered = filtered.filter(i => 
          i.status === 'Approved' || 
          i.status === 'APPROVED'
        )
      } else if (statusFilter === 'rejected') {
        filtered = filtered.filter(i => 
          i.status === 'Rejected' || 
          i.status === 'REJECTED'
        )
      }
    }

    setFilteredInspections(filtered)
  }

  const handleDelete = async (id, status) => {
    // For admins: only allow deletion of "In Progress" inspections
    if (userRole === 'ADMIN') {
      const normalizedStatus = status?.toLowerCase() || ''
      if (normalizedStatus !== 'in progress' && normalizedStatus !== 'in_progress') {
        alert('Admins can only delete inspections that are "In Progress".')
        return
      }
    }
    
    if (!window.confirm('Are you sure you want to delete this inspection?')) return
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_BASE}/inspections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      fetchInspections()
    } catch (err) {
      console.error('Error deleting inspection:', err)
      alert('Failed to delete inspection')
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      'Draft': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Draft' },
      'In Progress': { bg: 'bg-red-100', text: 'text-red-800', label: 'In Progress' },
      'Completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Draft' }, // Backward compatibility
      'IN_PROGRESS': { bg: 'bg-red-100', text: 'text-red-800', label: 'In Progress' }, // Backward compatibility
      'COMPLETED': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' }, // Backward compatibility
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      'REJECTED': { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      'Approved': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      'APPROVED': { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      'Submitted': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      'SUBMITTED': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      'QA Review': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'QA Review' },
      'QA_REVIEW': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'QA Review' },
    }
    const style = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status || 'Unknown' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    )
  }

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      'LOW': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'MEDIUM': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      'HIGH': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'CRITICAL': { bg: 'bg-red-100', text: 'text-red-800' },
    }
    const style = priorityMap[priority] || { bg: 'bg-gray-100', text: 'text-gray-800' }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        {priority || 'N/A'}
      </span>
    )
  }

  const totalInspections = inspections.length
  const draftInspections = inspections.filter(i => i.status === 'Draft' || i.status === 'In Progress').length

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {userRole === 'ADMIN' ? 'Inspections Overview' : 'My Inspections'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'ADMIN' 
              ? 'View and manage all inspections across the system' 
              : 'Manage and track your inspection workflows'}
          </p>
        </div>
        {userRole !== 'ADMIN' && (
          <button
            onClick={() => navigate('/inspection/new')}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Icons.Plus />
            New Inspection
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Inspections</p>
              <h2 className="text-3xl font-bold text-gray-900">{totalInspections}</h2>
            </div>
            <div className="p-4 bg-red-100 rounded-xl">
              <Icons.Clipboard className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Draft Inspections</p>
              <h2 className="text-3xl font-bold text-gray-900">{draftInspections}</h2>
            </div>
            <div className="p-4 bg-yellow-100 rounded-xl">
              <Icons.Clipboard className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by report number, vessel name, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading inspections...</div>
        ) : filteredInspections.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="mb-4">No inspections found</p>
            <button
              onClick={() => navigate('/inspection/new')}
              className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Create Your First Inspection
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vessel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInspections.map((inspection) => {
                  const inspectionId = inspection.inspection_id || inspection.id
                  const vesselName = inspection.equipment_tag_no || 'N/A'
                  const reportNo = `INSP-${inspectionId}`
                  const inspectionDate = inspection.inspection_date 
                    ? new Date(inspection.inspection_date).toLocaleDateString()
                    : inspection.created_at 
                    ? new Date(inspection.created_at).toLocaleDateString()
                    : 'N/A'
                  
                  // Use report status if available (it's more up-to-date than inspection status)
                  // Report status takes precedence because it reflects the actual report state
                  const currentStatus = reportStatusMap[inspectionId] || inspection.status
                  const isReportApproved = (currentStatus || '').toUpperCase() === 'APPROVED'
                  
                  return (
                    <tr key={inspectionId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reportNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vesselName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inspectionDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">User {inspection.user_id || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(inspection.priority)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(
                          // Use report status if available (it's more up-to-date)
                          // Report status takes precedence over inspection status
                          reportStatusMap[inspectionId] || inspection.status
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {/* For admins: only show view button (read-only) */}
                          {userRole === 'ADMIN' ? (
                            <button
                              onClick={() => navigate(`/inspection/${inspectionId}`)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Icons.Eye />
                            </button>
                          ) : (
                            <>
                              {/* For inspectors: show edit and delete buttons (hide delete if report is approved) */}
                              <button
                                onClick={() => navigate(`/inspection/${inspectionId}?edit=true`)}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Icons.Pencil />
                              </button>
                              {!isReportApproved && (
                                <button
                                  onClick={() => handleDelete(inspectionId, inspection.status)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Icons.Trash />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

export default MyInspections

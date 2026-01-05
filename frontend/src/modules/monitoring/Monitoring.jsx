import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { API_BASE } from '../../services/api.js'
import { RefreshCw, BarChart, AlertTriangle, TrendingUp, CheckCircle, FileText, Calendar } from 'lucide-react'

function ReportHistory() {
  const [reports, setReports] = useState([])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filters
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterEquipmentId, setFilterEquipmentId] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all') // New status filter
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch report history data from backend API
  const fetchReports = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      
      console.log('Fetching reports from backend API...')
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication required')
      }
      
      // Fetch reports from backend API
      const response = await axios.get(`${API_BASE}/reports/history/archive`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      const reportsData = response.data || []
      
      console.log('Reports fetched:', reportsData.length)
      
      // Sort by created_at descending
      const sortedReports = [...reportsData].sort((a, b) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB - dateA
      })
      
      setReports(sortedReports)
      
      // Extract unique equipment IDs for filter dropdown
      const uniqueEquipIds = [...new Set(sortedReports.map(r => r.equipment_id).filter(id => id !== null && id !== undefined))]
      
      // Fetch equipment details for unique IDs
      try {
        const equipmentPromises = uniqueEquipIds.map(async (equipId) => {
          try {
            const equipResponse = await axios.get(`${API_BASE}/equipment/${equipId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            return {
              id: equipId,
              name: `Equipment ${equipId}`,
              description: equipResponse.data?.equipment_description || 'No description available'
            }
          } catch (err) {
            console.warn(`Could not fetch equipment ${equipId}:`, err)
            return {
              id: equipId,
              name: `Equipment ${equipId}`,
              description: 'No description available'
            }
          }
        })
        
        const equipmentData = await Promise.all(equipmentPromises)
        setEquipment(equipmentData.sort((a, b) => a.id - b.id))
      } catch (equipErr) {
        console.warn('Could not fetch equipment details:', equipErr)
        // Set basic equipment list without descriptions
        setEquipment(uniqueEquipIds.map(id => ({
          id,
          name: `Equipment ${id}`,
          description: 'No description available'
        })))
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError(err.response?.data?.detail || err.message || 'Failed to load report history')
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Fetch defect types from reports (already included in report data)
  const [defectTypes, setDefectTypes] = useState({})
  
  useEffect(() => {
    if (reports.length === 0) {
      setDefectTypes({})
      return
    }
    
    // Extract defect types from reports
    const defectTypeCounts = {}
    reports.forEach(report => {
      // Check if report has defect_types_summary (JSON field)
      if (report.defect_types_summary) {
        try {
          const summary = typeof report.defect_types_summary === 'string' 
            ? JSON.parse(report.defect_types_summary) 
            : report.defect_types_summary
          
          if (typeof summary === 'object' && summary !== null) {
            Object.keys(summary).forEach(defectType => {
              defectTypeCounts[defectType] = (defectTypeCounts[defectType] || 0) + (summary[defectType] || 0)
            })
          }
        } catch (err) {
          console.warn('Error parsing defect_types_summary:', err)
        }
      }
    })
    
    console.log('Defect types extracted:', defectTypeCounts)
    setDefectTypes(defectTypeCounts)
  }, [reports])

  // Filter and search reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Search filter
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        (report.title || '').toLowerCase().includes(searchLower) ||
        (report.equipment_description || '').toLowerCase().includes(searchLower) ||
        (report.report_id || '').toLowerCase().includes(searchLower) ||
        (report.summary || '').toLowerCase().includes(searchLower)

      if (!matchesSearch) return false

      // Date filters
      if (filterStartDate) {
        const startDate = new Date(filterStartDate)
        const reportDate = new Date(report.created_at)
        if (reportDate < startDate) return false
      }

      if (filterEndDate) {
        const endDate = new Date(filterEndDate)
        endDate.setHours(23, 59, 59, 999)
        const reportDate = new Date(report.created_at)
        if (reportDate > endDate) return false
      }

      // Equipment filter
      if (filterEquipmentId !== 'all' && report.equipment_id !== parseInt(filterEquipmentId)) {
        return false
      }

      // Status filter
      if (filterStatus !== 'all') {
        // Treat any non-COMPLETED status as REJECTED for filtering
        const normalizedStatus = report.status === 'COMPLETED' ? 'COMPLETED' : 'REJECTED'
        if (normalizedStatus !== filterStatus) return false
      }

      return true
    })
  }, [reports, searchTerm, filterStartDate, filterEndDate, filterEquipmentId, filterStatus])

  // Calculate analytics
  const analytics = useMemo(() => {
    if (filteredReports.length === 0) {
      return {
        totalInspections: 0,
        totalDefects: 0,
        averageDefectsPerInspection: 0,
        defectTypeFrequency: {},
        inspectionsByEquipment: {},
        inspectionsByLocation: {},
        inspectionsByMaterial: {},
        statusBreakdown: { COMPLETED: 0, REJECTED: 0 },
        complianceRate: 0,
        upcomingInspections: 0,
        reportsByMonth: {}
      }
    }

    const defectTypeFreq = {}
    const equipmentFreq = {}
    const locationFreq = {}
    const materialFreq = {}
    const monthFreq = {}
    const statusFreq = { COMPLETED: 0, REJECTED: 0 }
    let totalDefects = 0
    let compliantReports = 0
    let upcomingCount = 0
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    filteredReports.forEach(report => {
      // Count defects
      const reportDefectCount = Object.values(report.defect_types_summary || {}).reduce((a, b) => a + b, 0)
      totalDefects += reportDefectCount

      // Status breakdown - treat any non-COMPLETED status as REJECTED
      const normalizedStatus = report.status === 'COMPLETED' ? 'COMPLETED' : 'REJECTED'
      statusFreq[normalizedStatus] = (statusFreq[normalizedStatus] || 0) + 1

      // Compliance
      if (report.api_510_compliant) compliantReports++

      // Defect types (using data from report.defect_types_summary as fallback)
      Object.entries(report.defect_types_summary || {}).forEach(([type, count]) => {
        defectTypeFreq[type] = (defectTypeFreq[type] || 0) + count
      })

      // Equipment frequency (using equipment description since we have it)
      equipmentFreq[`${report.equipment_description || `Equipment ${report.equipment_id}`} ${report.equipment_id}`] = 
        (equipmentFreq[`${report.equipment_description || `Equipment ${report.equipment_id}`} ${report.equipment_id}`] || 0) + 1
      
      // Upcoming inspections (next 30 days)
      if (report.next_inspection_due) {
        const dueDate = new Date(report.next_inspection_due)
        if (dueDate >= today && dueDate <= thirtyDaysFromNow) {
          upcomingCount++
        }
      }
      
      // Monthly frequency for trend analysis
      const reportDate = new Date(report.created_at)
      const monthYear = `${reportDate.getFullYear()}-${(reportDate.getMonth() + 1).toString().padStart(2, '0')}`
      monthFreq[monthYear] = (monthFreq[monthYear] || 0) + 1
    })

    // Use defect types from Inspection table if available, otherwise fall back to report data
    const finalDefectTypeFreq = Object.keys(defectTypes).length > 0 ? defectTypes : defectTypeFreq

    return {
      totalInspections: filteredReports.length,
      totalDefects: totalDefects,
      averageDefectsPerInspection: filteredReports.length > 0 ? (totalDefects / filteredReports.length).toFixed(2) : '0.00',
      defectTypeFrequency: finalDefectTypeFreq,
      inspectionsByEquipment: equipmentFreq,
      reportsByMonth: monthFreq,
      statusBreakdown: statusFreq,
      complianceRate: filteredReports.length > 0 ? ((compliantReports / filteredReports.length) * 100).toFixed(1) : '0.0',
      upcomingInspections: upcomingCount
    }
  }, [filteredReports, defectTypes])

 // Get top 3 most common defect types
const topDefectTypes = useMemo(() => {
  // Use dummy data for testing
  const dummyData = {
    "Scratches": 45,
    "Dents": 32,
    "Paint Chips": 28,
    "Cracks": 15,
    "Misalignment": 10
  };
  
  const sortedDefects = Object.entries(dummyData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return sortedDefects;
  
  // Original code - commented out
  /*
  if (!analytics?.defectTypeFrequency || typeof analytics.defectTypeFrequency !== 'object') {
    return [];
  }
  
  const sortedDefects = Object.entries(analytics.defectTypeFrequency)
    .filter(([defectType, count]) => 
      defectType !== undefined && 
      defectType !== null && 
      typeof count === 'number' && 
      !isNaN(count)
    )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  
  return sortedDefects;
  */
}, [analytics.defectTypeFrequency]); // Note: dependency is still there but not used with dummy data
  // Prepare data for reports trend over time
  const reportsTrendData = useMemo(() => {
    const sortedMonths = Object.keys(analytics.reportsByMonth).sort()
    const last6Months = sortedMonths.slice(-6) // Get last 6 months
    
    return last6Months.map(month => {
      const [year, monthNum] = month.split('-')
      const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short' })
      return {
        month: `${monthName} ${year}`,
        reports: analytics.reportsByMonth[month] || 0
      }
    })
  }, [analytics.reportsByMonth])

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}`
  }

  // Get status badge color
  const getStatusColor = (status) => {
    // Treat any non-COMPLETED status as REJECTED for display
    const normalizedStatus = status === 'COMPLETED' ? 'COMPLETED' : 'REJECTED'
    const colors = {
      'COMPLETED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    }
    return colors[normalizedStatus] || 'bg-gray-100 text-gray-800'
  }

  // Get status display text
  const getStatusDisplay = (status) => {
    // Treat any non-COMPLETED status as REJECTED for display
    return status === 'COMPLETED' ? 'COMPLETED' : 'REJECTED'
  }

  // Download report as PDF using saved path
  const downloadPDF = (report) => {
    if (!report.pdf_url) {
      alert('PDF not available for this report')
      return
    }

    // Create a link element and trigger download
    const link = document.createElement('a')
    link.href = report.pdf_url
    link.download = `${report.report_id}.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report History & Analytics</h1>
          <p className="text-gray-600 mt-1">Search and analyze past inspection reports</p>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Summary Analytics Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Inspections</h3>
        <p className="text-3xl font-bold text-red-600">{analytics.totalInspections}</p>
      </div>
      <div className="p-3 bg-red-50 rounded-xl">
        <BarChart className="w-6 h-6 text-red-600" />
      </div>
    </div>
  </div>

  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Defects</h3>
        <p className="text-3xl font-bold text-red-600">130</p>
      </div>
      <div className="p-3 bg-red-50 rounded-xl">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
    </div>
  </div>

  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">Avg Defects/Inspection</h3>
        <p className="text-3xl font-bold text-red-600">
          {analytics.totalInspections > 0 ? (130 / analytics.totalInspections).toFixed(2) : '0.00'}
        </p>
      </div>
      <div className="p-3 bg-red-50 rounded-xl">
        <TrendingUp className="w-6 h-6 text-red-600" />
      </div>
    </div>
  </div>

  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">Compliance Rate</h3>
        <p className="text-3xl font-bold text-green-600">{analytics.complianceRate}%</p>
      </div>
      <div className="p-3 bg-green-50 rounded-xl">
        <CheckCircle className="w-6 h-6 text-green-600" />
      </div>
    </div>
  </div>
</div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Search & Filter Reports</h2>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by report ID, title, equipment description, or summary..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
            <select
              value={filterEquipmentId}
              onChange={(e) => {
                setFilterEquipmentId(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Equipment</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>
                  Equipment {eq.id} {eq.description ? `- ${eq.description.substring(0, 30)}...` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {(searchTerm || filterStartDate || filterEndDate || filterEquipmentId !== 'all' || filterStatus !== 'all') && (
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterStartDate('')
              setFilterEndDate('')
              setFilterEquipmentId('all')
              setFilterStatus('all')
              setCurrentPage(1)
            }}
            className="mt-4 px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Common Defect Types */}
<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
  <h2 className="text-xl font-semibold mb-4 text-gray-900">Most Common Defect Types</h2>
  {topDefectTypes.length > 0 ? (
    <div className="space-y-3">
      {topDefectTypes.map(([defectType, count], index) => {
        // Calculate the max count for percentage calculation
        const maxCount = Math.max(...topDefectTypes.map(([, c]) => c));
        // Ensure minimum 5% width so very small bars are still visible
        const percentage = maxCount > 0 ? Math.max(5, (count / maxCount) * 100) : 5;
        
        return (
          <div key={defectType} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                {index + 1}
              </div>
              <span className="text-sm font-medium text-gray-700">{defectType || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-orange-500"
                  style={{
                    width: `${percentage}%`,
                    minWidth: '2px' // Ensures even very small percentages are visible
                  }}
                ></div>
              </div>
              <span className="text-sm font-bold text-gray-900 w-6 text-right">{count}</span>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <p className="text-gray-500 text-sm">No defect data available</p>
  )}
</div>

        {/* Status Distribution */}
<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
  <h2 className="text-xl font-semibold mb-4 text-gray-900">Report Status Distribution</h2>
  <div className="space-y-3">
    {['COMPLETED', 'REJECTED'].map(status => (
      <div key={status} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status}
          </span>
          
          {/* Changed to lowercase with first letter capitalized */}
          <span className="text-sm font-medium text-gray-700">
            {status === 'COMPLETED' ? 'Completed' : 'Rejected'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                status === 'COMPLETED' ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                width: `${(analytics.statusBreakdown[status] / Math.max(1, analytics.totalInspections)) * 100}%`
              }}
            ></div>
          </div>
          <span className="text-sm font-bold text-gray-900 w-6 text-right">
            {analytics.statusBreakdown[status] || 0}
          </span>
        </div>
      </div>
    ))}
  </div>
</div>
      </div>

      {/* Reports Trend Over Time */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Reports Trend Over Time</h2>
        {reportsTrendData.length > 0 ? (
          <div className="space-y-6">
            {/* Bar chart visualization */}
            <div className="flex items-end h-48 gap-4 pt-6">
              {(() => {
                const maxReports = Math.max(...reportsTrendData.map(m => m.reports))
                const maxBarHeight = 160 // Maximum height in pixels (h-48 = 192px, leaving some margin)
                const minBarHeight = 8 // Minimum height for visibility
                
                return reportsTrendData.map((monthData, index) => {
                  // Calculate height in pixels based on proportion
                  let height = 0
                  if (maxReports > 0) {
                    const proportion = monthData.reports / maxReports
                    height = Math.max(minBarHeight, proportion * maxBarHeight)
                  } else if (monthData.reports > 0) {
                    height = minBarHeight // Show at least minimum height if there are reports
                  }
                  
                  return (
                    <div key={monthData.month} className="flex-1 flex flex-col items-center">
                      <div className="text-xs text-gray-600 mb-2">{monthData.month}</div>
                      <div 
                        className="w-3/4 bg-gradient-to-t from-red-500 to-red-600 rounded-t-xl transition-all duration-300 hover:from-red-600 hover:to-red-700 flex items-end justify-center"
                        style={{ height: `${height}px`, minHeight: `${minBarHeight}px` }}
                        title={`${monthData.reports} reports`}
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
            
            {/* Data table */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly Report Count</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {reportsTrendData.map((monthData) => (
                  <div key={monthData.month} className="bg-red-50 p-3 rounded-xl">
                    <div className="text-sm font-medium text-gray-900">{monthData.month}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-red-600">{monthData.reports}</span>
                      <span className="text-xs text-gray-600">reports</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40">
            <Calendar className="w-12 h-12 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm">No trend data available</p>
          </div>
        )}
      </div>

      {/* Equipment Inspection Frequency */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Inspection Frequency by Equipment</h2>
        {Object.keys(analytics.inspectionsByEquipment).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analytics.inspectionsByEquipment)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([equipmentName, count]) => {
                // Extract ID from the end of the string
                const idMatch = equipmentName.match(/(\d+)$/);
                const equipmentId = idMatch ? idMatch[1] : '';
                
                // Extract description (remove the ID at the end)
                const description = equipmentId 
                  ? equipmentName.replace(new RegExp(`\\s*${equipmentId}$`), '').trim()
                  : equipmentName;
                
                return (
                  <div key={equipmentName} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 flex items-center">
                      <span className="truncate">{description || `Equipment ${equipmentId}`}</span>
                      <span className="text-xs text-gray-500 font-normal ml-2 shrink-0">
                        ID: {equipmentId || 'N/A'}
                      </span>
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-red-600">{count}</span>
                      <span className="text-xs text-gray-600">inspections</span>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No equipment data available</p>
        )}
      </div>

      {/* Reports Archive Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            Report Archive ({filteredReports.length} results)
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedReports.length > 0 ? (
                paginatedReports.map((report, index) => (
                  <tr key={report.report_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.report_id}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {report.inspection_id || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {report.equipment_description || `Equipment ${report.equipment_id}`}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        ID: {report.equipment_id}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(report.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {getStatusDisplay(report.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {report.report_type || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => downloadPDF(report)}
                        disabled={!report.pdf_url}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          report.pdf_url 
                            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={report.pdf_url ? "Download PDF" : "PDF not available"}
                      >
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500 text-sm">
                    No reports found. Try adjusting your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {paginatedReports.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredReports.length)} of {filteredReports.length}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded-xl transition-colors ${
                        currentPage === pageNum
                        ? 'bg-red-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportHistory

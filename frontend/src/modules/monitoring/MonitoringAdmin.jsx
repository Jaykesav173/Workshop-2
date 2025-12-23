import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../../utils/supabaseClient.js'

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
  const [filterStatus, setFilterStatus] = useState('all')
  
  // New month and year filters
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterYear, setFilterYear] = useState('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Months for dropdown
  const months = [
    { value: 'all', label: 'All Months' },
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ]

  // Generate years from 2020 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => {
    const year = 2020 + i
    return { value: year.toString(), label: year.toString() }
  })
  years.unshift({ value: 'all', label: 'All Years' })

  // Fetch report history data from Supabase - REMOVED DEMO DATA
  const fetchReports = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      
      console.log('🔄 Fetching reports and equipment from Supabase...')
      
      // First try with all necessary fields
      const { data: reportsData, error: reportsError } = await supabase
        .from('Report')
        .select(`
          report_id,
          report_number,
          inspection_id,
          title,
          equipment_id,
          created_by,
          created_at,
          inspection_date,
          next_inspection_due,
          status,
          report_type,
          summary,
          api_510_compliant,
          defect_types_summary,
          pdf_url,
          inspection_frequency
        `)
        .order('created_at', { ascending: false })
        .limit(200) // Increased limit
      
      if (reportsError) {
        console.error('Reports fetch error:', reportsError)
        throw reportsError
      }
      
      // If we got data, enrich with equipment data
      if (reportsData && reportsData.length > 0) {
        const equipmentIds = [...new Set(reportsData.map(r => r.equipment_id).filter(id => id))]
        
        let equipmentData = []
        if (equipmentIds.length > 0) {
          const { data: eqData, error: eqError } = await supabase
            .from('equipment')
            .select('id, equipment_description')
            .in('id', equipmentIds)
          
          if (eqError) console.warn('Could not fetch equipment:', eqError)
          equipmentData = eqData || []
        }
        
        const equipmentMap = new Map()
        equipmentData.forEach(eq => {
          equipmentMap.set(eq.id, {
            description: eq.equipment_description || ''
          })
        })
        
        const enrichedReports = reportsData.map(report => ({
          ...report,
          equipment_description: equipmentMap.get(report.equipment_id)?.description || 'No description available',
          // Ensure all fields have proper defaults
          defect_types_summary: report.defect_types_summary || {},
          pdf_url: report.pdf_url || null,
          summary: report.summary || '',
          inspection_frequency: report.inspection_frequency || 'N/A',
          labeled_defects: report.labeled_defects || [],
          labeled_photos: report.labeled_photos || []
        }))
        
        console.log('✅ Reports fetched:', enrichedReports.length)
        setReports(enrichedReports)
        
        // Extract unique equipment for filter dropdown
        const uniqueEquip = Array.from(equipmentMap.entries())
          .map(([id, info]) => ({ 
            id, 
            name: `Equipment ${id}`,
            description: info.description || ''
          }))
          .sort((a, b) => a.id - b.id)
        
        setEquipment(uniqueEquip)
      } else {
        setReports([])
        setEquipment([])
      }
      
      setLoading(false)
    } catch (err) {
      console.error('❌ Error fetching reports:', err)
      setError(err.message || 'Failed to load report history.')
      setLoading(false)
      
      // REMOVED DEMO DATA - set empty arrays instead
      setReports([])
      setEquipment([])
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // Filter and search reports with month/year filters
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Search filter - Handle created_by being an integer
      const searchLower = searchTerm.toLowerCase()
      
      // Convert all searchable fields to strings
      const searchableFields = [
        String(report.title || ''),
        String(report.equipment_description || ''),
        String(report.report_number || ''),
        String(report.summary || ''),
        String(report.created_by || '') // This converts integer to string
      ]
      
      const matchesSearch = searchableFields.some(field => 
        field.toLowerCase().includes(searchLower)
      )

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

      // Month filter
      if (filterMonth !== 'all') {
        const reportMonth = new Date(report.created_at).getMonth() + 1
        const reportMonthStr = reportMonth.toString().padStart(2, '0')
        if (reportMonthStr !== filterMonth) return false
      }

      // Year filter
      if (filterYear !== 'all') {
        const reportYear = new Date(report.created_at).getFullYear().toString()
        if (reportYear !== filterYear) return false
      }

      return true
    })
  }, [reports, searchTerm, filterStartDate, filterEndDate, filterEquipmentId, filterStatus, filterMonth, filterYear])

  // Fetch defect types from Inspection table - ADAPTS TO FILTERS
  const [defectTypes, setDefectTypes] = useState({})
  const [defectStats, setDefectStats] = useState({
    totalDefects: 0,
    inspectionsWithDefects: 0,
    defectRate: 0 // NEW: Percentage of inspections with defects
  })

  useEffect(() => {
    const fetchDefectData = async () => {
      try {
        console.log('🔄 Fetching defect data with current filters...')
        
        // Get the filtered inspection IDs based on current filters
        const filteredInspectionIds = filteredReports
          .map(report => report.inspection_id)
          .filter(id => id)
        
        if (filteredInspectionIds.length === 0) {
          console.log('No inspection IDs found after filtering')
          setDefectTypes({})
          setDefectStats({
            totalDefects: 0,
            inspectionsWithDefects: 0,
            defectRate: 0
          })
          return
        }
        
        // Fetch defect data only for filtered inspections
        const { data: inspectionData, error: inspectionError } = await supabase
          .from('Inspection')
          .select('inspection_id, defect_type')
          .in('inspection_id', filteredInspectionIds)
          .not('defect_type', 'is', null)
        
        if (inspectionError) {
          console.error('Error fetching Inspection data:', inspectionError)
          throw inspectionError
        }
        
        console.log('✅ Filtered inspection data fetched:', inspectionData?.length || 0)
        
        if (!inspectionData || inspectionData.length === 0) {
          console.log('No defect data found for filtered inspections')
          setDefectTypes({})
          setDefectStats({
            totalDefects: 0,
            inspectionsWithDefects: 0,
            defectRate: 0
          })
          return
        }
        
        // Calculate defect type frequencies
        const defectTypeCounts = {}
        let totalDefects = 0
        
        inspectionData.forEach(inspection => {
          if (inspection.defect_type) {
            // If defect_type is an array, count each defect
            if (Array.isArray(inspection.defect_type)) {
              inspection.defect_type.forEach(defect => {
                if (defect && typeof defect === 'string') {
                  const cleanDefect = defect.trim()
                  if (cleanDefect) {
                    defectTypeCounts[cleanDefect] = (defectTypeCounts[cleanDefect] || 0) + 1
                    totalDefects++
                  }
                }
              })
            } 
            // If defect_type is a string, count it as one defect
            else if (typeof inspection.defect_type === 'string' && inspection.defect_type.trim()) {
              const cleanDefect = inspection.defect_type.trim()
              defectTypeCounts[cleanDefect] = (defectTypeCounts[cleanDefect] || 0) + 1
              totalDefects++
            }
          }
        })
        
        console.log('📊 Filtered defect type counts:', defectTypeCounts)
        console.log('📊 Filtered total defects:', totalDefects)
        
        // Calculate inspections with defects
        const inspectionsWithDefects = new Set(
          inspectionData
            .filter(inspection => inspection.defect_type && 
              ((Array.isArray(inspection.defect_type) && inspection.defect_type.length > 0) || 
               (typeof inspection.defect_type === 'string' && inspection.defect_type.trim() !== '')))
            .map(inspection => inspection.inspection_id)
        ).size
        
        // Calculate defect rate as percentage
        // Total unique inspections in the filtered set
        const totalFilteredInspections = new Set(filteredInspectionIds).size
        const defectRate = totalFilteredInspections > 0 
          ? (inspectionsWithDefects / totalFilteredInspections) * 100
          : 0
        
        console.log('📊 Filtered inspections with defects:', inspectionsWithDefects)
        console.log('📊 Total filtered inspections:', totalFilteredInspections)
        console.log('📊 Filtered defect rate:', defectRate.toFixed(2) + '%')
        
        setDefectTypes(defectTypeCounts)
        setDefectStats({
          totalDefects,
          inspectionsWithDefects,
          defectRate
        })
        
      } catch (err) {
        console.warn('Error fetching filtered defect data:', err)
        setDefectTypes({})
        setDefectStats({
          totalDefects: 0,
          inspectionsWithDefects: 0,
          defectRate: 0
        })
      }
    }
    
    fetchDefectData()
  }, [filteredReports]) // Now depends on filteredReports instead of reports

  // Calculate analytics - UPDATED to count UNIQUE inspections
  const analytics = useMemo(() => {
    if (filteredReports.length === 0) {
      return {
        totalReports: 0,
        totalInspections: 0,
        totalDefects: defectStats.totalDefects,
        defectRate: defectStats.defectRate, // UPDATED
        defectTypeFrequency: defectTypes,
        inspectionsByEquipment: {},
        reportsByMonth: {},
        statusBreakdown: { COMPLETED: 0, REJECTED: 0 },
        complianceRate: 0,
        upcomingInspections: 0
      }
    }

    const equipmentFreq = {}
    const monthFreq = {}
    const statusFreq = { COMPLETED: 0, REJECTED: 0 }
    let compliantReports = 0
    let upcomingCount = 0
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    // Count UNIQUE inspections (distinct inspection_id values)
    const uniqueInspections = new Set()
    
    // Track reports by unique inspections for counting
    const inspectionsToReports = new Map()

    filteredReports.forEach(report => {
      // Status breakdown - treat any non-COMPLETED status as REJECTED
      const normalizedStatus = report.status === 'COMPLETED' ? 'COMPLETED' : 'REJECTED'
      statusFreq[normalizedStatus] = (statusFreq[normalizedStatus] || 0) + 1

      // Compliance - using real api_510_compliant field
      if (report.api_510_compliant) compliantReports++

      // Equipment frequency - count by inspection_id to avoid duplicate counting
      const equipmentKey = `${report.equipment_description || `Equipment ${report.equipment_id}`}`
      
      // If report has an inspection_id, track it for unique counting
      if (report.inspection_id) {
        uniqueInspections.add(report.inspection_id)
        
        // Track which equipment this inspection belongs to (first occurrence)
        if (!inspectionsToReports.has(report.inspection_id)) {
          inspectionsToReports.set(report.inspection_id, {
            equipmentKey,
            status: normalizedStatus
          })
          equipmentFreq[equipmentKey] = (equipmentFreq[equipmentKey] || 0) + 1
        }
      } else {
        // For reports without inspection_id, count equipment separately
        equipmentFreq[equipmentKey] = (equipmentFreq[equipmentKey] || 0) + 1
      }
      
      // Upcoming inspections (next 30 days)
      if (report.next_inspection_due) {
        try {
          const dueDate = new Date(report.next_inspection_due)
          if (dueDate >= today && dueDate <= thirtyDaysFromNow) {
            upcomingCount++
          }
        } catch (e) {
          console.warn('Invalid next_inspection_due date:', report.next_inspection_due)
        }
      }
      
      // Monthly frequency for trend analysis - count reports
      try {
        const reportDate = new Date(report.created_at)
        const monthYear = `${reportDate.getFullYear()}-${(reportDate.getMonth() + 1).toString().padStart(2, '0')}`
        monthFreq[monthYear] = (monthFreq[monthYear] || 0) + 1
      } catch (e) {
        console.warn('Invalid created_at date:', report.created_at)
      }
    })

    // Use defect types from state (fetched from inspection table based on filters)
    const finalDefectTypeFreq = defectTypes
    
    // Total unique inspections (count of distinct inspection_id values)
    const totalUniqueInspections = uniqueInspections.size
    
    // For reports without inspection_id, we need to add them to the total count
    const reportsWithoutInspection = filteredReports.filter(r => !r.inspection_id).length
    const totalInspections = totalUniqueInspections + reportsWithoutInspection

    return {
      totalReports: filteredReports.length,
      totalInspections: totalInspections,
      totalDefects: defectStats.totalDefects,
      defectRate: defectStats.defectRate, // UPDATED: Now percentage
      defectTypeFrequency: finalDefectTypeFreq,
      inspectionsByEquipment: equipmentFreq,
      reportsByMonth: monthFreq,
      statusBreakdown: statusFreq,
      complianceRate: filteredReports.length > 0 ? ((compliantReports / filteredReports.length) * 100).toFixed(1) : '0.0',
      upcomingInspections: upcomingCount
    }
  }, [filteredReports, defectTypes, defectStats])

  // Get top 3 most common defect types - NOW BASED ON FILTERED DATA
  const topDefectTypes = useMemo(() => {
    // Use filtered defect data from database
    const defectData = defectTypes
    
    const sortedDefects = Object.entries(defectData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    
    return sortedDefects
  }, [defectTypes])

  // Prepare data for reports trend over time - ONLY real data
  const reportsTrendData = useMemo(() => {
    const sortedMonths = Object.keys(analytics.reportsByMonth).sort()
    const last6Months = sortedMonths.slice(-6) // Get last 6 months
    
    // If no data, return empty array
    if (last6Months.length === 0) {
      return []
    }
    
    return last6Months.map(month => {
      const [year, monthNum] = month.split('-')
      const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short' })
      return {
        month: `${monthName} ${year}`,
        originalMonth: month,
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
    try {
      const date = new Date(dateString)
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${month}/${day}/${year}`
    } catch (e) {
      return 'Invalid Date'
    }
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

  // Download report as PDF
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

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('')
    setFilterStartDate('')
    setFilterEndDate('')
    setFilterEquipmentId('all')
    setFilterStatus('all')
    setFilterMonth('all')
    setFilterYear('all')
    setCurrentPage(1)
  }

  // Check if any filter is active
  const isAnyFilterActive = () => {
    return searchTerm || filterStartDate || filterEndDate || 
           filterEquipmentId !== 'all' || filterStatus !== 'all' ||
           filterMonth !== 'all' || filterYear !== 'all'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading report history...</p>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📋 Report History & Analytics</h1>
          <p className="text-gray-600 mt-1">Search and analyze past inspection reports</p>
          {error && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
              ⚠️ {error}
            </div>
          )}
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <span className={loading ? 'animate-spin' : ''}>↻</span>
          Refresh
        </button>
      </div>

      {/* Summary Analytics Cards - REAL DATA ONLY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Updated to show Total Inspections instead of Total Reports */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Inspections</h3>
              <p className="text-3xl font-bold text-blue-600">{analytics.totalInspections}</p>
            </div>
            <div className="text-4xl opacity-100">🔍</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Defects</h3>
              <p className="text-3xl font-bold text-purple-600">{analytics.totalDefects}</p>
            </div>
            <div className="text-4xl opacity-100">⚠️</div>
          </div>
        </div>

        {/* UPDATED: Changed from "Avg Defects/Inspection" to "Defect Rate" as percentage */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Defect Rate</h3>
              <p className="text-3xl font-bold text-red-600">{analytics.defectRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 mt-1">
                {defectStats.inspectionsWithDefects} of {analytics.totalInspections} inspections
              </p>
            </div>
            <div className="text-4xl opacity-100">📈</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Compliance Rate</h3>
              <p className="text-3xl font-bold text-green-600">{analytics.complianceRate}%</p>
            </div>
            <div className="text-4xl opacity-100">✅</div>
          </div>
        </div>
      </div>

      {/* Add a small info card showing total reports vs inspections */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Data Summary</p>
              <p className="text-xs text-blue-600">
                Showing {analytics.totalInspections} inspections across {analytics.totalReports} reports
                {analytics.totalReports > analytics.totalInspections && 
                  ` (some inspections have multiple reports)`}
              </p>
            </div>
          </div>
          <div className="text-sm text-blue-700 font-medium">
            Defect Rate: {analytics.defectRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Search & Filter Reports</h2>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by report ID, title, equipment description, inspector ID, or summary..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map(year => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
            <select
              value={filterEquipmentId}
              onChange={(e) => {
                setFilterEquipmentId(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Equipment</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} {eq.description ? `- ${eq.description.substring(0, 30)}` : ''}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="COMPLETED">✅ COMPLETED</option>
              <option value="REJECTED">❌ REJECTED</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {isAnyFilterActive() && (
          <button
            onClick={clearAllFilters}
            className="mt-4 px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear All Filters
          </button>
        )}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Common Defect Types - REAL DATA ONLY */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Most Common Defect Types</h2>
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
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {defectType || 'Unknown Defect'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-orange-500"
                          style={{
                            width: `${percentage}%`,
                            minWidth: '2px'
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
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-2">No defect data available</p>
              <p className="text-xs text-gray-400">Data will appear after defects are recorded in inspections</p>
            </div>
          )}
        </div>

        {/* Status Distribution - REAL DATA ONLY */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Report Status Distribution</h2>
          <div className="space-y-3">
            {['COMPLETED', 'REJECTED'].map(status => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {status === 'COMPLETED' ? '✅' : '❌'}
                  </span>
                  
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
                        width: `${(analytics.statusBreakdown[status] / Math.max(1, analytics.totalReports)) * 100}%`
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

      {/* Reports Trend Over Time - REAL DATA ONLY */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">📈 Reports Trend Over Time</h2>
        {reportsTrendData.length > 0 ? (
          <div className="space-y-6">
            {/* Bar chart visualization with FIXED HEIGHT and NO LABEL OVERLAP */}
            <div className="flex items-end h-48 gap-4 pt-6 border-b pb-4">
              {reportsTrendData.map((monthData, index) => {
                // Find the maximum value for scaling
                const maxReports = Math.max(...reportsTrendData.map(m => m.reports))
                
                // Calculate height percentage - 0% if no reports, scaled based on max
                let heightPercentage = 0
                if (maxReports > 0) {
                  // Fixed: No minimum height - each bar gets its proportional height
                  heightPercentage = (monthData.reports / maxReports) * 100
                }
                
                // Fixed: Ensure at least 5% height for visibility even for 0 values
                const finalHeight = Math.max(5, heightPercentage)
                
                return (
                  <div key={monthData.originalMonth || monthData.month} className="flex-1 flex flex-col items-center h-full">
                    {/* Value label - positioned ABOVE the bar */}
                    <div className="mb-1">
                      <div className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
                        {monthData.reports}
                      </div>
                    </div>
                    
                    {/* Bar container */}
                    <div className="relative h-full w-3/4 flex flex-col justify-end">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t-lg transition-all duration-300 hover:from-blue-600 hover:to-blue-700"
                        style={{ height: `${finalHeight}%` }}
                        title={`${monthData.reports} reports`}
                      >
                        {/* Hover text inside bar */}
                        <div className="text-xs text-white text-center opacity-0 hover:opacity-100 pt-1">
                          {monthData.reports}
                        </div>
                      </div>
                    </div>
                    
                    {/* Month label - positioned BELOW the bar with more space */}
                    <div className="mt-3 h-8 flex items-center">
                      <div className="text-xs text-gray-600 text-center leading-tight">
                        {monthData.month.split(' ')[0]}<br />
                        <span className="font-medium">{monthData.month.split(' ')[1]}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Data table */}
            <div className="pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly Report Count</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {reportsTrendData.map((monthData) => (
                  <div key={monthData.originalMonth || monthData.month} className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-900">{monthData.month}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-blue-600">{monthData.reports}</span>
                      <span className="text-xs text-gray-600">reports</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-gray-500 text-sm">No trend data available</p>
          </div>
        )}
      </div>

      {/* Equipment Inspection Frequency - REAL DATA ONLY */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Inspection Frequency by Equipment</h2>
        {Object.keys(analytics.inspectionsByEquipment).length > 0 ? (
          <div>
            {/* Equipment grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analytics.inspectionsByEquipment)
                .sort((a, b) => b[1] - a[1])
                .map(([equipmentName, count], index) => {
                  // Find the equipment ID from the original reports
                  let equipmentId = 'N/A';
                  let displayName = equipmentName;
                  
                  // Look for a report with this equipment name
                  const matchingReport = reports.find(report => {
                    // Check if the report's equipment_description matches
                    if (report.equipment_description === equipmentName) {
                      return true;
                    }
                    // Check if "Equipment X" matches
                    if (`Equipment ${report.equipment_id}` === equipmentName) {
                      return true;
                    }
                    // Check if equipment_description contains the equipmentName
                    if (report.equipment_description && 
                        report.equipment_description.includes(equipmentName)) {
                      return true;
                    }
                    return false;
                  });
                  
                  if (matchingReport) {
                    equipmentId = matchingReport.equipment_id;
                    // Use the equipment description as display name
                    displayName = matchingReport.equipment_description || `Equipment ${equipmentId}`;
                  } else {
                    // If no match found, try to extract ID from the name
                    const idMatch = equipmentName.match(/(\d+)$/); // Look for numbers at the end
                    if (idMatch) {
                      equipmentId = idMatch[1];
                      displayName = equipmentName.replace(/\s*\d+$/, '').trim() || `Equipment ${equipmentId}`;
                    }
                  }
                  
                  return (
                    <div key={`${equipmentName}-${index}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate" title={displayName}>
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-700 bg-blue-100 px-2 py-0.5 rounded font-medium">
                              ID: {equipmentId}
                            </span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              Rank #{index + 1}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <span className="text-2xl font-bold text-blue-600">{count}</span>
                          <div className="text-xs text-gray-500">inspections</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            
            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">{Object.keys(analytics.inspectionsByEquipment).length}</span> equipment items
                </div>
                <div>
                  <span className="font-medium">{analytics.totalInspections}</span> total inspections
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 opacity-50">🏭</div>
            <p className="text-gray-500 text-sm">No equipment data available</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Reports Archive Table - REAL DATA ONLY */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              📋 Report Archive ({filteredReports.length} reports)
            </h2>
            {isAnyFilterActive() && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Filtered</span>
                <button 
                  onClick={clearAllFilters}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report NO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedReports.length > 0 ? (
                paginatedReports.map((report, index) => (
                  <tr key={report.report_number} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.report_number}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{report.title}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {report.inspection_id || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {report.equipment_description || `Equipment ${report.equipment_id}`}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        ID: {report.equipment_id}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        User ID: {report.created_by || 'Unknown'}
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
                  <td colSpan="9" className="px-4 py-8 text-center text-gray-500 text-sm">
                    {reports.length === 0 ? 'No reports found in database.' : 'No reports found. Try adjusting your filters.'}
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
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
                    className={`px-3 py-1 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
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
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
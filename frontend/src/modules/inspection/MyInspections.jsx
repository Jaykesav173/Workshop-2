/**
 * My Inspections Page
 * Main list view with summary cards, search, filter, and table
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import InspectorLayout from '../../components/inspector/InspectorLayout'
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
  const [inspections, setInspections] = useState([])
  const [filteredInspections, setFilteredInspections] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [equipmentMap, setEquipmentMap] = useState({})

  useEffect(() => {
    fetchInspections()
    fetchEquipment()
  }, [])

  useEffect(() => {
    filterInspections()
  }, [searchQuery, statusFilter, inspections])

  const fetchInspections = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/inspections/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setInspections(response.data || [])
      setFilteredInspections(response.data || [])
    } catch (err) {
      console.error('Error fetching inspections:', err)
      setInspections([])
      setFilteredInspections([])
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token')
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
        filtered = filtered.filter(i => i.status === 'Draft' || i.status === 'In Progress')
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter(i => i.status === 'Completed')
      } else if (statusFilter === 'high-priority') {
        filtered = filtered.filter(i => i.priority === 'HIGH' || i.priority === 'CRITICAL' || i.priority === 'High')
      }
    }

    setFilteredInspections(filtered)
  }

  const handleDelete = async (id) => {
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
      'In Progress': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' },
      'Completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Draft' }, // Backward compatibility
      'IN_PROGRESS': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' }, // Backward compatibility
      'COMPLETED': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' }, // Backward compatibility
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
    <InspectorLayout activeMenuId="inspection">
      {/* Page Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Inspections</h1>
          <p className="text-gray-600">Manage and track your inspection workflows</p>
        </div>
        <button
          onClick={() => navigate('/inspection/new')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Icons.Plus />
          New Inspection
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Inspections</p>
              <h2 className="text-3xl font-bold text-gray-900">{totalInspections}</h2>
            </div>
            <div className="p-4 bg-blue-100 rounded-xl">
              <Icons.Clipboard className="w-8 h-8 text-blue-600" />
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="high-priority">High Priority</option>
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
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
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
                  
                  return (
                    <tr key={inspectionId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{reportNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vesselName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inspectionDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">User {inspection.user_id || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getPriorityBadge(inspection.priority)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(inspection.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/inspection/${inspectionId}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Icons.Eye />
                          </button>
                          <button
                            onClick={() => navigate(`/inspection/${inspectionId}?edit=true`)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Icons.Pencil />
                          </button>
                          <button
                            onClick={() => handleDelete(inspectionId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Icons.Trash />
                          </button>
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
    </InspectorLayout>
  )
}

export default MyInspections


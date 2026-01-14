/**
 * New Inspection Creation UI
 * Modal/form for creating new inspections
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../../services/api'

const Icons = {
  X: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
}

function NewInspection() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [equipmentList, setEquipmentList] = useState([])
  const [formData, setFormData] = useState({
    equipment_id: '',
    inspection_type: '',
    priority: 'MEDIUM',
    status: 'Draft',  // Default status - will be set automatically
    inspection_date: new Date().toISOString().split('T')[0],
    scheduled_date: '',
    due_date: '',
    next_inspection_date: '',
    findings_summary: '',  // Changed from 'summary' to match schema
    remarks_general: '',   // Changed from 'remarks' to match schema
    plant_unit_area: '',   // Plant / Unit / Area (required)
    defect_type: '',       // Defect Type (dropdown)
  })

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchEquipment()
  }, [navigate])

  const fetchEquipment = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }
      const response = await axios.get(`${API_BASE}/equipment/list`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEquipmentList(response.data || [])
    } catch (err) {
      console.error('Error fetching equipment:', err)
      if (err.response?.status === 401) {
        alert('Your session has expired. Please log in again.')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('userRole')
        navigate('/login')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        alert('You are not logged in. Please log in first.')
        navigate('/login')
        return
      }

      // Debug: Log token info (first 20 chars only for security)
      console.log('Token exists:', !!token, 'Token length:', token?.length, 'Token preview:', token?.substring(0, 20) + '...')
      console.log('Form data:', formData)

      // Prepare data matching backend schema
      // Convert date strings to ISO datetime format
      const formatDateToISO = (dateString) => {
        if (!dateString) return null
        // If it's already a full datetime string, return as-is
        if (dateString.includes('T')) return dateString
        // Convert date string (YYYY-MM-DD) to ISO datetime (YYYY-MM-DDTHH:mm:ss.sssZ)
        return new Date(dateString + 'T00:00:00').toISOString()
      }

      const inspectionData = {
        equipment_id: formData.equipment_id ? parseInt(formData.equipment_id) : null,
        inspection_date: formatDateToISO(formData.inspection_date) || new Date().toISOString(),
        inspection_type: formData.inspection_type || null,
        priority: formData.priority || null,
        status: formData.status || 'Draft',
        scheduled_date: formatDateToISO(formData.scheduled_date),
        due_date: formatDateToISO(formData.due_date),
        next_inspection_date: formatDateToISO(formData.next_inspection_date),
        findings_summary: formData.findings_summary || null,
        remarks_general: formData.remarks_general || null,
        plant_unit_area: formData.plant_unit_area || null,
        defect_type: formData.defect_type || null,
      }

      // Remove null/empty values
      Object.keys(inspectionData).forEach(key => {
        if (inspectionData[key] === null || inspectionData[key] === '') {
          delete inspectionData[key]
        }
      })

      console.log('Sending inspection data:', inspectionData)

      const response = await axios.post(
        `${API_BASE}/inspections/`,
        inspectionData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      console.log('Inspection created successfully:', response.data)
      navigate(`/inspection/${response.data.inspection_id}`)
    } catch (err) {
      console.error('Error creating inspection:', err)
      console.error('Error response:', err.response?.data)
      console.error('Error status:', err.response?.status)

      if (err.response?.status === 401) {
        const errorDetail = err.response?.data?.detail || 'Unauthorized'
        console.error('401 Error detail:', errorDetail)
        alert(`Authentication failed: ${errorDetail}\n\nPlease log in again.`)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('userRole')
        navigate('/login')
      } else {
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to create inspection. Please try again.'
        alert(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Inspection</h1>
          <p className="text-gray-600">Create a new inspection workflow</p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          {/* Vessel Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Vessel Information</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vessel <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.equipment_id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedEq = equipmentList.find(eq => eq.id.toString() === selectedId);
                    setFormData({
                      ...formData,
                      equipment_id: selectedId,
                      plant_unit_area: selectedEq?.location || ''
                    });
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Vessel</option>
                  {equipmentList.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      {eq.equipment_tag_no || eq.name || 'N/A'} - {eq.equipment_description || eq.type || ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Inspection Details */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Inspection Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.inspection_type}
                  onChange={(e) => setFormData({ ...formData, inspection_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Type</option>
                  <option value="VISUAL">Visual Inspection</option>
                  <option value="NDT">NDT Inspection</option>
                  <option value="COMPREHENSIVE">Comprehensive</option>
                  <option value="ROUTINE">Routine</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.inspection_date}
                  onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Next Inspection Date</label>
                <input
                  type="date"
                  value={formData.next_inspection_date}
                  onChange={(e) => setFormData({ ...formData, next_inspection_date: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plant / Unit / Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.plant_unit_area}
                  onChange={(e) => setFormData({ ...formData, plant_unit_area: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter plant/unit/area"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Defect Type
                </label>
                <select
                  value={formData.defect_type}
                  onChange={(e) => setFormData({ ...formData, defect_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Defect Type</option>
                  <option value="Corrosion">Corrosion</option>
                  <option value="Crack">Crack</option>
                  <option value="Damage">Damage</option>
                  <option value="Wear">Wear</option>
                  <option value="Deformation">Deformation</option>
                  <option value="Paint chip">Paint chip</option>
                  <option value="Rust">Rust</option>
                </select>
              </div>
            </div>
          </div>

          {/* Summary & Remarks */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Summary & Remarks</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Findings Summary</label>
                <textarea
                  value={formData.findings_summary}
                  onChange={(e) => setFormData({ ...formData, findings_summary: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter overall findings summary..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">General Remarks</label>
                <textarea
                  value={formData.remarks_general}
                  onChange={(e) => setFormData({ ...formData, remarks_general: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter general remarks..."
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/inspection')}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Inspection'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default NewInspection


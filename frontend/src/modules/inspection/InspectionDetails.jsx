/**
 * Inspection Details Page
 * 4-tab layout: Overview, Observations, Photos, Report
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import axios from 'axios'
import { API_BASE } from '../../services/api'
import { photoService } from '../../services/photoService'
import { reportService } from '../../services/reportService'
import observationService from '../../services/observationService'
import templateService from '../../services/templateService'

const Icons = {
  Plus: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Download: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Pencil: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Pen: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Eye: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Link: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  Undo: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  Redo: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
    </svg>
  ),
  Clear: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
}

// Templates will be fetched from backend

// QA Feedback Display Component by Inspection ID (shows all comments from all reports)
function QAFeedbackDisplayByInspection({ inspectionId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchComments = async () => {
      if (!inspectionId) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        console.log('🔍 Fetching QA comments for inspectionId:', inspectionId)
        const commentsData = await reportService.getQACommentsByInspection(inspectionId)
        console.log('✅ QA comments received:', commentsData)
        setComments(commentsData || [])
      } catch (err) {
        console.error('❌ Error fetching QA comments:', err)
        console.error('Error details:', err.response?.data)
        setError(err.response?.data?.detail || err.message || 'Failed to load comments')
        setComments([])
      } finally {
        setLoading(false)
      }
    }
    fetchComments()
  }, [inspectionId])

  if (loading) {
    return <p className="text-sm text-gray-600">Loading feedback...</p>
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">Error loading comments: {error}</p>
      </div>
    )
  }

  if (comments.length === 0) {
    return <p className="text-sm text-gray-600">No QA feedback yet.</p>
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold text-red-600">{comment.section}</span>
            <span className="text-xs text-gray-500">
              {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
            </span>
          </div>
          <p className="text-sm text-gray-700">{comment.comment}</p>
        </div>
      ))}
    </div>
  )
}

// QA Feedback Display Component
function QAFeedbackDisplay({ reportId }) {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchComments = async () => {
      if (!reportId) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        console.log('🔍 Fetching QA comments for reportId:', reportId)
        const commentsData = await reportService.getQAComments(reportId)
        console.log('✅ QA comments received:', commentsData)
        setComments(commentsData || [])
      } catch (err) {
        console.error('❌ Error fetching QA comments:', err)
        console.error('Error details:', err.response?.data)
        setError(err.response?.data?.detail || err.message || 'Failed to load comments')
        setComments([])
      } finally {
        setLoading(false)
      }
    }
    fetchComments()
  }, [reportId])

  if (loading) {
    return <p className="text-sm text-gray-600">Loading feedback...</p>
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">Error loading comments: {error}</p>
      </div>
    )
  }

  if (comments.length === 0) {
    return <p className="text-sm text-gray-600">No QA feedback yet.</p>
  }

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div key={comment.id} className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold text-red-600">{comment.section}</span>
            <span className="text-xs text-gray-500">
              {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ''}
            </span>
          </div>
          <p className="text-sm text-gray-700">{comment.comment}</p>
        </div>
      ))}
    </div>
  )
}

function InspectionDetails() {
  const { id } = useParams()
  const inspectionId = id ? parseInt(id, 10) : null
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState('overview')
  const [inspection, setInspection] = useState(null)
  const [equipment, setEquipment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  
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
  const [editFormData, setEditFormData] = useState({
    inspection_type: '',
    priority: '',
    status: '',
    inspection_date: '',
    scheduled_date: '',
    due_date: '',
    next_inspection_date: '',
    findings_summary: '',
    remarks_general: '',
    plant_unit_area: '',
    defect_type: '',
  })
  
  // Observations state
  const [observations, setObservations] = useState([])
  const [showObservationForm, setShowObservationForm] = useState(false)
  const [observationForm, setObservationForm] = useState({
    component: '',
    location: '',
    observation_type: '',
    severity: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    action_required: '',
    findings: [],
    recommendations: [],
  })
  
  // Photos state - organized by group
  const [photoGroups, setPhotoGroups] = useState({}) // { 1: [photo1, photo2], 2: [photo3], ... }
  const [selectedPhotos, setSelectedPhotos] = useState([])
  const [photoGroupNumber, setPhotoGroupNumber] = useState('')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [viewingPhoto, setViewingPhoto] = useState(null) // Photo being viewed in modal
  const [linkedPhotos, setLinkedPhotos] = useState({}) // Map of photo_id -> finding_key
  const [photoNumbers, setPhotoNumbers] = useState({}) // Map of photo_id -> photo_number (e.g., "1.1", "1.2")
  const [annotatingPhoto, setAnnotatingPhoto] = useState(null) // Photo being annotated
  const [annotatedImages, setAnnotatedImages] = useState({}) // Map of photo_id -> annotated image URL/blob

  // Template state
  const [findingTemplates, setFindingTemplates] = useState([])
  const [recommendationTemplates, setRecommendationTemplates] = useState([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateModalType, setTemplateModalType] = useState(null) // 'finding' or 'recommendation'
  const [templateModalData, setTemplateModalData] = useState({ label: '', text: '' })
  const [editingTemplateId, setEditingTemplateId] = useState(null)
  const [templateIndex, setTemplateIndex] = useState(null) // Index of finding/recommendation being edited

  // Helper function to get canonical photo key (always string for consistency)
  const getPhotoKey = (photo) => {
    if (!photo) return null
    // Try all possible ID fields, convert to string for consistency
    return String(photo.id || photo.photo_id || photo.image_id || photo.file_id || '')
  }

  // Helper function to save annotated images to localStorage
  const saveAnnotatedImagesToStorage = (images) => {
    if (!inspectionId) return
    const storageKey = `annotated_images_${inspectionId}`
    try {
      localStorage.setItem(storageKey, JSON.stringify(images))
      console.log(`💾 Saved ${Object.keys(images).length} annotated images to localStorage`)
    } catch (err) {
      console.error('Error saving annotated images to localStorage:', err)
      if (err.name === 'QuotaExceededError') {
        console.warn('⚠️ localStorage quota exceeded. Consider cleaning up old annotated images.')
      }
    }
  }

  // Load annotated images from localStorage on mount
  useEffect(() => {
    if (inspectionId) {
      const storageKey = `annotated_images_${inspectionId}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Ensure all keys are strings (localStorage returns string keys)
          const normalized = {}
          Object.keys(parsed).forEach(key => {
            normalized[String(key)] = parsed[key]
          })
          console.log(`📦 Loaded ${Object.keys(normalized).length} annotated images from localStorage for inspection ${inspectionId}`)
          console.log(`   Photo keys: ${Object.keys(normalized).join(', ')}`)
          setAnnotatedImages(normalized)
        } catch (err) {
          console.error('Error loading annotated images from localStorage:', err)
        }
      }
    }
  }, [inspectionId])

  // Save annotated images to localStorage whenever they change
  useEffect(() => {
    if (inspectionId && Object.keys(annotatedImages).length > 0) {
      // Only save data URLs (they can be large, but we need them)
      const toSave = {}
      Object.keys(annotatedImages).forEach(photoId => {
        const dataUrl = annotatedImages[photoId]
        if (dataUrl && dataUrl.startsWith('data:image/')) {
          toSave[String(photoId)] = dataUrl // Ensure keys are strings
        }
      })
      if (Object.keys(toSave).length > 0) {
        saveAnnotatedImagesToStorage(toSave)
      }
    }
  }, [annotatedImages, inspectionId])
  
  // Get current group photos based on selected group
  const currentGroupPhotos = photoGroupNumber ? (photoGroups[photoGroupNumber] || []) : []
  
  // Debug logging for currentGroupPhotos
  if (photoGroupNumber) {
    console.log(`🔍 currentGroupPhotos debug: photoGroupNumber="${photoGroupNumber}", photoGroups keys:`, Object.keys(photoGroups), `photos in group ${photoGroupNumber}:`, photoGroups[photoGroupNumber]?.length || 0)
  }
  
  // Report state
  const [report, setReport] = useState(null)
  const [generatingReport, setGeneratingReport] = useState(false)

  // Helper function to get read-only message based on status
  const getReadOnlyMessage = (action = 'perform this action') => {
    const isApproved = (report?.status === 'APPROVED' || report?.status === 'Approved' || 
                       inspection?.status === 'Approved' || inspection?.status === 'APPROVED')
    if (isApproved) {
      return `Cannot ${action}. Report is approved and inspection is locked for editing.`
    }
    return `Cannot ${action}. Report is submitted and in read-only mode.`
  }

  // Check if editing is allowed (only when report is DRAFT or doesn't exist)
  const isEditAllowed = () => {
    // Check inspection status first - if Approved, no editing allowed
    const inspectionStatus = inspection?.status
    if (inspectionStatus && (inspectionStatus === 'Approved' || inspectionStatus === 'APPROVED')) {
      return false
    }
    
    // Check inspection status for Submitted - no editing allowed
    if (inspectionStatus && (inspectionStatus === 'Submitted' || inspectionStatus === 'SUBMITTED')) {
      return false
    }
    
    if (!report) return true // No report yet, editing allowed
    const status = report.status
    // Only allow editing when status is DRAFT or REJECTED (can revise after rejection)
    return status === 'DRAFT' || status === 'Draft' || status === 'REJECTED' || status === 'Rejected'
  }

  // Check if report is submitted (read-only mode)
  const isReadOnly = () => {
    // Check inspection status first - if Approved or Submitted, read-only
    const inspectionStatus = inspection?.status
    if (inspectionStatus) {
      const statusUpper = String(inspectionStatus).toUpperCase()
      if (statusUpper === 'APPROVED' || statusUpper === 'SUBMITTED') {
        return true
      }
    }
    
    if (!report) return false
    const status = report.status
    // Read-only when SUBMITTED, QA_REVIEW, or APPROVED (case-insensitive)
    const statusUpper = String(status).toUpperCase()
    return statusUpper === 'SUBMITTED' || statusUpper === 'QA_REVIEW' || statusUpper === 'APPROVED'
  }

  useEffect(() => {
    fetchInspection()
  }, [id])

  // Refresh inspection when report status changes to sync inspection status
  useEffect(() => {
    if (report?.status) {
      // Refresh inspection to get updated status whenever report status changes
      // This ensures the Status tab and inspection list show the correct status
      fetchInspection()
    }
  }, [report?.status])

  useEffect(() => {
    // Fetch equipment by tag_no if available, or try to fetch by equipment_id for backward compatibility
    if (inspection?.equipment_tag_no) {
      // Try to fetch equipment details by tag_no
      fetchEquipmentByTag(inspection.equipment_tag_no)
    } else if (inspection?.equipment_id) {
      // Backward compatibility
      fetchEquipment(inspection.equipment_id)
    }
    
    // Fetch inspection photos (with persisted group numbers) when inspection is loaded
    // CRITICAL: Only fetch if inspection_id exists and hasn't changed
    if (inspection?.inspection_id) {
      console.log(`🔄 useEffect triggered: inspection_id=${inspection.inspection_id}`)
      fetchInspectionPhotos(inspection.inspection_id)
      fetchObservations()
      // Fetch report if it exists
      fetchReportByInspectionId(inspection.inspection_id)
    }
  }, [inspection?.inspection_id]) // Only depend on inspection_id, not entire inspection object

  // Refresh report when navigating back to this page (location.pathname changes)
  useEffect(() => {
    if (inspection?.inspection_id && location.pathname.includes(`/inspection/${id}`)) {
      // Refresh report to get latest status
      fetchReportByInspectionId(inspection.inspection_id)
    }
  }, [location.pathname, inspection?.inspection_id, id])

  const fetchInspection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/inspections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setInspection(response.data)
      // Populate edit form with current inspection data
      if (response.data) {
        setEditFormData({
          inspection_type: response.data.inspection_type || '',
          priority: response.data.priority || '',
          status: response.data.status || '',
          inspection_date: response.data.inspection_date ? new Date(response.data.inspection_date).toISOString().split('T')[0] : '',
          scheduled_date: response.data.scheduled_date ? new Date(response.data.scheduled_date).toISOString().split('T')[0] : '',
          due_date: response.data.due_date ? new Date(response.data.due_date).toISOString().split('T')[0] : '',
          next_inspection_date: response.data.next_inspection_date ? new Date(response.data.next_inspection_date).toISOString().split('T')[0] : '',
          findings_summary: response.data.findings_summary || '',
          remarks_general: response.data.remarks_general || '',
          plant_unit_area: response.data.plant_unit_area || '',
          defect_type: response.data.defect_type || '',
        })
      }
    } catch (err) {
      console.error('Error fetching inspection:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token')
      const inspectionIdToUse = inspection?.inspection_id || inspectionId || id
      
      if (!inspectionIdToUse) {
        alert('Inspection ID not found')
        return
      }

      // Prepare update data - convert date strings to ISO format
      const updateData = {
        inspection_date: editFormData.inspection_date ? new Date(editFormData.inspection_date).toISOString() : (inspection.inspection_date ? new Date(inspection.inspection_date).toISOString() : null),
        inspection_type: editFormData.inspection_type || null,
        priority: editFormData.priority || null,
        status: editFormData.status || inspection.status || 'Draft',
        scheduled_date: editFormData.scheduled_date ? new Date(editFormData.scheduled_date).toISOString() : null,
        due_date: editFormData.due_date ? new Date(editFormData.due_date).toISOString() : null,
        next_inspection_date: editFormData.next_inspection_date ? new Date(editFormData.next_inspection_date).toISOString() : null,
        findings_summary: editFormData.findings_summary || null,
        remarks_general: editFormData.remarks_general || null,
        plant_unit_area: editFormData.plant_unit_area || null,
        defect_type: editFormData.defect_type || null,
        equipment_tag_no: inspection.equipment_tag_no || null,
      }

      await axios.put(`${API_BASE}/inspections/${inspectionIdToUse}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // Refresh inspection data
      await fetchInspection()
      setShowEditModal(false)
      alert('Inspection details updated successfully!')
    } catch (err) {
      console.error('Error updating inspection:', err)
      console.error('Error response:', err.response?.data)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update inspection details. Please try again.'
      alert(errorMessage)
    }
  }

  const fetchEquipment = async (equipmentId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/equipment/${equipmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEquipment(response.data)
    } catch (err) {
      console.error('Error fetching equipment:', err)
    }
  }

  const fetchEquipmentByTag = async (equipmentTagNo) => {
    try {
      const token = localStorage.getItem('token')
      // Try to find equipment by tag_no
      const response = await axios.get(`${API_BASE}/equipment/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const found = response.data?.find(eq => eq.equipment_tag_no === equipmentTagNo)
      if (found) {
        setEquipment(found)
        // DO NOT fetch photos here - use fetchInspectionPhotos instead
        // fetchPhotos defaults everything to group 1 and will reset groups!
        // Photos are loaded via fetchInspectionPhotos which preserves group numbers
        console.log('✅ Equipment found, but skipping fetchPhotos to preserve group numbers')
      }
    } catch (err) {
      console.error('Error fetching equipment by tag:', err)
    }
  }

  const fetchReportByInspectionId = async (inspectionId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('⚠️ No token found, cannot fetch report')
        setReport(null)
        return
      }
      
      const response = await axios.get(`${API_BASE}/reports/inspection/${inspectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Handle new response format: { report: null } or { report: {...} }
      const reportData = response.data?.report !== undefined ? response.data.report : response.data
      console.log('📋 Report fetched for inspection:', reportData)
      setReport(reportData) // Set to null if not found (valid state)
    } catch (err) {
      // Report might not exist yet, which is now handled by backend returning { report: null }
      // Only log actual errors, not expected "no report" scenarios
      if (err.response?.status !== 404) {
        console.error('Error fetching report:', err)
      }
      setReport(null)
    }
  }

  // NEW: Fetch photos from InspectionPhoto table (with persisted group numbers)
  const fetchInspectionPhotos = async (inspectionId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.warn('⚠️ No token found, cannot fetch inspection photos')
        return
      }
      
      console.log(`📸 Fetching inspection photos for inspection ${inspectionId}...`)
      
      // Fetch photos with their group numbers from InspectionPhoto table
      const photos = await photoService.getInspectionPhotos(inspectionId, token)
      
      console.log(`📸 Received ${photos?.length || 0} photos from API`)
      console.log(`📸 Raw API response:`, JSON.stringify(photos, null, 2))
      
      // Organize photos by group number (from database)
      const groupedPhotos = {}
      const photoNumbersMap = {}
      const linkedPhotosMap = {}
      
      if (photos && photos.length > 0) {
        photos.forEach((photo) => {
          // CRITICAL: Ensure group_number is read correctly (handle both string and number)
          // The group_number MUST come from InspectionPhoto table, not Photo table
          let groupNum = photo.group_number
          
          console.log(`📸 Processing photo ${photo.id}:`)
          console.log(`   Raw group_number value:`, photo.group_number, `(type: ${typeof photo.group_number})`)
          console.log(`   Raw photo_number value:`, photo.photo_number)
          
          if (groupNum === null || groupNum === undefined || groupNum === '') {
            console.warn(`⚠️ Photo ${photo.id} has no group_number! Trying to infer from photo_number...`)
            // Try to infer from photo_number if group_number is missing
            if (photo.photo_number) {
              const match = photo.photo_number.match(/^(\d+)\./)
              groupNum = match ? parseInt(match[1]) : 1
              console.log(`   Inferred group_number from photo_number: ${groupNum}`)
            } else {
              groupNum = 1
              console.warn(`   ⚠️ No photo_number either, defaulting to group 1`)
            }
          }
          // Ensure it's a number, not a string
          groupNum = parseInt(groupNum) || 1
          
          const photoNumber = photo.photo_number || null
          const findingKey = photo.finding_key || null
          
          console.log(`📸 Photo ${photo.id}: FINAL group=${groupNum}, number=${photoNumber}, finding=${findingKey}`)
          
          // Store photo number
          if (photoNumber) {
            photoNumbersMap[photo.id] = photoNumber
          }
          
          // Store finding key if linked
          if (findingKey) {
            linkedPhotosMap[photo.id] = findingKey
          }
          
          // Add photo to appropriate group
          if (!groupedPhotos[groupNum]) {
            groupedPhotos[groupNum] = []
          }
          groupedPhotos[groupNum].push(photo)
        })
      } else {
        console.log('📸 No photos found in InspectionPhoto table - this is normal for new inspections')
      }
      
      // Sort photos within each group by photo_number
      Object.keys(groupedPhotos).forEach(groupNum => {
        groupedPhotos[groupNum].sort((a, b) => {
          const numA = a.photo_number || ''
          const numB = b.photo_number || ''
          return numA.localeCompare(numB, undefined, { numeric: true })
        })
      })
      
      setPhotoGroups(groupedPhotos)
      setPhotoNumbers(photoNumbersMap)
      setLinkedPhotos(linkedPhotosMap)
      
      // Auto-select the first group that has photos
      // CRITICAL: Set state immediately, don't use functional update here since we have the groupedPhotos data
      if (Object.keys(groupedPhotos).length > 0) {
        const groupsWithPhotos = Object.keys(groupedPhotos).map(g => parseInt(g)).sort((a, b) => a - b)
        const firstGroup = groupsWithPhotos[0]
        const firstGroupStr = String(firstGroup)
        
        // Check current state using a ref or direct check
        // Since we're in an async function, we need to check the current state
        setPhotoGroupNumber(currentGroup => {
          const currentGroupHasPhotos = currentGroup && groupedPhotos[currentGroup] && groupedPhotos[currentGroup].length > 0
          
          if (!currentGroupHasPhotos) {
            console.log(`📸 Auto-selecting group ${firstGroup} (has ${groupedPhotos[firstGroup].length} photos)`)
            console.log(`📸 Current photoGroupNumber state: "${currentGroup}"`)
            console.log(`📸 Setting photoGroupNumber to: "${firstGroupStr}"`)
            return firstGroupStr
          } else {
            console.log(`📸 Keeping selected group ${currentGroup} (has ${groupedPhotos[currentGroup].length} photos)`)
            return currentGroup
          }
        })
        
        // Also set it directly to ensure it's set (backup)
        // This ensures the state is set even if the functional update has issues
        setTimeout(() => {
          setPhotoGroupNumber(prev => {
            if (!prev || !groupedPhotos[prev] || groupedPhotos[prev].length === 0) {
              console.log(`📸 Backup: Setting photoGroupNumber to "${firstGroupStr}"`)
              return firstGroupStr
            }
            return prev
          })
        }, 50)
      } else {
        console.log(`📸 No groups with photos found, clearing selection`)
        setPhotoGroupNumber('')
      }
      
      // Log after state updates (use setTimeout to see final state)
      setTimeout(() => {
        console.log('📸 Loaded inspection photos:', {
          total: photos?.length || 0,
          groups: Object.keys(groupedPhotos).length,
          groupedPhotos: Object.keys(groupedPhotos).map(g => ({ group: g, count: groupedPhotos[g].length })),
          allGroups: Object.keys(groupedPhotos),
          photoGroupsState: Object.keys(groupedPhotos).reduce((acc, g) => {
            acc[g] = groupedPhotos[g].length
            return acc
          }, {})
        })
      }, 150)
    } catch (err) {
      console.error('❌ Error fetching inspection photos:', err)
      console.error('❌ Error details:', err.response?.data || err.message)
      
      // DO NOT fallback to equipment photos - that will reset groups to 1
      // Instead, just log the error and keep empty state
      console.warn('⚠️ Could not load inspection photos. Groups will be empty until photos are uploaded.')
      
      // Set empty state instead of falling back
      setPhotoGroups({})
      setPhotoNumbers({})
      setLinkedPhotos({})
    }
  }
  
  // OLD: Keep for backward compatibility (fallback) - BUT DISABLED TO PREVENT GROUP RESET
  const fetchPhotos = async (equipmentId) => {
    console.warn('⚠️ fetchPhotos (equipment-based) called - THIS SHOULD NOT HAPPEN!')
    console.warn('⚠️ This function defaults all photos to group 1 and will reset groups!')
    console.warn('⚠️ Stack trace:', new Error().stack)
    // DISABLED: This function resets all photos to group 1
    // Only use fetchInspectionPhotos which preserves group numbers
    return
    /*
    try {
      const token = localStorage.getItem('token')
      const photos = await photoService.getEquipmentPhotos(equipmentId, token)
      
      // Only use this if no inspection photos exist
      // Organize photos by group based on photo numbers
      const groupedPhotos = {}
      const existingPhotoNumbers = { ...photoNumbers }
      
      photos?.forEach((photo) => {
        // Get photo number from existing state or infer from index
        let photoNumber = existingPhotoNumbers[photo.id]
        
        if (!photoNumber) {
          // Default to group 1 for backward compatibility
          photoNumber = `1.${Object.keys(existingPhotoNumbers).length + 1}`
          existingPhotoNumbers[photo.id] = photoNumber
        }
        
        // Extract group number from photo number (e.g., "1.2" -> group 1)
        const groupMatch = photoNumber.match(/^(\d+)\./)
        const groupNum = groupMatch ? parseInt(groupMatch[1]) : 1
        
        // Add photo to appropriate group
        if (!groupedPhotos[groupNum]) {
          groupedPhotos[groupNum] = []
        }
        groupedPhotos[groupNum].push(photo)
      })
      
      setPhotoGroups(groupedPhotos)
      setPhotoNumbers(existingPhotoNumbers)
    } catch (err) {
      console.error('Error fetching photos:', err)
    }
    */
  }
  
  // Handle photo group selection change
  const handlePhotoGroupChange = (newGroup) => {
    setPhotoGroupNumber(newGroup)
    // Reset selection when switching groups
    setSelectedPhotos([])
  }

  const fetchObservations = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token || !inspection?.inspection_id) return
      
      const observationsData = await observationService.getObservations(inspection.inspection_id, token)
      // Convert API response to match frontend structure
      const formattedObservations = observationsData.map(obs => ({
        id: obs.observation_id, // Use observation_id as id for compatibility
        observation_id: obs.observation_id,
        component: obs.component,
        location: obs.location,
        observation_type: obs.observation_type,
        severity: obs.severity,
        status: obs.status,
        priority: obs.priority,
        action_required: obs.action_required,
        findings: obs.findings || [],
        recommendations: obs.recommendations || [],
        created_at: obs.created_at,
        updated_at: obs.updated_at,
      }))
      setObservations(formattedObservations)
    } catch (err) {
      console.error('Error fetching observations:', err)
      // If 404 or no observations, set empty array
      if (err.response?.status !== 404) {
        console.error('Failed to fetch observations:', err)
      }
      setObservations([])
    }
  }

  // Auto-numbering helpers - Based on observation number: 1.1, 1.2 for obs 1; 2.1, 2.2 for obs 2, etc.
  const getObservationNumber = () => {
    // If editing, find the observation index
    if (editingObservationId) {
      const obsIndex = observations.findIndex(o => 
        o.id === editingObservationId || o.observation_id === editingObservationId
      )
      if (obsIndex !== -1) {
        return obsIndex + 1
      }
    }
    // For new observation, use the next observation number
    return observations.length + 1
  }

  const getNextFindingNumber = (findings, observationNum) => {
    if (findings.length === 0) return `${observationNum}.1`
    // Get all existing finding numbers for this observation
    const existingNumbers = findings
      .map(f => {
        const parts = f.key?.split('.') || []
        if (parts.length === 2 && parseInt(parts[0]) === observationNum) {
          const sub = parseInt(parts[1])
          return sub
        }
        return null
      })
      .filter(n => n !== null && !isNaN(n))
    
    if (existingNumbers.length === 0) return `${observationNum}.1`
    
    // Find the highest sub-number and increment
    const maxSub = Math.max(...existingNumbers)
    return `${observationNum}.${maxSub + 1}`
  }

  const getNextRecommendationNumber = (recommendations, observationNum) => {
    if (recommendations.length === 0) return `${observationNum}.1`
    // Get all existing recommendation numbers for this observation
    const existingNumbers = recommendations
      .map(r => {
        const parts = r.key?.split('.') || []
        if (parts.length === 2 && parseInt(parts[0]) === observationNum) {
          const sub = parseInt(parts[1])
          return sub
        }
        return null
      })
      .filter(n => n !== null && !isNaN(n))
    
    if (existingNumbers.length === 0) return `${observationNum}.1`
    
    // Find the highest sub-number and increment
    const maxSub = Math.max(...existingNumbers)
    return `${observationNum}.${maxSub + 1}`
  }

  const handleAddFinding = () => {
    const observationNum = getObservationNumber()
    const newKey = getNextFindingNumber(observationForm.findings, observationNum)
    setObservationForm({
      ...observationForm,
      findings: [...observationForm.findings, { key: newKey, text: '' }]
    })
  }

  const handleAddRecommendation = () => {
    if (isReadOnly()) {
      alert('Cannot add recommendations. Report is submitted and in read-only mode.')
      return
    }
    const observationNum = getObservationNumber()
    const newKey = getNextRecommendationNumber(observationForm.recommendations, observationNum)
    setObservationForm({
      ...observationForm,
      recommendations: [...observationForm.recommendations, { key: newKey, text: '' }]
    })
  }

  // Fetch templates from backend
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const [findings, recommendations] = await Promise.all([
          templateService.getFindingTemplates(true),
          templateService.getRecommendationTemplates(true)
        ])
        setFindingTemplates(findings)
        setRecommendationTemplates(recommendations)
      } catch (error) {
        console.error('Error fetching templates:', error)
        // Fallback to empty arrays if fetch fails
        setFindingTemplates([])
        setRecommendationTemplates([])
      }
    }
    fetchTemplates()
  }, [])

  const handleApplyFindingTemplate = (index, templateId) => {
    if (isReadOnly()) return
    
    if (templateId === 'custom') {
      // Open custom template modal
      setTemplateModalType('finding')
      setTemplateIndex(index)
      setTemplateModalData({ label: '', text: observationForm.findings[index]?.text || '' })
      setEditingTemplateId(null)
      setShowTemplateModal(true)
      return
    }
    
    const template = findingTemplates.find(t => t.id === parseInt(templateId) || t.id === templateId)
    if (!template) return
    const updated = [...observationForm.findings]
    // Only update the text, keep the existing auto-generated key
    updated[index] = { ...updated[index], text: template.text }
    setObservationForm({ ...observationForm, findings: updated })
  }

  const handleApplyRecommendationTemplate = (index, templateId) => {
    if (isReadOnly()) return
    
    if (templateId === 'custom') {
      // Open custom template modal
      setTemplateModalType('recommendation')
      setTemplateIndex(index)
      setTemplateModalData({ label: '', text: observationForm.recommendations[index]?.text || '' })
      setEditingTemplateId(null)
      setShowTemplateModal(true)
      return
    }
    
    const template = recommendationTemplates.find(t => t.id === parseInt(templateId) || t.id === templateId)
    if (!template) return
    const updated = [...observationForm.recommendations]
    // Only update the text, keep the existing auto-generated key
    updated[index] = { ...updated[index], text: template.text }
    setObservationForm({ ...observationForm, recommendations: updated })
  }

  const handleSaveTemplate = async () => {
    if (!templateModalData.label.trim() || !templateModalData.text.trim()) {
      alert('Please provide both label and text for the template')
      return
    }

    try {
      if (editingTemplateId) {
        // Update existing template
        if (templateModalType === 'finding') {
          await templateService.updateFindingTemplate(editingTemplateId, {
            label: templateModalData.label,
            text: templateModalData.text
          })
        } else {
          await templateService.updateRecommendationTemplate(editingTemplateId, {
            label: templateModalData.label,
            text: templateModalData.text
          })
        }
      } else {
        // Create new template
        if (templateModalType === 'finding') {
          await templateService.createFindingTemplate({
            label: templateModalData.label,
            text: templateModalData.text
          })
        } else {
          await templateService.createRecommendationTemplate({
            label: templateModalData.label,
            text: templateModalData.text
          })
        }
      }

      // Refresh templates
      const [findings, recommendations] = await Promise.all([
        templateService.getFindingTemplates(true),
        templateService.getRecommendationTemplates(true)
      ])
      setFindingTemplates(findings)
      setRecommendationTemplates(recommendations)

      // Apply template to current finding/recommendation
      if (templateIndex !== null) {
        if (templateModalType === 'finding') {
          const updated = [...observationForm.findings]
          updated[templateIndex] = { ...updated[templateIndex], text: templateModalData.text }
          setObservationForm({ ...observationForm, findings: updated })
        } else {
          const updated = [...observationForm.recommendations]
          updated[templateIndex] = { ...updated[templateIndex], text: templateModalData.text }
          setObservationForm({ ...observationForm, recommendations: updated })
        }
      }

      // Close modal
      setShowTemplateModal(false)
      setTemplateModalData({ label: '', text: '' })
      setEditingTemplateId(null)
      setTemplateIndex(null)
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleEditTemplate = (template) => {
    setEditingTemplateId(template.id)
    setTemplateModalData({ label: template.label, text: template.text })
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }

    try {
      if (templateModalType === 'finding') {
        await templateService.deleteFindingTemplate(templateId)
      } else {
        await templateService.deleteRecommendationTemplate(templateId)
      }

      // Refresh templates
      const [findings, recommendations] = await Promise.all([
        templateService.getFindingTemplates(true),
        templateService.getRecommendationTemplates(true)
      ])
      setFindingTemplates(findings)
      setRecommendationTemplates(recommendations)

      // Clear form if editing the deleted template
      if (editingTemplateId === templateId) {
        setTemplateModalData({ label: '', text: '' })
        setEditingTemplateId(null)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleUseTemplate = (template) => {
    // Apply template to current finding/recommendation
    if (templateIndex !== null) {
      if (templateModalType === 'finding') {
        const updated = [...observationForm.findings]
        updated[templateIndex] = { ...updated[templateIndex], text: template.text }
        setObservationForm({ ...observationForm, findings: updated })
      } else {
        const updated = [...observationForm.recommendations]
        updated[templateIndex] = { ...updated[templateIndex], text: template.text }
        setObservationForm({ ...observationForm, recommendations: updated })
      }
    }
    // Close modal
    setShowTemplateModal(false)
    setTemplateModalData({ label: '', text: '' })
    setEditingTemplateId(null)
    setTemplateIndex(null)
  }

  const [editingObservationId, setEditingObservationId] = useState(null)

  const handleEditObservation = (obs) => {
    if (isReadOnly()) {
      alert(getReadOnlyMessage('edit observations'))
      return
    }
    // Find observation index to get its number
    const obsIndex = observations.findIndex(o => o.id === obs.id || o.observation_id === obs.observation_id)
    const observationNum = obsIndex !== -1 ? obsIndex + 1 : observations.length + 1
    
    // Ensure findings and recommendations have correct observation number in keys
    const findingsWithCorrectKeys = (obs.findings || []).map((f, idx) => {
      const parts = f.key?.split('.') || []
      const currentObsNum = parts.length === 2 ? parseInt(parts[0]) : null
      if (currentObsNum !== observationNum) {
        // Regenerate key with correct observation number
        return {
          ...f,
          key: getNextFindingNumber(obs.findings.slice(0, idx), observationNum)
        }
      }
      return f
    })
    
    const recommendationsWithCorrectKeys = (obs.recommendations || []).map((r, idx) => {
      const parts = r.key?.split('.') || []
      const currentObsNum = parts.length === 2 ? parseInt(parts[0]) : null
      if (currentObsNum !== observationNum) {
        // Regenerate key with correct observation number
        return {
          ...r,
          key: getNextRecommendationNumber(obs.recommendations.slice(0, idx), observationNum)
        }
      }
      return r
    })
    
    // Populate form with observation data
    setObservationForm({
      component: obs.component || '',
      location: obs.location || '',
      observation_type: obs.observation_type || '',
      severity: obs.severity || '',
      status: obs.status || 'OPEN',
      priority: obs.priority || 'MEDIUM',
      action_required: obs.action_required || '',
      findings: findingsWithCorrectKeys,
      recommendations: recommendationsWithCorrectKeys,
    })
    // Use observation_id if available, otherwise fall back to id
    setEditingObservationId(obs.observation_id || obs.id)
    setShowObservationForm(true)
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCreateObservation = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token || !inspection?.inspection_id) {
        alert('Please ensure you are logged in and viewing a valid inspection')
        return
      }

      const observationNum = getObservationNumber()
      
      // Ensure all findings and recommendations have auto-generated keys with correct observation number
      const findingsWithKeys = observationForm.findings.map((f, idx) => {
        // If key doesn't match observation number, regenerate it
        const parts = f.key?.split('.') || []
        const keyObsNum = parts.length === 2 ? parseInt(parts[0]) : null
        if (keyObsNum !== observationNum) {
          return {
            ...f,
            key: getNextFindingNumber(observationForm.findings.slice(0, idx), observationNum)
          }
        }
        return f
      })
      
      const recommendationsWithKeys = observationForm.recommendations.map((r, idx) => {
        // If key doesn't match observation number, regenerate it
        const parts = r.key?.split('.') || []
        const keyObsNum = parts.length === 2 ? parseInt(parts[0]) : null
        if (keyObsNum !== observationNum) {
          return {
            ...r,
            key: getNextRecommendationNumber(observationForm.recommendations.slice(0, idx), observationNum)
          }
        }
        return r
      })
      
      const observationData = {
        inspection_id: inspection.inspection_id,
        component: observationForm.component,
        location: observationForm.location,
        observation_type: observationForm.observation_type,
        severity: observationForm.severity,
        status: observationForm.status,
        priority: observationForm.priority,
        action_required: observationForm.action_required,
        findings: findingsWithKeys,
        recommendations: recommendationsWithKeys,
      }

      if (editingObservationId) {
        // Update existing observation
        const updatedObservation = await observationService.updateObservation(
          editingObservationId,
          observationData,
          token
        )
        // Refresh observations from API
        await fetchObservations()
        setEditingObservationId(null)
      } else {
        // Create new observation
        await observationService.createObservation(
          inspection.inspection_id,
          observationData,
          token
        )
        // Refresh observations from API
        await fetchObservations()
      }
      
      // Reset form
      setObservationForm({
        component: '',
        location: '',
        observation_type: '',
        severity: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        action_required: '',
        findings: [],
        recommendations: [],
      })
      setShowObservationForm(false)
    } catch (err) {
      console.error('Error saving observation:', err)
      alert('Failed to save observation. Please try again.')
    }
  }

  const handleCancelEdit = () => {
    setObservationForm({
      component: '',
      location: '',
      observation_type: '',
      severity: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      action_required: '',
      findings: [],
      recommendations: [],
    })
    setEditingObservationId(null)
    setShowObservationForm(false)
  }

  const handlePhotoUpload = async (event) => {
    // Prevent upload if read-only
    if (isReadOnly()) {
      alert(getReadOnlyMessage('upload photos'))
      event.target.value = '' // Clear file input
      return
    }

    const files = Array.from(event.target.files)
    if (files.length === 0) return

    if (!photoGroupNumber) {
      alert('Please select a photo group number first')
      event.target.value = '' // Reset file input
      return
    }

    try {
      const token = localStorage.getItem('token')
      // Use equipment.id if available, otherwise try to find it by tag_no
      const equipmentId = equipment?.id || inspection?.equipment_id
      
      const groupNum = parseInt(photoGroupNumber)
      // Get existing photos for this group to determine next number
      const existingGroupPhotos = photoGroups[groupNum] || []
      const nextSubNumber = existingGroupPhotos.length + 1
      
      // Upload all selected files and link to inspection
      const uploadedPhotos = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const response = await photoService.uploadPhoto(file, equipmentId, token)
        if (response.success && response.photo) {
          const photoNumber = `${groupNum}.${nextSubNumber + i}`
          
          // CRITICAL: Link photo to inspection with group number (persists to database)
          if (inspection?.inspection_id) {
            try {
              console.log(`🔗 Linking photo ${response.photo.id} to inspection ${inspection.inspection_id}, group ${groupNum}, number ${photoNumber}...`)
              const linkResult = await photoService.linkPhotoToInspection(
                inspection.inspection_id,
                response.photo.id,
                groupNum,
                photoNumber,
                token
              )
              console.log(`✅ Successfully linked photo ${response.photo.id}:`, linkResult)
            } catch (linkErr) {
              console.error('❌ Error linking photo to inspection:', linkErr)
              console.error('❌ Error details:', linkErr.response?.data || linkErr.message)
              alert(`Warning: Photo uploaded but failed to save group number. Error: ${linkErr.response?.data?.detail || linkErr.message}`)
              // Continue anyway - photo is uploaded, just not linked
            }
          } else {
            console.warn('⚠️ No inspection_id found - photo will not be linked to inspection')
            alert('Warning: No inspection ID found. Photo uploaded but group number will not be saved.')
          }
          
          uploadedPhotos.push({
            ...response.photo,
            group_number: groupNum,
            photo_number: photoNumber
          })
          
          // Store photo number in state
          setPhotoNumbers(prev => ({
            ...prev,
            [response.photo.id]: photoNumber
          }))
        }
      }
      
      if (uploadedPhotos.length > 0) {
        // Add photos to the current group
        setPhotoGroups(prev => ({
          ...prev,
          [groupNum]: [...(prev[groupNum] || []), ...uploadedPhotos]
        }))
      }
      
      // Reset file input
      event.target.value = ''
    } catch (err) {
      console.error('Error uploading photo:', err)
      alert('Failed to upload photo')
    }
  }

  const handleLinkPhotosToObservation = async (observationIndex) => {
    // Get the observation
    const observation = observations[observationIndex]
    if (!observation) return

    // Get selected photos with their numbers - only from current group
    const currentGroupPhotoIds = new Set(currentGroupPhotos.map(p => p.id))
    const selectedFromCurrentGroup = selectedPhotos.filter(id => currentGroupPhotoIds.has(id))
    
    const selectedPhotosWithNumbers = selectedFromCurrentGroup.map(photoId => {
      const photo = currentGroupPhotos.find(p => p.id === photoId)
      return {
        id: photoId,
        number: photoNumbers[photoId] || ''
      }
    }).filter(p => p.number) // Only include photos with numbers

    // Get findings for this observation
    const findings = observation.findings || []

    // Check if counts match
    if (selectedPhotosWithNumbers.length !== findings.length) {
      // Show warning but don't prevent linking
      alert(`Warning: Number of selected photos (${selectedPhotosWithNumbers.length}) does not match number of findings (${findings.length}) in Observation ${observationIndex + 1}. Photos will be linked based on matching numbers.`)
    }

    // Auto-link photos to findings based on matching numbers
    const newLinkedPhotos = { ...linkedPhotos }
    const token = localStorage.getItem('token')
    
    // Persist finding keys to database
    const linkPromises = selectedPhotosWithNumbers.map(async (photo) => {
      // Find finding with matching number (e.g., photo 1.1 → finding 1.1)
      let findingKey = null
      const matchingFinding = findings.find(f => f.key === photo.number)
      if (matchingFinding) {
        findingKey = matchingFinding.key
      } else {
        // If no exact match, try to link sequentially
        const photoNumParts = photo.number.split('.')
        if (photoNumParts.length === 2) {
          const photoSubNum = parseInt(photoNumParts[1])
          if (photoSubNum <= findings.length) {
            findingKey = findings[photoSubNum - 1].key
          }
        }
      }
      
      if (findingKey && inspection?.inspection_id) {
        // CRITICAL: Persist finding key to database
        try {
          await photoService.updatePhotoFindingKey(
            inspection.inspection_id,
            photo.id,
            findingKey,
            token
          )
          newLinkedPhotos[photo.id] = findingKey
          console.log(`✅ Linked photo ${photo.id} to finding ${findingKey}`)
        } catch (err) {
          console.error(`Error linking photo ${photo.id} to finding:`, err)
        }
      }
    })
    
    await Promise.all(linkPromises)
    
    setLinkedPhotos(newLinkedPhotos)
    console.log(`Linking ${selectedPhotosWithNumbers.length} photos to Observation ${observationIndex + 1}`)
    setSelectedPhotos([])
    setShowLinkModal(false)
    alert(`Photos linked to Observation ${observationIndex + 1} successfully`)
  }

  const handleViewPhoto = (photo, e) => {
    e.stopPropagation() // Prevent selection when clicking view
    setViewingPhoto(photo)
  }

  const handleDeletePhoto = async (photoId, e) => {
    e.stopPropagation() // Prevent selection when clicking delete
    
    if (isReadOnly()) {
      const statusMsg = (report?.status === 'APPROVED' || report?.status === 'Approved' || 
                        inspection?.status === 'Approved' || inspection?.status === 'APPROVED')
        ? 'Cannot delete photos. Report is approved and inspection is locked for editing.'
        : 'Cannot delete photos. Report is submitted and in read-only mode.'
      alert(statusMsg)
      return
    }
    
    if (!window.confirm('Are you sure you want to delete this photo?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      // CRITICAL: Remove photo link from inspection first (if linked)
      if (inspection?.inspection_id) {
        try {
          await photoService.deleteInspectionPhotoLink(
            inspection.inspection_id,
            photoId,
            token
          )
          console.log(`✅ Removed photo ${photoId} link from inspection ${inspection.inspection_id}`)
        } catch (linkErr) {
          console.error('Error removing photo link:', linkErr)
          // Continue with photo deletion anyway
        }
      }
      
      // Delete the photo itself
      await axios.delete(`${API_BASE}/photos/${photoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Find which group this photo belongs to
      const photoNumber = photoNumbers[photoId]
      const groupMatch = photoNumber?.match(/^(\d+)\./)
      const groupNum = groupMatch ? parseInt(groupMatch[1]) : null
      
      // Remove photo from the appropriate group
      if (groupNum && photoGroups[groupNum]) {
        setPhotoGroups(prev => ({
          ...prev,
          [groupNum]: prev[groupNum].filter(p => p.id !== photoId)
        }))
      }
      
      // Remove from selected photos if selected
      setSelectedPhotos(selectedPhotos.filter(id => id !== photoId))
      // Remove from linked photos if linked
      const newLinkedPhotos = { ...linkedPhotos }
      delete newLinkedPhotos[photoId]
      setLinkedPhotos(newLinkedPhotos)
      // Remove photo number
      const newPhotoNumbers = { ...photoNumbers }
      delete newPhotoNumbers[photoId]
      setPhotoNumbers(newPhotoNumbers)
      
      alert('Photo deleted successfully')
    } catch (err) {
      console.error('Error deleting photo:', err)
      alert('Failed to delete photo. Please try again.')
    }
  }

  const handleGenerateReport = async () => {
    // Check if report is approved and locked
    if (report?.status === 'APPROVED') {
      alert('Cannot regenerate report. Report has been approved and is locked.')
      return
    }

    

    
    setGeneratingReport(true)
    try {
      const token = localStorage.getItem('token')
      
      // Get inspection_id - CRITICAL: Must be present and valid
      const inspectionIdRaw = inspection?.inspection_id || inspection?.id
      if (!inspectionIdRaw) {
        alert('Error: Inspection ID is missing. Cannot generate report without an inspection.')
        setGeneratingReport(false)
        return
      }
      
      // Ensure inspection_id is an integer (backend expects Optional[int])
      const inspectionId = typeof inspectionIdRaw === 'string' ? parseInt(inspectionIdRaw, 10) : inspectionIdRaw
      if (isNaN(inspectionId) || inspectionId <= 0) {
        alert(`Error: Invalid Inspection ID: ${inspectionIdRaw}. Must be a positive integer.`)
        setGeneratingReport(false)
        return
      }
      
      // Collect all findings and recommendations from observations
      // Backend returns findings/recommendations with { key, text } format
      const allFindings = []
      const allRecommendations = []
      observations.forEach(obs => {
        // Findings come from backend as { key, text }
        allFindings.push(...(obs.findings || []))
        // Recommendations come from backend as { key, text }
        allRecommendations.push(...(obs.recommendations || []))
      })

      // Collect all photos from all groups and match with findings
      const reportPhotos = []
      
      // Debug: Log annotated images state
      console.log('📋 Report Generation - Annotated Images State:')
      console.log(`   Total annotated images: ${Object.keys(annotatedImages).length}`)
      console.log(`   Annotated photo IDs: ${Object.keys(annotatedImages).join(', ')}`)
      
      // Iterate through all photo groups
      Object.keys(photoGroups).forEach(groupNum => {
        const groupPhotos = photoGroups[groupNum] || []
        
        // Debug: Log all photos in this group
        console.log(`🔍 RAW PHOTO OBJECTS USED IN REPORT FOR GROUP ${groupNum}:`)
        groupPhotos.forEach(photo => {
          console.log("  Photo object:", photo)
          console.log("    - ID:", photo.id)
          console.log("    - photo_id:", photo.photo_id)
          console.log("    - storage_url:", photo.storage_url)
          console.log("    - Canonical key:", getPhotoKey(photo))
        })
        
        groupPhotos.forEach(photo => {
          // Get canonical photo key (standardized identifier)
          const photoKey = getPhotoKey(photo)
          if (!photoKey) {
            console.warn(`⚠️ Photo has no valid ID, skipping:`, photo)
            return
          }
          



          // Debug: Check if this photo has an annotated version
          console.log(`📸 Processing photo for report:`)
          console.log(`   Photo object:`, photo)
          console.log(`   Canonical key: ${photoKey}`)
          console.log(`   Available annotated keys: ${Object.keys(annotatedImages).join(', ')}`)
          
          // Get finding key from linkedPhotos or photoNumbers (check both canonical key and photo.id for compatibility)
          const findingKey = linkedPhotos[photoKey] || linkedPhotos[photo.id] || photoNumbers[photoKey] || photoNumbers[photo.id] || ''
          
          // Find matching finding and recommendation by key
          const matchingFinding = allFindings.find(f => f.key === findingKey)
          const matchingRecommendation = allRecommendations.find(r => r.key === findingKey)
          
          // Use annotated image if available - check canonical key first, then fallback to photo.id for compatibility
          const annotated = annotatedImages[photoKey] || annotatedImages[String(photo.id)] || annotatedImages[photo.id]
          
          // Get photo number for debug logging
          const photoNum = photoNumbers[photoKey] || photoNumbers[photo.id] || findingKey || 'N/A'
          
          // Determine which image to use: annotated version OR original photo
          let photoUrl = null
          let photoFilePath = null
          
          if (annotated) {
            // Use annotated image (data URL)
            photoUrl = annotated
            console.log(`✅ Using ANNOTATED image for photo key: ${photoKey} (${photoNum}) in report generation`)
            console.log(`   Photo object ID: ${photo.id}, photo_id: ${photo.photo_id}, image_id: ${photo.image_id}`)
            console.log(`   Data URL length: ${photoUrl.length} characters`)
            console.log(`   Data URL starts with: ${photoUrl.substring(0, 30)}...`)
            console.log(`   Is valid data URL: ${photoUrl.startsWith('data:image/')}`)
          } else {
            // Use original photo - get storage_url or file_path
            // Try multiple possible field names for storage_url
            photoUrl = photo.storage_url || photo.url || photo.image_url || photo.photo_url
            photoFilePath = photo.file_path || photo.path || photo.filepath
            
            // If no storage_url found, construct URL from photo ID
            if (!photoUrl && (photo.id || photo.photo_id)) {
              const photoId = photo.id || photo.photo_id || photoKey
              photoUrl = photoService.getPhotoFileUrl(photoId)
              console.log(`   Constructed photo URL from ID: ${photoUrl}`)
            }
            
            console.log(`ℹ️ Using ORIGINAL image for photo key: ${photoKey} (${photoNum})`)
            console.log(`   Photo object:`, photo)
            console.log(`   Photo object ID: ${photo.id}, photo_id: ${photo.photo_id}`)
            console.log(`   storage_url: ${photoUrl || 'N/A'}`)
            console.log(`   file_path: ${photoFilePath || 'N/A'}`)
            console.log(`   ❌ No annotated image found for key: ${photoKey}, using original`)
          }
          
          // Ensure we have a valid photo URL or file path
          if (!photoUrl && !photoFilePath) {
            console.error(`❌ Photo ${photoKey} has no storage_url or file_path, skipping`)
            console.error(`   Photo object:`, photo)
            return // Skip this photo
          }
          
          reportPhotos.push({
            finding_key: findingKey,
            finding_text: matchingFinding?.text || '',
            recommendation_text: matchingRecommendation?.text || 'Nil',
            storage_url: photoUrl, // Data URL if annotated, regular URL if original, or null
            file_path: photoFilePath, // Original file path if no annotated version
          })
        })
        
        // Debug: Log summary for this group after processing
        console.log(`✅ Finished processing group ${groupNum}: ${groupPhotos.length} photos processed`)
      })


      const equipmentTagNo = inspection.equipment_tag_no || equipment?.equipment_tag_no || equipment?.name || 'N/A'
      
      // Map inspection type to standardized code for report number
      const mapInspectionTypeToCode = (inspectionType) => {
        if (!inspectionType) return 'VI'
        const typeUpper = inspectionType.toUpperCase().trim()
        const mapping = {
          'VISUAL': 'VI',
          'VISUAL INSPECTION': 'VI',
          'NDT': 'NDT',
          'NDT INSPECTION': 'NDT',
          'COMPREHENSIVE': 'COMP',
          'ROUTINE': 'ROUT',
        }
        if (mapping[typeUpper]) return mapping[typeUpper]
        if (typeUpper.length <= 4) return typeUpper
        return 'VI'
      }
      
      // Generate report number: <PLANT>/<INSPECTION_TYPE>/<EQUIPMENT_TAG>/<TURNAROUND_CODE>
      const generateReportNumber = (plant, equipmentTag, reportDate, inspectionType) => {
        if (!plant || !equipmentTag || !reportDate) {
          return `RPT-${inspectionId}-${Date.now()}` // Fallback if required fields missing
        }
        
        // Normalize plant: remove spaces, uppercase
        const plantNormalized = plant.replace(/\s+/g, '').toUpperCase()
        
        // Map inspection type to code
        const inspectionTypeCode = mapInspectionTypeToCode(inspectionType)
        
        // Extract year from report_date for turnaround code
        let turnaroundCode
        try {
          const year = reportDate.substring(0, 4)
          if (year && year.match(/^\d{4}$/)) {
            turnaroundCode = `TA${year}`
          } else {
            turnaroundCode = `TA${new Date().getFullYear()}`
          }
        } catch (e) {
          turnaroundCode = `TA${new Date().getFullYear()}`
        }
        
        return `${plantNormalized}/${inspectionTypeCode}/${equipmentTag}/${turnaroundCode}`
      }
      
      // Get plant from inspection (required - must come from inspection creation)
      const plantValue = inspection.plant_unit_area || ''
      if (!plantValue) {
        alert('Warning: Plant/Unit/Area is missing. Please ensure it was entered during inspection creation.')
      }
      
      // Get inspection type from inspection
      const inspectionType = inspection.inspection_type || 'VISUAL'
      
      // Get report date (use inspection date or current date)
      const reportDate = inspection.inspection_date 
        ? new Date(inspection.inspection_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
      
      // Generate proper report number
      const generatedReportNo = generateReportNumber(plantValue, equipmentTagNo, reportDate, inspectionType)
      
      const reportData = {
        inspection_id: inspectionId, // CRITICAL: Include inspection_id as integer
        equipment_id: equipment?.id || inspection.equipment_id,
        header: {
          equipment_tag: equipmentTagNo,
          equipment_description: equipment?.equipment_description || '',
          plant: plantValue, // Must come from inspection.plant_unit_area
          dosh_no: equipment?.dosh_registration_no || '',
          report_no: generatedReportNo, // Properly formatted report number
          report_date: reportDate,
          inspector_name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Inspector',
          reviewed_by: '',
          client_approver: '',
          inspection_type: mapInspectionTypeToCode(inspectionType), // Include mapped inspection type
        },
        findings: allFindings, // Already in { key, text } format
        recommendations: allRecommendations, // Already in { key, text } format
        photos: reportPhotos,
        ndt_text: '',
      }

      // Debug logging: Log what we're sending
      console.log('📋 Sending report payload:', {
        inspection_id: reportData.inspection_id,
        equipment_id: reportData.equipment_id,
        header: reportData.header,
        findings_count: reportData.findings.length,
        recommendations_count: reportData.recommendations.length,
        photos_count: reportData.photos.length,
      })
      console.log('📋 Full report payload:', JSON.stringify(reportData, null, 2))

      const response = await reportService.generateReport(reportData)
      console.log('📋 Report generation response:', response)
      console.log('📋 Report ID (report_id):', response.report_id)
      
      if (!response || (!response.report_id && !response.id)) {
        throw new Error('Report generation succeeded but no report ID was returned')
      }
      
      setReport(response)
      alert('Report generated successfully!')
    } catch (err) {
      console.error('❌ Error generating report:', err)
      console.error('❌ Error response:', err.response)
      console.error('❌ Error details:', err.response?.data)
      console.error('❌ Error message:', err.message)
      
      // Extract detailed error message
      let errorMessage = 'Failed to generate report. Please try again.'
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      alert(`Failed to generate report: ${errorMessage}`)
    } finally {
      setGeneratingReport(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">Loading inspection details...</div>
    )
  }

  if (!inspection) {
    return (
      <div className="p-12 text-center text-gray-500">Inspection not found</div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/inspection')}
          className="text-red-600 hover:text-red-700 mb-4"
        >
          ← Back to Inspections
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Inspection Details - {inspection?.equipment_tag_no || equipment?.equipment_tag_no || equipment?.name || `INSP-${id}`}
        </h1>
        <p className="text-gray-600">Manage observations, photos, and generate reports</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'observations', label: 'Observations' },
              { id: 'photos', label: 'Photos' },
              { id: 'report', label: 'Report' },
              { id: 'status', label: 'Status' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Vessel Information</h3>
                  <p className="text-lg font-semibold text-gray-900">{inspection.equipment_tag_no || equipment?.equipment_tag_no || 'N/A'}</p>
                  <p className="text-sm text-gray-600 mt-1">{equipment?.equipment_description || ''}</p>
                  <p className="text-sm text-gray-600">Plant/Unit/Area: {inspection?.plant_unit_area || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Inspection Information</h3>
                  <p className="text-sm text-gray-600">Status: <span className="font-semibold">{inspection.status || 'N/A'}</span></p>
                  <p className="text-sm text-gray-600">Priority: <span className="font-semibold">{inspection.priority || 'N/A'}</span></p>
                  <p className="text-sm text-gray-600">Type: <span className="font-semibold">{inspection.inspection_type || 'N/A'}</span></p>
                  <p className="text-sm text-gray-600">Date: <span className="font-semibold">
                    {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : 'N/A'}
                  </span></p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Findings Summary</h3>
                <p className="text-gray-900">{inspection.findings_summary || inspection.summary || 'No summary available'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">General Remarks</h3>
                <p className="text-gray-900">{inspection.remarks_general || inspection.remarks || 'No remarks'}</p>
              </div>
              {inspection.defect_type && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Defect Type</h3>
                  <p className="text-gray-900">{inspection.defect_type}</p>
                </div>
              )}
              
              {/* Edit Inspection Details Button - Hidden when read-only */}
              {userRole !== 'ADMIN' && isEditAllowed() && (
                <div className="flex justify-start mt-6">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  >
                    <Icons.Pencil />
                    <span>Edit Inspection Details</span>
                  </button>
                </div>
              )}
              {userRole !== 'ADMIN' && isReadOnly() && (
                <div className={`mt-6 px-4 py-2 rounded-lg text-sm font-medium ${
                  (report?.status === 'APPROVED' || report?.status === 'Approved' || 
                   inspection?.status === 'Approved' || inspection?.status === 'APPROVED')
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {(report?.status === 'APPROVED' || report?.status === 'Approved' || 
                    inspection?.status === 'Approved' || inspection?.status === 'APPROVED')
                    ? 'Report Approved - View Only Mode (Inspection locked for editing)'
                    : 'Report Submitted - View Only Mode (Cannot edit until QA review is complete)'}
                </div>
              )}
            </div>
          )}

          {/* Observations Tab */}
          {activeTab === 'observations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Observations</h2>
                {/* Hide Add Observation button for admins and when read-only */}
                {userRole !== 'ADMIN' && isEditAllowed() && (
                  <button
                    onClick={() => {
                      if (isReadOnly()) {
                        alert(getReadOnlyMessage('add observations'))
                        return
                      }
                      setEditingObservationId(null)
                      setShowObservationForm(!showObservationForm)
                      if (!showObservationForm) {
                        // Reset form when opening for new observation
                        setObservationForm({
                          component: '',
                          location: '',
                          observation_type: '',
                          severity: '',
                          status: 'OPEN',
                          priority: 'MEDIUM',
                          action_required: '',
                          findings: [],
                          recommendations: [],
                        })
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Icons.Plus />
                    {showObservationForm ? 'Cancel' : 'Add Observation'}
                  </button>
                )}
                {userRole !== 'ADMIN' && isReadOnly() && (
                  <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl text-sm font-medium">
                    Read-only mode - Cannot add observations
                  </div>
                )}
              </div>

              {/* Observation Form */}
              {showObservationForm && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingObservationId ? 'Edit Observation' : 'Create New Observation'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Component</label>
                      <input
                        type="text"
                        value={observationForm.component}
                        onChange={(e) => setObservationForm({ ...observationForm, component: e.target.value })}
                        disabled={isReadOnly()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Component name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={observationForm.location}
                        onChange={(e) => setObservationForm({ ...observationForm, location: e.target.value })}
                        disabled={isReadOnly()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Location"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observation Type</label>
                      <select
                        value={observationForm.observation_type}
                        onChange={(e) => setObservationForm({ ...observationForm, observation_type: e.target.value })}
                        disabled={isReadOnly()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select type</option>
                        <option value="VISUAL">Visual</option>
                        <option value="NDT">NDT</option>
                        <option value="MEASUREMENT">Measurement</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                      <select
                        value={observationForm.severity}
                        onChange={(e) => setObservationForm({ ...observationForm, severity: e.target.value })}
                        disabled={isReadOnly()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select severity</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={observationForm.priority}
                        onChange={(e) => setObservationForm({ ...observationForm, priority: e.target.value })}
                        disabled={isReadOnly()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Action Required</label>
                      <select
                        value={observationForm.action_required}
                        onChange={(e) => setObservationForm({ ...observationForm, action_required: e.target.value })}
                        disabled={isReadOnly()}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select action</option>
                        <option value="REPAIR">Repair</option>
                        <option value="MONITOR">Monitor</option>
                        <option value="REPLACE">Replace</option>
                        <option value="NONE">None</option>
                      </select>
                    </div>
                  </div>

                  {/* Findings Section */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-900">Findings</h4>
                      <button
                        onClick={handleAddFinding}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        + Add Finding
                      </button>
                    </div>
                    {observationForm.findings.map((finding, idx) => (
                      <div key={idx} className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex gap-2 mb-2">
                          <div className="w-20 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm flex items-center justify-center font-semibold text-gray-700">
                            {finding.key}
                          </div>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (isReadOnly()) return
                              handleApplyFindingTemplate(idx, e.target.value)
                              e.target.selectedIndex = 0
                            }}
                            disabled={isReadOnly()}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">Select template...</option>
                            {findingTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                            <option value="custom">➕ Custom...</option>
                          </select>
                        </div>
                        <textarea
                          value={finding.text}
                          onChange={(e) => {
                            if (isReadOnly()) return
                            const updated = [...observationForm.findings]
                            updated[idx].text = e.target.value
                            setObservationForm({ ...observationForm, findings: updated })
                          }}
                          disabled={isReadOnly()}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                          rows="2"
                          placeholder="Finding text..."
                        />
                      </div>
                    ))}
                  </div>

                  {/* Recommendations Section */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-900">Recommendations</h4>
                      <button
                        onClick={() => {
                          if (isReadOnly()) {
                            alert(getReadOnlyMessage('add recommendations'))
                            return
                          }
                          handleAddRecommendation()
                        }}
                        disabled={isReadOnly()}
                        className="text-red-600 hover:text-red-700 text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        + Add Recommendation
                      </button>
                    </div>
                    {observationForm.recommendations.map((rec, idx) => (
                      <div key={idx} className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex gap-2 mb-2">
                          <div className="w-20 px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm flex items-center justify-center font-semibold text-gray-700">
                            {rec.key}
                          </div>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (isReadOnly()) return
                              handleApplyRecommendationTemplate(idx, e.target.value)
                              e.target.selectedIndex = 0
                            }}
                            disabled={isReadOnly()}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">Select template...</option>
                            {recommendationTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                            <option value="custom">➕ Custom...</option>
                          </select>
                        </div>
                        <textarea
                          value={rec.text}
                          onChange={(e) => {
                            if (isReadOnly()) return
                            const updated = [...observationForm.recommendations]
                            updated[idx].text = e.target.value
                            setObservationForm({ ...observationForm, recommendations: updated })
                          }}
                          disabled={isReadOnly()}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Recommendation text..."
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateObservation}
                      className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
                    >
                      {editingObservationId ? 'Update Observation' : 'Create Observation'}
                    </button>
                  </div>
                </div>
              )}

              {/* Observations List */}
              {observations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No observations yet. Create your first observation above.</p>
              ) : (
                <div className="space-y-4">
                  {observations.map((obs, index) => (
                    <div key={obs.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-semibold text-red-600 mb-1">Observation {index + 1}</p>
                          <h4 className="font-semibold text-gray-900">{obs.component} - {obs.location}</h4>
                          <p className="text-sm text-gray-600">Type: {obs.observation_type} | Severity: {obs.severity} | Priority: {obs.priority}</p>
                        </div>
                        {/* Hide edit/delete buttons for admins and when read-only */}
                        {userRole !== 'ADMIN' && isEditAllowed() && (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                if (isReadOnly()) {
                                  alert(getReadOnlyMessage('edit observations'))
                                  return
                                }
                                handleEditObservation(obs)
                              }}
                              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                              title="Edit observation"
                            >
                              <Icons.Pencil />
                            </button>
                            <button
                              onClick={async () => {
                                if (isReadOnly()) {
                                  alert(getReadOnlyMessage('delete observations'))
                                  return
                                }
                                if (window.confirm('Are you sure you want to delete this observation?')) {
                                  try {
                                    const token = localStorage.getItem('token')
                                    const observationId = obs.observation_id || obs.id
                                    await observationService.deleteObservation(observationId, token)
                                    // Refresh observations from API
                                    await fetchObservations()
                                  } catch (err) {
                                    console.error('Error deleting observation:', err)
                                    alert('Failed to delete observation. Please try again.')
                                  }
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete observation"
                            >
                              <Icons.Trash />
                            </button>
                          </div>
                        )}
                      </div>
                      {obs.findings.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Findings:</h5>
                          {obs.findings.map((f, idx) => (
                            <p key={idx} className="text-sm text-gray-600 ml-4">{f.key}: {f.text}</p>
                          ))}
                        </div>
                      )}
                      {obs.recommendations.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Recommendations:</h5>
                          {obs.recommendations.map((r, idx) => (
                            <p key={idx} className="text-sm text-gray-600 ml-4">{r.key}: {r.text}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Photos</h2>
                {/* Hide upload controls for admins and when read-only */}
                {userRole !== 'ADMIN' && isEditAllowed() && (
                  <div className="flex gap-2">
                    <select
                      value={photoGroupNumber}
                      onChange={(e) => handlePhotoGroupChange(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                      <option value="">Select Photo Group</option>
                      {/* Show groups that have photos OR groups based on observations (whichever is larger) */}
                      {Array.from({ 
                        length: Math.max(
                          Object.keys(photoGroups).length > 0 ? Math.max(...Object.keys(photoGroups).map(g => parseInt(g))) : 0,
                          observations.length || 1
                        )
                      }, (_, i) => i + 1).map(num => {
                        const hasPhotos = photoGroups[num] && photoGroups[num].length > 0
                        return (
                          <option key={num} value={num}>
                            Group {num} {hasPhotos ? `(${photoGroups[num].length} photos)` : ''}
                          </option>
                        )
                      })}
                    </select>
                    <label className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-2">
                      <Icons.Upload />
                      Upload Photos
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={isReadOnly()}
                      />
                    </label>
                  </div>
                )}
                {userRole !== 'ADMIN' && isReadOnly() && (
                  <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl text-sm font-medium">
                    Read-only mode - Cannot upload photos
                  </div>
                )}
              </div>

              {/* Photo Group Information Box */}
              {photoGroupNumber && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-900 mb-1">
                      Photo Group {photoGroupNumber}
                    </h4>
                    <p className="text-sm text-red-800">
                      These photos will be numbered as {photoGroupNumber}.1, {photoGroupNumber}.2, {photoGroupNumber}.3, etc.
                    </p>
                  </div>
                </div>
              )}

              {(() => {
                // Only show selected photos from current group
                const selectedFromCurrentGroup = selectedPhotos.filter(id => 
                  currentGroupPhotos.some(p => p.id === id)
                )
                return selectedFromCurrentGroup.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-red-800">{selectedFromCurrentGroup.length} photo(s) from Group {photoGroupNumber} selected</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (isReadOnly()) {
                            alert(getReadOnlyMessage('link photos'))
                            return
                          }
                          setShowLinkModal(true)
                        }}
                        disabled={isReadOnly()}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Link to Observation
                      </button>
                      <button
                        onClick={() => setSelectedPhotos([])}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* Link Modal */}
              {showLinkModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Link Photos to Observation</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {selectedPhotos.filter(id => currentGroupPhotos.some(p => p.id === id)).length} photo(s) from Group {photoGroupNumber} selected. Select an observation to auto-link photos to findings:
                    </p>
                    
                    {/* Get selected photos with numbers for count check - only from current group */}
                    {(() => {
                      // Filter selected photos to only include those from current group
                      const currentGroupPhotoIds = new Set(currentGroupPhotos.map(p => p.id))
                      const selectedFromCurrentGroup = selectedPhotos.filter(id => currentGroupPhotoIds.has(id))
                      
                      const selectedPhotosWithNumbers = selectedFromCurrentGroup.map(photoId => ({
                        id: photoId,
                        number: photoNumbers[photoId] || ''
                      })).filter(p => p.number)
                      
                      return (
                        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                          {observations.map((obs, obsIndex) => {
                            const findings = obs.findings || []
                            const photoCount = selectedPhotosWithNumbers.length
                            const findingCount = findings.length
                            const countsMatch = photoCount === findingCount
                            
                            return (
                              <div key={obs.id} className="mb-3">
                                <button
                                  onClick={() => handleLinkPhotosToObservation(obsIndex)}
                                  className={`w-full text-left px-4 py-2 border rounded-lg transition-colors ${
                                    countsMatch
                                      ? 'border-red-500 bg-red-50 hover:bg-red-100'
                                      : 'border-red-500 bg-red-50 hover:bg-red-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-gray-900">Observation {obsIndex + 1}</span>
                                    {countsMatch ? (
                                      <span className="text-xs text-green-600 font-medium">✓ Match</span>
                                    ) : (
                                      <span className="text-xs text-red-600 font-medium">⚠ Mismatch</span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <div>Component: {obs.component || 'N/A'}</div>
                                    <div className="mt-1">
                                      Photos: {photoCount} | Findings: {findingCount}
                                    </div>
                                  </div>
                                </button>
                                
                                {/* Warning if counts don't match */}
                                {!countsMatch && (
                                  <div className="mt-2 px-4 py-2 bg-red-100 border border-red-300 rounded-lg">
                                    <p className="text-xs text-red-800 font-medium">
                                      ⚠ Warning: Number of photos ({photoCount}) does not match number of findings ({findingCount})
                                    </p>
                                    <p className="text-xs text-red-700 mt-1">
                                      Photos will be linked based on matching numbers (e.g., photo 1.1 → finding 1.1)
                                    </p>
                                  </div>
                                )}
                                
                                {/* Show matching preview */}
                                {countsMatch && findings.length > 0 && (
                                  <div className="mt-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-xs text-green-800 font-medium mb-1">Auto-link preview:</p>
                                    <div className="text-xs text-green-700 space-y-0.5">
                                      {selectedPhotosWithNumbers.slice(0, 5).map((photo, idx) => {
                                        const matchingFinding = findings.find(f => f.key === photo.number)
                                        return (
                                          <div key={photo.id}>
                                            Photo {photo.number} → Finding {matchingFinding?.key || 'N/A'}
                                          </div>
                                        )
                                      })}
                                      {selectedPhotosWithNumbers.length > 5 && (
                                        <div className="text-gray-600">... and {selectedPhotosWithNumbers.length - 5} more</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                    
                    {observations.length === 0 ? (
                      <p className="text-sm text-red-600 mb-4 font-medium">⚠ No observations available. Create observations with findings first.</p>
                    ) : observations.every(o => o.findings.length === 0) ? (
                      <p className="text-sm text-red-600 mb-4 font-medium">⚠ No findings available. Add findings to observations first.</p>
                    ) : null}
                    
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowLinkModal(false)
                          setSelectedPhotos([])
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!photoGroupNumber ? (
                <p className="text-gray-500 text-center py-8">Please select a photo group to view photos.</p>
              ) : currentGroupPhotos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No photos uploaded for Group {photoGroupNumber} yet. Upload your first photo above.
                  <br />
                  <span className="text-xs text-gray-400">Debug: photoGroups keys: {Object.keys(photoGroups).join(', ') || 'none'}</span>
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="col-span-full text-xs text-gray-500 mb-2">
                    Showing {currentGroupPhotos.length} photo(s) from Group {photoGroupNumber} (Total groups: {Object.keys(photoGroups).length})
                  </div>
                  {currentGroupPhotos.map((photo) => {
                    const isLinked = linkedPhotos[photo.id]
                    const photoNumber = photoNumbers[photo.id] || ''
                    return (
                      <div
                        key={photo.id}
                        className={`relative border-2 rounded-xl overflow-hidden cursor-pointer transition-all group ${
                          selectedPhotos.includes(photo.id)
                            ? 'border-red-600 ring-2 ring-red-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          // Only allow selection of photos from current group
                          if (!photoGroupNumber) return
                          
                          if (selectedPhotos.includes(photo.id)) {
                            setSelectedPhotos(selectedPhotos.filter(id => id !== photo.id))
                          } else {
                            // Only add if photo belongs to current group
                            if (currentGroupPhotos.some(p => p.id === photo.id)) {
                              setSelectedPhotos([...selectedPhotos, photo.id])
                            }
                          }
                        }}
                      >
                        <img
                          src={annotatedImages[getPhotoKey(photo)] || annotatedImages[photo.id] || photo.storage_url || `${API_BASE}/photos/${photo.id}/file`}
                          alt="Inspection photo"
                          className="w-full h-32 object-cover"
                        />
                        
                        {/* Photo Number - Bottom Left */}
                        {photoNumber && (
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-semibold z-10">
                            {photoNumber}
                          </div>
                        )}
                        
                        {/* Linked Badge - Top Right */}
                        {isLinked && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-lg z-10">
                            <Icons.Link />
                            <span>Linked</span>
                          </div>
                        )}
                        
                        {/* Selection Checkmark */}
                        {selectedPhotos.includes(photo.id) && !isLinked && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center z-10">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        
                        {/* Hover Overlay with Action Icons */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 z-20">
                          <button
                            onClick={(e) => handleViewPhoto(photo, e)}
                            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                            title="View photo"
                          >
                            <Icons.Eye className="w-5 h-5 text-gray-800" />
                          </button>
                          {/* Hide annotate and delete buttons for admins and when read-only */}
                          {userRole !== 'ADMIN' && isEditAllowed() && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (isReadOnly()) {
                                    alert(getReadOnlyMessage('annotate photos'))
                                    return
                                  }
                                  setAnnotatingPhoto(photo)
                                }}
                                className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                                title="Annotate photo"
                              >
                                <Icons.Pen className="w-5 h-5 text-red-600" />
                              </button>
                              <button
                                onClick={(e) => handleDeletePhoto(photo.id, e)}
                                className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                                title="Delete photo"
                              >
                                <Icons.Trash className="w-5 h-5 text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Photo View Modal */}
              {viewingPhoto && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                  onClick={() => setViewingPhoto(null)}
                >
                  <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setViewingPhoto(null)}
                      className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
                    >
                      <Icons.X className="w-6 h-6 text-gray-800" />
                    </button>
                    <img
                      src={viewingPhoto.storage_url || `${API_BASE}/photos/${viewingPhoto.id}/file`}
                      alt="Full size inspection photo"
                      className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                    />
                    {photoNumbers[viewingPhoto.id] && (
                      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-lg font-semibold shadow-lg">
                        Photo {photoNumbers[viewingPhoto.id]}
                      </div>
                    )}
                    {linkedPhotos[viewingPhoto.id] && (
                      <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-lg">
                        <Icons.Link />
                        <span>Linked to Finding {linkedPhotos[viewingPhoto.id]}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Photo Annotation/Drawing Modal */}
              {annotatingPhoto && (
                <PhotoAnnotationEditor
                  photo={annotatingPhoto}
                  photoNumber={photoNumbers[annotatingPhoto.id] || ''}
                  onClose={() => setAnnotatingPhoto(null)}
                  onSave={async (annotatedImageBlob) => {
                    // Convert blob to data URL for use in reports
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      // Use canonical photo key
                      const photoKey = getPhotoKey(annotatingPhoto)
                      if (!photoKey) {
                        console.error('❌ Cannot save annotated image: photo has no valid ID')
                        alert('Error: Photo ID not found. Cannot save annotation.')
                        return
                      }
                      
                      const dataUrl = reader.result
                      console.log(`💾 Saving annotated image for photo key: ${photoKey}`)
                      console.log(`   Photo object:`, annotatingPhoto)
                      console.log(`   Data URL length: ${dataUrl.length} characters`)
                      console.log(`   Data URL preview: ${dataUrl.substring(0, 100)}...`)
                      
                      setAnnotatedImages(prev => {
                        const updated = {
                          ...prev,
                          [photoKey]: dataUrl // Use canonical key
                        }
                        console.log(`   ✅ Stored in annotatedImages with key: ${photoKey}`)
                        console.log(`   Total annotated photos: ${Object.keys(updated).length}`)
                        console.log(`   All keys: ${Object.keys(updated).join(', ')}`)
                        
                        // Save to localStorage immediately
                        saveAnnotatedImagesToStorage(updated)
                        
                        return updated
                      })
                      setAnnotatingPhoto(null)
                      alert('Photo annotated successfully! The annotated version will be saved and used in reports.')
                    }
                    reader.onerror = (error) => {
                      console.error('Error reading blob:', error)
                      alert('Failed to save annotated image. Please try again.')
                    }
                    reader.readAsDataURL(annotatedImageBlob)
                  }}
                />
              )}
            </div>
          )}

          {/* Report Tab */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Report Generation</h2>
              
              {report ? (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Report Number</p>
                    <p className="text-lg font-semibold text-gray-900">{report.report_no || report.report_id || report.id || 'N/A'}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Generated Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-600">Generated By</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Inspector'}
                    </p>
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token')
                          const reportId = report.report_id || report.id
                          if (!reportId) {
                            alert('Report ID not found')
                            return
                          }
                          console.log('📥 Downloading PDF for report_id:', reportId)
                          const blob = await reportService.exportPDF(reportId, token)
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `Report_${reportId}.pdf`
                          a.click()
                          window.URL.revokeObjectURL(url)
                        } catch (err) {
                          console.error('❌ Error downloading PDF:', err)
                          alert(`Failed to download PDF: ${err.message || 'Unknown error'}`)
                        }
                      }}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <Icons.Download />
                      Download Report
                    </button>
                    {report.status === 'DRAFT' || report.status === 'REJECTED' ? (
                      <button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
                      >
                        {generatingReport ? 'Regenerating...' : 'Regenerate Report'}
                      </button>
                    ) : null}
                    {(report.status === 'DRAFT' || report.status === 'Draft' || 
                      report.status === 'REJECTED' || report.status === 'Rejected' ||
                      report.status === 'NEEDS REVISION' || report.status === 'Needs Revision') ? (
                      <button
                        onClick={async () => {
                          try {
                            const reportId = report.report_id || report.id
                            if (!reportId) {
                              alert('Report ID not found')
                              return
                            }
                            const statusText = report.status === 'REJECTED' || report.status === 'Rejected' 
                              ? 'resubmit this rejected report' 
                              : 'submit this report for QA review'
                            if (!confirm(`Are you sure you want to ${statusText}? You will not be able to edit it until it is reviewed.`)) {
                              return
                            }
                            const updatedReport = await reportService.submitReport(reportId)
                            setReport(updatedReport)
                            alert('Report submitted successfully for QA review!')
                            // Refresh report to get updated status
                            if (inspection?.inspection_id) {
                              await fetchReportByInspectionId(inspection.inspection_id)
                            }
                            // Refresh inspection to get updated status (this will also update the Status tab)
                            await fetchInspection()
                            // Force a re-render by updating the report state again
                            if (inspection?.inspection_id) {
                              setTimeout(async () => {
                                await fetchReportByInspectionId(inspection.inspection_id)
                              }, 500)
                            }
                          } catch (err) {
                            console.error('❌ Error submitting report:', err)
                            alert(`Failed to submit report: ${err.response?.data?.detail || err.message || 'Unknown error'}`)
                          }
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Icons.FileText />
                        {report.status === 'REJECTED' || report.status === 'Rejected' ? 'Resubmit Report' : 'Submit Report'}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <p className="text-gray-600 mb-4">No report generated yet. Generate a report to include all observations and photos.</p>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400"
                  >
                    {generatingReport ? 'Generating...' : 'Generate Report'}
                  </button>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Regenerating the report will replace the previous version with updated data from observations and photos.
                </p>
              </div>

              {/* QA Feedback Section */}
              {report && (report.status === 'QA_REVIEW' || report.status === 'REJECTED' || report.status === 'APPROVED') && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">QA Feedback</h3>
                  <QAFeedbackDisplay reportId={report.report_id || report.id} />
                </div>
              )}
            </div>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Inspection Status & QA Review</h2>
              
              {/* Current Status */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h3>
                <div className="flex items-center gap-4">
                  {report ? (
                    // If report exists, show report status (prioritize report status)
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      report.status === 'APPROVED' || report.status === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'REJECTED' || report.status === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : report.status === 'SUBMITTED' || report.status === 'Submitted'
                        ? 'bg-blue-100 text-blue-800'
                        : report.status === 'QA_REVIEW' || report.status === 'QA Review'
                        ? 'bg-purple-100 text-purple-800'
                        : report.status === 'DRAFT' || report.status === 'Draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {report.status || 'Draft'}
                    </span>
                  ) : (
                    // If no report, show inspection status
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      inspection.status === 'Approved' || inspection.status === 'APPROVED'
                        ? 'bg-green-100 text-green-800'
                        : inspection.status === 'Rejected' || inspection.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : inspection.status === 'Submitted' || inspection.status === 'SUBMITTED'
                        ? 'bg-blue-100 text-blue-800'
                        : inspection.status === 'QA Review' || inspection.status === 'QA_REVIEW'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {inspection.status || 'Draft'}
                    </span>
                  )}
                </div>
              </div>

              {/* QA Comments - Show comments from all reports for this inspection */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">QA Review Comments</h3>
                {report && (
                  <div className="mb-2 text-xs text-gray-500">
                    Current Report ID: {report.report_id || report.id} | Status: {report.status}
                  </div>
                )}
                <QAFeedbackDisplayByInspection inspectionId={inspectionId || inspection?.inspection_id} />
              </div>

              {/* Status Information */}
              {report && (report.status === 'REJECTED' || report.status === 'APPROVED') && (
                <div className={`rounded-xl p-6 border ${
                  report.status === 'APPROVED'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {report.status === 'APPROVED' ? (
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Report {report.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                      </h4>
                      <p className="text-sm text-gray-700 mb-2">
                        {report.status === 'APPROVED'
                          ? 'This report has been approved by QA. The inspection is complete and locked for editing.'
                          : 'This report has been rejected by QA. Please review the comments above and make necessary revisions.'}
                      </p>
                      {report.updated_at && (
                        <p className="text-xs text-gray-500">
                          {report.status === 'APPROVED' ? 'Approved' : 'Rejected'} on: {new Date(report.updated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Inspection Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Inspection Details</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icons.X />
              </button>
            </div>

            <div className="space-y-6">
              {/* Inspection Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspection Type
                </label>
                <select
                  value={editFormData.inspection_type}
                  onChange={(e) => setEditFormData({ ...editFormData, inspection_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select type</option>
                  <option value="Visual Inspection">Visual Inspection</option>
                  <option value="NDT">NDT</option>
                  <option value="Comprehensive">Comprehensive</option>
                  <option value="Routine">Routine</option>
                </select>
              </div>

              {/* Priority and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select priority</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inspection Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.inspection_date}
                    onChange={(e) => setEditFormData({ ...editFormData, inspection_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.scheduled_date}
                    onChange={(e) => setEditFormData({ ...editFormData, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.due_date}
                    onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Next Inspection Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.next_inspection_date}
                    onChange={(e) => setEditFormData({ ...editFormData, next_inspection_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Plant/Unit/Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plant/Unit/Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.plant_unit_area}
                  onChange={(e) => setEditFormData({ ...editFormData, plant_unit_area: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Plant 1, Unit A"
                />
              </div>

              {/* Findings Summary */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Findings Summary
                </label>
                <textarea
                  value={editFormData.findings_summary}
                  onChange={(e) => setEditFormData({ ...editFormData, findings_summary: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter findings summary..."
                />
              </div>

              {/* General Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  General Remarks
                </label>
                <textarea
                  value={editFormData.remarks_general}
                  onChange={(e) => setEditFormData({ ...editFormData, remarks_general: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter general remarks..."
                />
              </div>

              {/* Defect Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Defect Type
                </label>
                <input
                  type="text"
                  value={editFormData.defect_type}
                  onChange={(e) => setEditFormData({ ...editFormData, defect_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter defect type..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                {templateModalType === 'finding' ? 'Finding' : 'Recommendation'} Templates
              </h3>
              <button
                onClick={() => {
                  setShowTemplateModal(false)
                  setTemplateModalData({ label: '', text: '' })
                  setEditingTemplateId(null)
                  setTemplateIndex(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icons.X />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Left: Existing Templates List */}
              <div className="border-r pr-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Existing Templates
                </h4>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {(templateModalType === 'finding' ? findingTemplates : recommendationTemplates).map((template) => (
                    <div
                      key={template.id}
                      onDoubleClick={() => handleUseTemplate(template)}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-red-300 transition-colors cursor-pointer"
                      title="Double-click to use this template"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900 text-sm">{template.label}</h5>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditTemplate(template)
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit template"
                          >
                            <Icons.Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteTemplate(template.id)
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete template"
                          >
                            <Icons.Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">{template.text}</p>
                    </div>
                  ))}
                  {((templateModalType === 'finding' ? findingTemplates : recommendationTemplates).length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">No templates yet. Create one below.</p>
                  )}
                </div>
              </div>

              {/* Right: Create/Edit Form */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  {editingTemplateId ? 'Edit' : 'Create New'} Template
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Label
                    </label>
                    <input
                      type="text"
                      value={templateModalData.label}
                      onChange={(e) => setTemplateModalData({ ...templateModalData, label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g., External - Coating condition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Text
                    </label>
                    <textarea
                      value={templateModalData.text}
                      onChange={(e) => setTemplateModalData({ ...templateModalData, text: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows="6"
                      placeholder="Enter the template text..."
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                    {editingTemplateId && (
                      <button
                        onClick={() => {
                          setTemplateModalData({ label: '', text: '' })
                          setEditingTemplateId(null)
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowTemplateModal(false)
                        setTemplateModalData({ label: '', text: '' })
                        setEditingTemplateId(null)
                        setTemplateIndex(null)
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleSaveTemplate}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      {editingTemplateId ? 'Update' : 'Save'} Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Photo Annotation Editor Component
function PhotoAnnotationEditor({ photo, photoNumber, onClose, onSave }) {
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const [drawingMode, setDrawingMode] = useState('freehand') // freehand, circle, line, arrow, box
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [color, setColor] = useState('#FF0000') // Red color
  const [lineWidth, setLineWidth] = useState(3)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [loadingError, setLoadingError] = useState(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas ref is null')
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Could not get 2d context')
      return
    }

    // Load image as blob to avoid CORS issues
    const loadImage = async () => {
      try {
        const token = localStorage.getItem('token')
        const photoUrl = photo.storage_url || `${API_BASE}/photos/${photo.id}/file`
        
        // If it's already a data URL, use it directly
        if (photoUrl.startsWith('data:image/')) {
          const img = new Image()
          img.onload = () => {
            drawImageOnCanvas(img, ctx, canvas)
          }
          img.onerror = (error) => {
            console.error('Error loading data URL image:', error)
            setLoadingError('Failed to load image.')
            setImageLoaded(false)
          }
          img.src = photoUrl
          return
        }
        
        // Otherwise, fetch as blob with authentication
        console.log('Fetching image as blob from:', photoUrl)
        try {
          const response = await axios.get(photoUrl, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/octet-stream'
            },
            responseType: 'blob',
            timeout: 30000  // 30 second timeout
          })
          
          if (!response.data || response.data.size === 0) {
            throw new Error('Received empty image data')
          }
          
          const imageBlob = response.data
          const imageUrl = URL.createObjectURL(imageBlob)
          
          const img = new Image()
          img.crossOrigin = 'anonymous'  // Enable CORS for canvas operations
          
          img.onload = () => {
            try {
              drawImageOnCanvas(img, ctx, canvas)
              // Clean up object URL after loading
              URL.revokeObjectURL(imageUrl)
            } catch (drawError) {
              console.error('Error drawing image on canvas:', drawError)
              setLoadingError(`Failed to draw image: ${drawError.message}`)
              setImageLoaded(false)
              URL.revokeObjectURL(imageUrl)
            }
          }
          
          img.onerror = (error) => {
            console.error('Error loading image from blob:', error)
            setLoadingError('Failed to load image from server. Please check if the image file exists.')
            setImageLoaded(false)
            URL.revokeObjectURL(imageUrl)
          }
          
          img.src = imageUrl
        } catch (fetchError) {
          console.error('Error fetching image blob:', fetchError)
          // Try fallback: load image directly (may have CORS issues but worth trying)
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            try {
              drawImageOnCanvas(img, ctx, canvas)
            } catch (drawError) {
              setLoadingError(`Failed to load image: ${fetchError.message || 'Unknown error'}. Please ensure the photo file exists on the server.`)
              setImageLoaded(false)
            }
          }
          img.onerror = () => {
            setLoadingError(`Failed to load image: ${fetchError.message || 'Unknown error'}. Please check the photo URL and server connection.`)
            setImageLoaded(false)
          }
          // Try loading with token in URL (if backend supports it)
          img.src = `${photoUrl}${photoUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token || '')}`
        }
        
      } catch (error) {
        console.error('Error fetching image:', error)
        setLoadingError(`Failed to load image: ${error.message || 'Unknown error'}`)
        setImageLoaded(false)
      }
    }
    
    const drawImageOnCanvas = (img, ctx, canvas) => {
      console.log('Image loaded successfully:', img.width, 'x', img.height)
      setImageLoaded(true)
      setLoadingError(null)
      
      // Calculate display size (max 1200px width or height, maintain aspect ratio)
      const maxDisplaySize = 1200
      let displayWidth = img.width
      let displayHeight = img.height
      
      if (img.width > maxDisplaySize || img.height > maxDisplaySize) {
        const scale = Math.min(maxDisplaySize / img.width, maxDisplaySize / img.height)
        displayWidth = Math.floor(img.width * scale)
        displayHeight = Math.floor(img.height * scale)
      }
      
      // Set canvas internal size to match image (for high quality)
      canvas.width = img.width
      canvas.height = img.height
      
      // Set canvas display size (CSS) - this controls how it appears on screen
      canvas.style.width = displayWidth + 'px'
      canvas.style.height = displayHeight + 'px'
      
      // Draw image on canvas at full resolution
      ctx.drawImage(img, 0, 0, img.width, img.height)
      
      // Draw photo number label on top-left corner
      if (photoNumber) {
        const labelX = 10
        const labelY = 10
        const labelWidth = 60
        const labelHeight = 25
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight)
        ctx.fillStyle = 'white'
        ctx.font = 'bold 14px Arial'
        ctx.fillText(photoNumber, labelX + 5, labelY + 18)
      }
      
      // Save initial state
      saveState()
      
      // Store image reference
      imageRef.current = img
      console.log('Canvas initialized:', canvas.width, 'x', canvas.height, 'display:', displayWidth, 'x', displayHeight)
    }
    
    loadImage()
  }, [photo, photoNumber])

  const saveState = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const state = canvas.toDataURL('image/png')
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(state)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(imageRef.current, 0, 0)
        // Redraw photo number label
        if (photoNumber) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.fillRect(10, 10, 60, 25)
          ctx.fillStyle = 'white'
          ctx.font = 'bold 14px Arial'
          ctx.fillText(photoNumber, 15, 28)
        }
        ctx.drawImage(img, 0, 0)
      }
      img.src = history[historyIndex - 1]
      setHistoryIndex(historyIndex - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(imageRef.current, 0, 0)
        // Redraw photo number label
        if (photoNumber) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
          ctx.fillRect(10, 10, 60, 25)
          ctx.fillStyle = 'white'
          ctx.font = 'bold 14px Arial'
          ctx.fillText(photoNumber, 15, 28)
        }
        ctx.drawImage(img, 0, 0)
      }
      img.src = history[historyIndex + 1]
      setHistoryIndex(historyIndex + 1)
    }
  }

  const clearDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return
    
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height)
    
    // Redraw photo number label (scaled)
    if (photoNumber) {
      const scaleX = canvas._scaleX || 1
      const scaleY = canvas._scaleY || 1
      const labelX = 10 * scaleX
      const labelY = 10 * scaleY
      const labelWidth = 60 * scaleX
      const labelHeight = 25 * scaleY
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight)
      ctx.fillStyle = 'white'
      ctx.font = `bold ${14 * scaleY}px Arial`
      ctx.fillText(photoNumber, labelX + 5 * scaleX, labelY + 18 * scaleY)
    }
    saveState()
  }

  const getMousePos = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    // Canvas internal size vs display size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  const handleMouseDown = (e) => {
    setIsDrawing(true)
    const pos = getMousePos(e)
    setStartPos(pos)
  }

  const handleMouseMove = (e) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!canvas || !ctx) return
    
    const currentPos = getMousePos(e)
    
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    if (drawingMode === 'freehand') {
      ctx.beginPath()
      ctx.moveTo(startPos.x, startPos.y)
      ctx.lineTo(currentPos.x, currentPos.y)
      ctx.stroke()
      setStartPos(currentPos)
    }
  }

  const handleMouseUp = (e) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!canvas || !ctx) return
    
    const endPos = getMousePos(e)
    
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = lineWidth
    
    if (drawingMode === 'circle') {
      const radius = Math.sqrt(Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2))
      ctx.beginPath()
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (drawingMode === 'line') {
      ctx.beginPath()
      ctx.moveTo(startPos.x, startPos.y)
      ctx.lineTo(endPos.x, endPos.y)
      ctx.stroke()
    } else if (drawingMode === 'arrow') {
      // Draw arrow
      const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x)
      ctx.beginPath()
      ctx.moveTo(startPos.x, startPos.y)
      ctx.lineTo(endPos.x, endPos.y)
      ctx.lineTo(endPos.x - 10 * Math.cos(angle - Math.PI / 6), endPos.y - 10 * Math.sin(angle - Math.PI / 6))
      ctx.moveTo(endPos.x, endPos.y)
      ctx.lineTo(endPos.x - 10 * Math.cos(angle + Math.PI / 6), endPos.y - 10 * Math.sin(angle + Math.PI / 6))
      ctx.stroke()
    } else if (drawingMode === 'box') {
      ctx.strokeRect(startPos.x, startPos.y, endPos.x - startPos.x, endPos.y - startPos.y)
    }
    
    setIsDrawing(false)
    saveState()
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    // Ensure photo number label is on top (red box style to match report)
    const ctx = canvas.getContext('2d')
    if (photoNumber) {
      // Draw red box with white text (matching report style)
      const labelX = 10
      const labelY = 10
      const labelWidth = 60
      const labelHeight = 25
      
      // Red background box
      ctx.fillStyle = '#FF0000'
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight)
      
      // White text
      ctx.fillStyle = 'white'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(photoNumber, labelX + labelWidth / 2, labelY + labelHeight / 2)
    }
    
    // Export as high-quality PNG
    canvas.toBlob((blob) => {
      if (blob) {
        onSave(blob)
      } else {
        console.error('Failed to create blob from canvas')
        alert('Failed to save annotated image. Please try again.')
      }
    }, 'image/png', 1.0)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-7xl w-full max-h-[95vh] flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Annotate Photo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icons.X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawing Tools */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Tool:</span>
            <select
              value={drawingMode}
              onChange={(e) => setDrawingMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="freehand">Freehand</option>
              <option value="line">Line</option>
              <option value="arrow">Arrow</option>
              <option value="circle">Circle</option>
              <option value="box">Box</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Color:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Width:</span>
            <input
              type="range"
              min="1"
              max="10"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-600">{lineWidth}px</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <Icons.Undo className="w-5 h-5" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <Icons.Redo className="w-5 h-5" />
            </button>
            <button
              onClick={clearDrawing}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              title="Clear all drawings"
            >
              <Icons.Clear className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 rounded-lg p-4 min-h-[400px]">
          {loadingError && (
            <div className="text-center text-red-600 p-4">
              <p className="font-semibold">Error loading image</p>
              <p className="text-sm mt-2">{loadingError}</p>
              <button
                onClick={() => {
                  setLoadingError(null)
                  setImageLoaded(false)
                  // Reload by re-triggering useEffect
                  const img = new Image()
                  img.crossOrigin = 'anonymous'
                  const photoUrl = photo.storage_url || `${API_BASE}/photos/${photo.id}/file`
                  img.src = photoUrl
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}
          {!imageLoaded && !loadingError && (
            <div className="text-center text-gray-500">
              <p className="text-lg">Loading image...</p>
              <p className="text-sm mt-2">Please wait</p>
            </div>
          )}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
            className="border border-gray-300 rounded-lg cursor-crosshair bg-white"
            style={{ 
              maxWidth: '100%', 
              maxHeight: '70vh',
              display: imageLoaded ? 'block' : 'none'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Save Annotations
          </button>
        </div>
      </div>
    </div>
  )
}

export default InspectionDetails

/**
 * Reports Module - Abdalla (Module 2)
 * API-510 Pressure Vessel Inspection Report Generator
 * Refactored to match Inspector Dashboard design aesthetic
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { reportService } from '../../services/reportService.js'
import { photoService } from '../../services/photoService.js'
import axios from 'axios'
import { API_BASE } from '../../services/api.js'

// Icon Components (matching Inspector Dashboard)
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
}

function Reports() {
  const navigate = useNavigate()
  const { inspectionId: urlInspectionId } = useParams() // Get inspection_id from URL if present
  const location = useLocation() // Get inspection_id from location state if present
  const fileInputRef = useRef(null)
  const [user, setUser] = useState(null)
  
  // Report state
  const [inspectionId, setInspectionId] = useState(null) // Store inspection_id if available
  const [equipmentId, setEquipmentId] = useState(null)
  const [equipmentList, setEquipmentList] = useState([])
  const [selectedEquipment, setSelectedEquipment] = useState(null)
  const [availablePhotos, setAvailablePhotos] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  
  // Header state
  const [header, setHeader] = useState({
    equipment_tag: '',
    equipment_description: '',
    plant: '',
    dosh_no: '',
    report_no: '',
    report_date: new Date().toISOString().split('T')[0],
    inspector_name: '',
    reviewed_by: '',
    client_approver: '',
    inspection_type: 'VI', // Default to Visual Inspection
    turnaround_code: null // Auto-generated from report_date
  })
  
  // Function to generate report number according to format
  const generateReportNumber = (plant, equipmentTag, reportDate, inspectionType = 'VI', turnaroundCode = null) => {
    if (!plant || !equipmentTag || !reportDate) {
      return ''
    }
    
    // Normalize plant name: remove spaces, convert to uppercase
    const plantNormalized = plant.replace(/\s+/g, '').toUpperCase()
    
    // Normalize inspection type: uppercase, default to "VI"
    const inspectionTypeNormalized = (inspectionType || 'VI').toUpperCase()
    
    // Extract year from report_date and create turnaround code
    let turnaroundCodeNormalized
    if (turnaroundCode) {
      turnaroundCodeNormalized = turnaroundCode.toUpperCase()
    } else {
      // Extract year from report_date (format: YYYY-MM-DD)
      try {
        const year = reportDate.substring(0, 4)
        if (year && year.match(/^\d{4}$/)) {
          turnaroundCodeNormalized = `TA${year}`
        } else {
          // Fallback to current year
          turnaroundCodeNormalized = `TA${new Date().getFullYear()}`
        }
      } catch (e) {
        turnaroundCodeNormalized = `TA${new Date().getFullYear()}`
      }
    }
    
    // Construct report number: PLANT/INSPECTION_TYPE/EQUIPMENT_TAG/TURNAROUND_CODE
    return `${plantNormalized}/${inspectionTypeNormalized}/${equipmentTag}/${turnaroundCodeNormalized}`
  }
  
  // Auto-generate report number when relevant fields change
  useEffect(() => {
    if (header.plant && header.equipment_tag && header.report_date) {
      const generatedReportNo = generateReportNumber(
        header.plant,
        header.equipment_tag,
        header.report_date,
        header.inspection_type,
        header.turnaround_code
      )
      // Only update if the generated number is different from current
      setHeader(prev => {
        if (prev.report_no !== generatedReportNo) {
          return { ...prev, report_no: generatedReportNo }
        }
        return prev
      })
    }
  }, [header.plant, header.equipment_tag, header.report_date, header.inspection_type, header.turnaround_code])
  
  // Findings and recommendations
  const [findings, setFindings] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [ndtText, setNdtText] = useState('')
  
  // Report photos (photos added to report)
  const [reportPhotos, setReportPhotos] = useState([])
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [generatedReportId, setGeneratedReportId] = useState(null)

  // Template suggestions
  const findingTemplates = [
    {
      id: 'EXT_GENERAL_COATING',
      label: 'External - Coating condition (1.1)',
      key: '1.1',
      text: 'Generally, equipment was found fully painted with no significant paint breakdown. All associated parts noted securely intact in position.'
    },
    {
      id: 'EXT_LEAKAGE',
      label: 'External - No leakage observed (1.2)',
      key: '1.2',
      text: 'No leakage traces observed on shell, heads, flanges or piping attachments during visual inspection.'
    },
    {
      id: 'INT_GENERAL',
      label: 'Internal - Surfaces clean (2.1)',
      key: '2.1',
      text: 'Internal surfaces observed generally clean with minor light rust staining. No significant sludge or scale accumulation noted.'
    },
    {
      id: 'INT_CORROSION',
      label: 'Internal - Localised corrosion (2.2)',
      key: '2.2',
      text: 'Localised general corrosion noted around lower skirt support region with maximum measured loss of approximately 0.3 mm.'
    }
  ]

  const recommendationTemplates = [
    {
      id: 'RECO_TOUCHUP',
      label: 'Touch-up coating (3.1)',
      key: '3.1',
      text: 'Touch up paint coating at affected areas and ensure surface preparation meets coating system requirements.'
    },
    {
      id: 'RECO_MONITOR',
      label: 'Monitor corrosion (3.2)',
      key: '3.2',
      text: 'Continue to monitor localised corrosion areas during next turnaround. Repeat thickness survey to trend corrosion rate.'
    },
    {
      id: 'RECO_REPAIR',
      label: 'Repair insulation (3.3)',
      key: '3.3',
      text: 'Repair damaged insulation cladding to prevent moisture ingress and under insulation corrosion.'
    },
    {
      id: 'RECO_HYDROTEST',
      label: 'Hydrotest / Fitness check (3.4)',
      key: '3.4',
      text: 'Perform hydrostatic test / fitness-for-service evaluation prior to returning equipment to operation.'
    }
  ]

  // Fetch user info
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
      } catch (e) {
        console.error('Error parsing user data:', e)
      }
    }

    // Parse token for current user
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setCurrentUser(payload)
      if (payload.username) {
        setHeader(prev => ({ ...prev, inspector_name: payload.username }))
      }
    } catch (err) {
      console.error('Error parsing token:', err)
    }
  }, [navigate])
  
  // Initialize inspection_id from URL params or location state
  useEffect(() => {
    const inspectionIdFromUrl = urlInspectionId || location.state?.inspectionId
    if (inspectionIdFromUrl) {
      const parsedId = typeof inspectionIdFromUrl === 'string' ? parseInt(inspectionIdFromUrl, 10) : inspectionIdFromUrl
      if (!isNaN(parsedId) && parsedId > 0) {
        setInspectionId(parsedId)
        console.log('📋 Inspection ID loaded from URL/state:', parsedId)
      }
    }
  }, [urlInspectionId, location.state])
  
  // Fetch equipment list
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE}/equipment/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setEquipmentList(response.data || [])
      } catch (err) {
        console.error('Error fetching equipment:', err)
        setEquipmentList([])
      }
    }
    fetchEquipment()
  }, [])
  
  // Auto-fill header when equipment is selected
  useEffect(() => {
    if (selectedEquipment) {
      setHeader(prev => ({
        ...prev,
        equipment_tag: selectedEquipment.equipment_tag_no || selectedEquipment.name || '',
        equipment_description: selectedEquipment.equipment_description || 
                              `${selectedEquipment.type || ''} - ${selectedEquipment.equipment_tag_no || selectedEquipment.name || ''}`,
        plant: selectedEquipment.location || '',
        dosh_no: selectedEquipment.dosh_registration_no || ''
      }))
      setEquipmentId(selectedEquipment.id)
      fetchEquipmentPhotos(selectedEquipment.id)
    }
  }, [selectedEquipment])
  
  // Fetch photos for equipment
  const fetchEquipmentPhotos = async (eqId) => {
    try {
      const token = localStorage.getItem('token')
      const photos = await photoService.getEquipmentPhotos(eqId, token)
      setAvailablePhotos(photos || [])
    } catch (err) {
      console.error('Error fetching photos:', err)
      setAvailablePhotos([])
    }
  }
  
  // Add finding
  const addFinding = () => {
    const newKey = findings.length > 0 
      ? `${Math.max(...findings.map(f => parseFloat(f.key.split('.')[0]))) + 1}.1`
      : '1.1'
    setFindings([...findings, { key: newKey, text: '' }])
  }
  
  // Update finding
  const updateFinding = (index, field, value) => {
    const updated = [...findings]
    updated[index] = { ...updated[index], [field]: value }
    setFindings(updated)
  }
  
  // Remove finding
  const removeFinding = (index) => {
    setFindings(findings.filter((_, i) => i !== index))
  }
  
  // Add recommendation
  const addRecommendation = () => {
    const newKey = recommendations.length > 0 
      ? `${Math.max(...recommendations.map(r => parseFloat(r.key.split('.')[0]))) + 1}.1`
      : '1.1'
    setRecommendations([...recommendations, { key: newKey, text: '' }])
  }
  
  // Update recommendation
  const updateRecommendation = (index, field, value) => {
    const updated = [...recommendations]
    updated[index] = { ...updated[index], [field]: value }
    setRecommendations(updated)
  }

  const applyFindingTemplate = (index, templateId) => {
    const template = findingTemplates.find(t => t.id === templateId)
    if (!template) return
    const updated = [...findings]
    updated[index] = { key: template.key, text: template.text }
    setFindings(updated)
  }

  const applyRecommendationTemplate = (index, templateId) => {
    const template = recommendationTemplates.find(t => t.id === templateId)
    if (!template) return
    const updated = [...recommendations]
    updated[index] = { key: template.key, text: template.text }
    setRecommendations(updated)
  }
  
  // Remove recommendation
  const removeRecommendation = (index) => {
    setRecommendations(recommendations.filter((_, i) => i !== index))
  }
  
  // Add photo to report
  const addPhotoToReport = (photo) => {
    const newPhoto = {
      finding_key: '',
      finding_text: '',
      recommendation_text: '',
      photo_id: photo.id,
      storage_url: photo.storage_url,
      file_path: photo.file_path
    }
    setReportPhotos([...reportPhotos, newPhoto])
  }
  
  // Update report photo
  const updateReportPhoto = (index, field, value) => {
    const updated = [...reportPhotos]
    updated[index] = { ...updated[index], [field]: value }
    setReportPhotos(updated)
  }
  
  // Remove photo from report
  const removeReportPhoto = (index) => {
    setReportPhotos(reportPhotos.filter((_, i) => i !== index))
  }

  // Upload new photo
  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      
      const response = await photoService.uploadPhoto(file, equipmentId, token)
      
      if (response.success && response.photo) {
        const uploadedPhoto = response.photo
        setAvailablePhotos([...availablePhotos, uploadedPhoto])
        
        const newPhoto = {
          finding_key: '',
          finding_text: '',
          recommendation_text: '',
          photo_id: uploadedPhoto.id,
          storage_url: uploadedPhoto.storage_url || photoService.getPhotoFileUrl(uploadedPhoto.id),
          file_path: uploadedPhoto.file_path
        }
        setReportPhotos([...reportPhotos, newPhoto])
        setSuccess('Photo uploaded and added to report successfully!')
      } else {
        setError('Failed to upload photo')
      }
    } catch (err) {
      console.error('Error uploading photo:', err)
      setError(err.response?.data?.detail || 'Failed to upload photo. Please try again.')
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  // Generate report
  const handleGenerateReport = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    if (!header.equipment_tag || !header.report_no || !header.inspector_name) {
      setError('Please fill in all required header fields (Equipment Tag, Report No., Inspector Name)')
      setLoading(false)
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      
      // Get inspection_id from various sources (URL param, location state, or component state)
      let finalInspectionId = inspectionId || urlInspectionId || location.state?.inspectionId || null
      
      // Convert to integer if present (backend expects Optional[int])
      if (finalInspectionId) {
        finalInspectionId = typeof finalInspectionId === 'string' ? parseInt(finalInspectionId, 10) : finalInspectionId
        if (isNaN(finalInspectionId) || finalInspectionId <= 0) {
          console.warn(`⚠️ Invalid inspection_id: ${finalInspectionId}, sending null instead`)
          finalInspectionId = null
        }
      }
      
      const reportData = {
        inspection_id: finalInspectionId, // Include inspection_id if available (backend allows Optional[int])
        equipment_id: equipmentId,
        header: header,
        findings: findings,
        recommendations: recommendations,
        photos: reportPhotos,
        ndt_text: ndtText || null,
        initial_inspection_text: 'Initial/Pre-Inspection — Not applicable'
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
      
      const reportId = response.report_id || response.id
      setGeneratedReportId(reportId)
      setSuccess(`Report generated successfully! Report ID: ${reportId}`)
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
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  
  // Download PDF
  const handleDownloadPDF = async () => {
    if (!generatedReportId) {
      setError('No report ID available. Please generate a report first.')
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      console.log('📥 Downloading PDF for report_id:', generatedReportId)
      const blob = await reportService.exportPDF(generatedReportId, token)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `API510_Report_${header.report_no}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading PDF:', err)
      setError('Failed to download PDF. Please try again.')
    }
  }

  return (
    <>
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              API-510 Pressure Vessel Inspection Report
            </h1>
            <p className="text-gray-600">Create and generate inspection reports</p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl">
              {error}
            </div>
          )}

          {/* Equipment Selection Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Equipment Selection</h2>
            <div className="visor-form-group">
              <label className="visor-form-label">Select Equipment</label>
              <select
                className="visor-form-select"
                value={equipmentId || ''}
                onChange={(e) => {
                  const eq = equipmentList.find(eq => eq.id === parseInt(e.target.value))
                  setSelectedEquipment(eq)
                }}
              >
                <option value="">Select Equipment</option>
                {equipmentList.length === 0 ? (
                  <option value="" disabled>No equipment available</option>
                ) : (
                  equipmentList.map(eq => {
                    const tag = eq.equipment_tag_no || eq.name || 'N/A'
                    const desc = eq.equipment_description || eq.type || ''
                    const loc = eq.location || 'N/A'
                    const displayText = desc ? `${tag} - ${desc} (${loc})` : `${tag} (${loc})`
                    return (
                      <option key={eq.id} value={eq.id}>
                        {displayText}
                      </option>
                    )
                  })
                )}
              </select>
            </div>
          </div>
          
          {/* Report Header Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Report Header</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="visor-form-group">
                <label className="visor-form-label">Equipment Tag No. <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="visor-form-input"
                  value={header.equipment_tag}
                  onChange={(e) => setHeader({...header, equipment_tag: e.target.value})}
                  placeholder="V-101"
                />
              </div>
              <div className="visor-form-group">
                <label className="visor-form-label">Equipment Description <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="visor-form-input"
                  value={header.equipment_description}
                  onChange={(e) => setHeader({...header, equipment_description: e.target.value})}
                  placeholder="Pressure Vessel"
                />
              </div>
              <div className="visor-form-group">
                <label className="visor-form-label">Plant/Unit/Area <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="visor-form-input"
                  value={header.plant}
                  onChange={(e) => setHeader({...header, plant: e.target.value})}
                  placeholder="Unit 1"
                />
              </div>
              <div className="visor-form-group">
                <label className="visor-form-label">DOSH Registration No. <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="visor-form-input"
                  value={header.dosh_no}
                  onChange={(e) => setHeader({...header, dosh_no: e.target.value})}
                  placeholder="DOSH-12345"
                />
              </div>
              <div className="visor-form-group">
                <label className="visor-form-label">Report No. <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="visor-form-input"
                  value={header.report_no}
                  onChange={(e) => setHeader({...header, report_no: e.target.value})}
                  placeholder="PLANT1/VI/V-002/TA2025"
                  title="Auto-generated from Plant, Equipment Tag, and Report Date (format: PLANT/INSPECTION_TYPE/EQUIPMENT_TAG/TURNAROUND_CODE)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: PLANT/INSPECTION_TYPE/EQUIPMENT_TAG/TURNAROUND_CODE (auto-generated when Plant, Equipment Tag, and Report Date are filled)
                </p>
              </div>
              <div className="visor-form-group">
                <label className="visor-form-label">Report Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  className="visor-form-input"
                  value={header.report_date}
                  onChange={(e) => setHeader({...header, report_date: e.target.value})}
                />
              </div>
              <div className="visor-form-group">
                <label className="visor-form-label">Inspector Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="visor-form-input"
                  value={header.inspector_name}
                  onChange={(e) => setHeader({...header, inspector_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div className="visor-form-group">
                <label className="visor-form-label">Reviewed By</label>
                <input
                  type="text"
                  className="visor-form-input"
                  value={header.reviewed_by}
                  onChange={(e) => setHeader({...header, reviewed_by: e.target.value})}
                  placeholder="Jane Smith"
                />
              </div>
              <div className="visor-form-group md:col-span-2">
                <label className="visor-form-label">Approved By (Client)</label>
                <input
                  type="text"
                  className="visor-form-input"
                  value={header.client_approver}
                  onChange={(e) => setHeader({...header, client_approver: e.target.value})}
                  placeholder="Client Name"
                />
              </div>
            </div>
          </div>
          
          {/* Findings Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Findings</h2>
              <button
                onClick={addFinding}
                className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Icons.Plus className="w-4 h-4" />
                Add Finding
              </button>
            </div>
            {findings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No findings added yet. Click "Add Finding" to get started.</p>
            ) : (
              <div className="space-y-4">
                {findings.map((finding, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                    <div className="mb-4">
                      <label className="visor-form-label">Quick Template</label>
                      <select
                        defaultValue=""
                        className="visor-form-select"
                        onChange={(e) => {
                          applyFindingTemplate(index, e.target.value)
                          e.target.selectedIndex = 0
                        }}
                      >
                        <option value="">Select predefined finding...</option>
                        {findingTemplates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <label className="visor-form-label">Finding Key (e.g., 1.1, 2.3)</label>
                        <input
                          type="text"
                          className="visor-form-input"
                          value={finding.key}
                          onChange={(e) => updateFinding(index, 'key', e.target.value)}
                          placeholder="1.1"
                        />
                      </div>
                      <button
                        onClick={() => removeFinding(index)}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors mt-7"
                      >
                        Remove
                      </button>
                    </div>
                    <div>
                      <label className="visor-form-label">Finding Text</label>
                      <textarea
                        className="visor-form-textarea"
                        rows="3"
                        value={finding.text}
                        onChange={(e) => updateFinding(index, 'text', e.target.value)}
                        placeholder="Describe the finding..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Recommendations Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recommendations</h2>
              <button
                onClick={addRecommendation}
                className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Icons.Plus className="w-4 h-4" />
                Add Recommendation
              </button>
            </div>
            {recommendations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recommendations added yet. Click "Add Recommendation" to get started.</p>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                    <div className="mb-4">
                      <label className="visor-form-label">Quick Template</label>
                      <select
                        defaultValue=""
                        className="visor-form-select"
                        onChange={(e) => {
                          applyRecommendationTemplate(index, e.target.value)
                          e.target.selectedIndex = 0
                        }}
                      >
                        <option value="">Select predefined recommendation...</option>
                        {recommendationTemplates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                        <label className="visor-form-label">Recommendation Key (e.g., 2.2, 2.5)</label>
                        <input
                          type="text"
                          className="visor-form-input"
                          value={rec.key}
                          onChange={(e) => updateRecommendation(index, 'key', e.target.value)}
                          placeholder="2.2"
                        />
                      </div>
                      <button
                        onClick={() => removeRecommendation(index)}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors mt-7"
                      >
                        Remove
                      </button>
                    </div>
                    <div>
                      <label className="visor-form-label">Recommendation Text</label>
                      <textarea
                        className="visor-form-textarea"
                        rows="3"
                        value={rec.text}
                        onChange={(e) => updateRecommendation(index, 'text', e.target.value)}
                        placeholder="Describe the recommendation..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* NDT Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Non-Destructive Testings (NDT)</h2>
            <textarea
              className="visor-form-textarea"
              rows="4"
              value={ndtText}
              onChange={(e) => setNdtText(e.target.value)}
              placeholder="Enter NDT information..."
            />
          </div>
          
          {/* Photo Upload Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Photo</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={loading}
                className="hidden"
                id="photo-upload-input"
              />
              <label
                htmlFor="photo-upload-input"
                className={`cursor-pointer inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
                  loading
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <Icons.Upload className="w-5 h-5" />
                {loading ? 'Uploading...' : 'Upload Photo'}
              </label>
              <p className="mt-3 text-sm text-gray-500">
                Select an image file (JPG, PNG, etc.) - Max 10MB
                {equipmentId && <span className="block mt-1">Will be linked to selected equipment</span>}
              </p>
            </div>
          </div>
          
          {/* Available Photos Card */}
          {availablePhotos.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Photos for Selected Equipment</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {availablePhotos.map((photo) => (
                  <div key={photo.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50 hover:shadow-md transition-shadow">
                    <img
                      src={photo.storage_url || `${API_BASE}/photos/${photo.id}/file`}
                      alt="Equipment photo"
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      onError={(e) => {
                        e.target.src = `${API_BASE}/photos/${photo.id}/file`
                      }}
                    />
                    <button
                      onClick={() => addPhotoToReport(photo)}
                      className="w-full px-3 py-2 bg-green-600 text-white text-sm rounded-xl font-medium hover:bg-green-700 transition-colors"
                    >
                      Add to Report
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Report Photos Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Photos</h2>
            {reportPhotos.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No photos added yet. Select equipment and add photos above.</p>
            ) : (
              <div className="space-y-4">
                {reportPhotos.map((photo, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-5 bg-gray-50">
                    <div className="flex gap-4">
                      <div className="w-32 h-32 border border-gray-300 rounded-xl overflow-hidden bg-white flex-shrink-0">
                        <img
                          src={photo.storage_url || `${API_BASE}/photos/${photo.photo_id}/file`}
                          alt="Report photo"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = `${API_BASE}/photos/${photo.photo_id}/file`
                          }}
                        />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <label className="visor-form-label">Finding Key (e.g., 7.1)</label>
                          <input
                            type="text"
                            className="visor-form-input"
                            value={photo.finding_key}
                            onChange={(e) => updateReportPhoto(index, 'finding_key', e.target.value)}
                            placeholder="7.1"
                          />
                        </div>
                        <div>
                          <label className="visor-form-label">Finding Text</label>
                          <textarea
                            className="visor-form-textarea"
                            rows="2"
                            value={photo.finding_text}
                            onChange={(e) => updateReportPhoto(index, 'finding_text', e.target.value)}
                            placeholder="Describe the finding for this photo..."
                          />
                        </div>
                        <div>
                          <label className="visor-form-label">Recommendation Text</label>
                          <textarea
                            className="visor-form-textarea"
                            rows="2"
                            value={photo.recommendation_text}
                            onChange={(e) => updateReportPhoto(index, 'recommendation_text', e.target.value)}
                            placeholder="Describe the recommendation for this photo..."
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeReportPhoto(index)}
                        className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors h-fit"
                      >
                        <Icons.X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Generate Report Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full px-6 py-3.5 bg-green-600 text-white text-lg font-semibold rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <Icons.FileText className="w-5 h-5" />
                  Generate API-510 Report
                </>
              )}
            </button>
            
            {generatedReportId && (
              <button
                onClick={handleDownloadPDF}
                className="w-full mt-4 px-6 py-3.5 bg-red-600 text-white text-lg font-semibold rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Icons.Download className="w-5 h-5" />
                Download PDF
              </button>
            )}
          </div>
    </>
  )
}

export default Reports

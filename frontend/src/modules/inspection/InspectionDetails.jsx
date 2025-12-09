/**
 * Inspection Details Page
 * 4-tab layout: Overview, Observations, Photos, Report
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import InspectorLayout from '../../components/inspector/InspectorLayout'
import axios from 'axios'
import { API_BASE } from '../../services/api'
import { photoService } from '../../services/photoService'
import { reportService } from '../../services/reportService'
import observationService from '../../services/observationService'

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
}

// Finding templates (keys removed - only used for text, numbering is automatic)
const findingTemplates = [
  { id: '1', label: 'External - Coating condition', text: 'Generally, equipment was found fully painted with no significant paint breakdown.' },
  { id: '2', label: 'External - No leakage', text: 'No leakage traces observed on shell, heads, flanges or piping attachments.' },
  { id: '3', label: 'Internal - Surfaces clean', text: 'Internal surfaces observed generally clean with minor light rust staining.' },
  { id: '4', label: 'Internal - Localised corrosion', text: 'Localised general corrosion noted around lower skirt support region.' },
]

// Recommendation templates (keys removed - only used for text, numbering is automatic)
const recommendationTemplates = [
  { id: '1', label: 'Touch-up coating', text: 'Touch up paint coating at affected areas.' },
  { id: '2', label: 'Monitor corrosion', text: 'Continue to monitor localised corrosion areas during next turnaround.' },
  { id: '3', label: 'Repair insulation', text: 'Repair damaged insulation cladding to prevent moisture ingress.' },
  { id: '4', label: 'Hydrotest / Fitness check', text: 'Perform hydrostatic test / fitness-for-service evaluation.' },
]

function InspectionDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [inspection, setInspection] = useState(null)
  const [equipment, setEquipment] = useState(null)
  const [loading, setLoading] = useState(true)
  
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
  
  // Get current group photos based on selected group
  const currentGroupPhotos = photoGroupNumber ? (photoGroups[photoGroupNumber] || []) : []
  
  // Debug logging for currentGroupPhotos
  if (photoGroupNumber) {
    console.log(`🔍 currentGroupPhotos debug: photoGroupNumber="${photoGroupNumber}", photoGroups keys:`, Object.keys(photoGroups), `photos in group ${photoGroupNumber}:`, photoGroups[photoGroupNumber]?.length || 0)
  }
  
  // Report state
  const [report, setReport] = useState(null)
  const [generatingReport, setGeneratingReport] = useState(false)

  useEffect(() => {
    fetchInspection()
  }, [id])

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
    }
  }, [inspection?.inspection_id]) // Only depend on inspection_id, not entire inspection object

  const fetchInspection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE}/inspections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setInspection(response.data)
    } catch (err) {
      console.error('Error fetching inspection:', err)
    } finally {
      setLoading(false)
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
    const observationNum = getObservationNumber()
    const newKey = getNextRecommendationNumber(observationForm.recommendations, observationNum)
    setObservationForm({
      ...observationForm,
      recommendations: [...observationForm.recommendations, { key: newKey, text: '' }]
    })
  }

  const handleApplyFindingTemplate = (index, templateId) => {
    const template = findingTemplates.find(t => t.id === templateId)
    if (!template) return
    const updated = [...observationForm.findings]
    // Only update the text, keep the existing auto-generated key
    updated[index] = { ...updated[index], text: template.text }
    setObservationForm({ ...observationForm, findings: updated })
  }

  const handleApplyRecommendationTemplate = (index, templateId) => {
    const template = recommendationTemplates.find(t => t.id === templateId)
    if (!template) return
    const updated = [...observationForm.recommendations]
    // Only update the text, keep the existing auto-generated key
    updated[index] = { ...updated[index], text: template.text }
    setObservationForm({ ...observationForm, recommendations: updated })
  }

  const [editingObservationId, setEditingObservationId] = useState(null)

  const handleEditObservation = (obs) => {
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
      
      // Iterate through all photo groups
      Object.keys(photoGroups).forEach(groupNum => {
        const groupPhotos = photoGroups[groupNum] || []
        
        groupPhotos.forEach(photo => {
          // Get finding key from linkedPhotos or photoNumbers
          const findingKey = linkedPhotos[photo.id] || photoNumbers[photo.id] || ''
          
          // Find matching finding and recommendation by key
          const matchingFinding = allFindings.find(f => f.key === findingKey)
          const matchingRecommendation = allRecommendations.find(r => r.key === findingKey)
          
          reportPhotos.push({
            finding_key: findingKey,
            finding_text: matchingFinding?.text || '',
            recommendation_text: matchingRecommendation?.text || 'Nil',
            storage_url: photo.storage_url || photoService.getPhotoFileUrl(photo.id),
            file_path: photo.file_path,
          })
        })
      })

      const equipmentTagNo = inspection.equipment_tag_no || equipment?.equipment_tag_no || equipment?.name || 'N/A'
      
      const reportData = {
        inspection_id: inspectionId, // CRITICAL: Include inspection_id as integer
        equipment_id: equipment?.id || inspection.equipment_id,
        header: {
          equipment_tag: equipmentTagNo,
          equipment_description: equipment?.equipment_description || '',
          plant: equipment?.location || '',
          dosh_no: equipment?.dosh_registration_no || '',
          report_no: `RPT-${inspectionId}-${Date.now()}`,
          report_date: new Date().toISOString().split('T')[0],
          inspector_name: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Inspector',
          reviewed_by: '',
          client_approver: '',
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
      setReport(response)
      alert('Report generated successfully!')
    } catch (err) {
      console.error('❌ Error generating report:', err)
      console.error('❌ Error details:', err.response?.data)
      alert(`Failed to generate report: ${err.response?.data?.detail || err.message || 'Unknown error'}`)
    } finally {
      setGeneratingReport(false)
    }
  }

  if (loading) {
    return (
      <InspectorLayout activeMenuId="inspection">
        <div className="p-12 text-center text-gray-500">Loading inspection details...</div>
      </InspectorLayout>
    )
  }

  if (!inspection) {
    return (
      <InspectorLayout activeMenuId="inspection">
        <div className="p-12 text-center text-gray-500">Inspection not found</div>
      </InspectorLayout>
    )
  }

  return (
    <InspectorLayout activeMenuId="inspection">
      {/* Page Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/inspection')}
          className="text-blue-600 hover:text-blue-700 mb-4"
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
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
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
                  <p className="text-sm text-gray-600">Location: {equipment?.location || 'N/A'}</p>
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
            </div>
          )}

          {/* Observations Tab */}
          {activeTab === 'observations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Observations</h2>
                <button
                  onClick={() => {
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Icons.Plus />
                  {showObservationForm ? 'Cancel' : 'Add Observation'}
                </button>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Component name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={observationForm.location}
                        onChange={(e) => setObservationForm({ ...observationForm, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Location"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observation Type</label>
                      <select
                        value={observationForm.observation_type}
                        onChange={(e) => setObservationForm({ ...observationForm, observation_type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
                              handleApplyFindingTemplate(idx, e.target.value)
                              e.target.selectedIndex = 0
                            }}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select template...</option>
                            {findingTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          value={finding.text}
                          onChange={(e) => {
                            const updated = [...observationForm.findings]
                            updated[idx].text = e.target.value
                            setObservationForm({ ...observationForm, findings: updated })
                          }}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
                        onClick={handleAddRecommendation}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
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
                              handleApplyRecommendationTemplate(idx, e.target.value)
                              e.target.selectedIndex = 0
                            }}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select template...</option>
                            {recommendationTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          value={rec.text}
                          onChange={(e) => {
                            const updated = [...observationForm.recommendations]
                            updated[idx].text = e.target.value
                            setObservationForm({ ...observationForm, recommendations: updated })
                          }}
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
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
                          <p className="text-xs font-semibold text-blue-600 mb-1">Observation {index + 1}</p>
                          <h4 className="font-semibold text-gray-900">{obs.component} - {obs.location}</h4>
                          <p className="text-sm text-gray-600">Type: {obs.observation_type} | Severity: {obs.severity} | Priority: {obs.priority}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditObservation(obs)}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Edit observation"
                          >
                            <Icons.Pencil />
                          </button>
                          <button
                            onClick={async () => {
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
                <div className="flex gap-2">
                  <select
                    value={photoGroupNumber}
                    onChange={(e) => handlePhotoGroupChange(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2">
                    <Icons.Upload />
                    Upload Photos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Photo Group Information Box */}
              {photoGroupNumber && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-1">
                      Photo Group {photoGroupNumber}
                    </h4>
                    <p className="text-sm text-blue-800">
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
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-blue-800">{selectedFromCurrentGroup.length} photo(s) from Group {photoGroupNumber} selected</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowLinkModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                                      ? 'border-blue-500 bg-blue-50 hover:bg-blue-100'
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
                            ? 'border-blue-600 ring-2 ring-blue-200'
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
                          src={photo.storage_url || `${API_BASE}/photos/${photo.id}/file`}
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
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center z-10">
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
                          <button
                            onClick={(e) => handleDeletePhoto(photo.id, e)}
                            className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                            title="Delete photo"
                          >
                            <Icons.Trash className="w-5 h-5 text-red-600" />
                          </button>
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
                    <p className="text-lg font-semibold text-gray-900">{report.report_id || report.id || 'N/A'}</p>
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
                  <div className="flex gap-4">
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
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Icons.Download />
                      Download Report
                    </button>
                    <button
                      onClick={handleGenerateReport}
                      disabled={generatingReport}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                      {generatingReport ? 'Regenerating...' : 'Regenerate Report'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <p className="text-gray-600 mb-4">No report generated yet. Generate a report to include all observations and photos.</p>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400"
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
            </div>
          )}
        </div>
      </div>
    </InspectorLayout>
  )
}

export default InspectionDetails


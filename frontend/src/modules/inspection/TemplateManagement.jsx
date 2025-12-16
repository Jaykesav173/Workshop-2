import React, { useState, useEffect } from 'react'
import templateService from '../../services/templateService'
import './TemplateManagement.css'

const TemplateManagement = ({ onClose, initialTab = 'findings' }) => {
  console.log('🚀 TemplateManagement component CREATED with initialTab:', initialTab)
  
  const [activeTab, setActiveTab] = useState(initialTab) // 'findings' or 'recommendations'
  const [findingTemplates, setFindingTemplates] = useState([])
  const [recommendationTemplates, setRecommendationTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [formData, setFormData] = useState({
    label: '',
    text: '',
    is_active: 'ACTIVE'
  })

  const token = localStorage.getItem('token')

  // Log when component mounts
  useEffect(() => {
    console.log('✅ TemplateManagement component MOUNTED')
    return () => {
      console.log('❌ TemplateManagement component UNMOUNTED')
    }
  }, [])

  // Update active tab when initialTab prop changes
  useEffect(() => {
    console.log('📝 TemplateManagement: initialTab changed to:', initialTab)
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  useEffect(() => {
    console.log('📥 TemplateManagement: Fetching templates for tab:', activeTab)
    fetchTemplates()
  }, [activeTab])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      // Fetch all templates (both active and inactive) so user can see and manage all
      if (activeTab === 'findings') {
        const templates = await templateService.getFindingTemplates(token, false) // false = include inactive
        setFindingTemplates(templates || [])
        console.log('📋 Fetched finding templates:', templates?.length || 0)
      } else {
        const templates = await templateService.getRecommendationTemplates(token, false) // false = include inactive
        setRecommendationTemplates(templates || [])
        console.log('📋 Fetched recommendation templates:', templates?.length || 0)
      }
    } catch (error) {
      console.error('❌ Error fetching templates:', error)
      console.error('❌ Error details:', error.response?.data || error.message)
      alert('Failed to load templates. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingTemplate(null)
    setFormData({ label: '', text: '', is_active: 'ACTIVE' })
    setShowForm(true)
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setFormData({
      label: template.label,
      text: template.text,
      is_active: template.is_active || 'ACTIVE'
    })
    setShowForm(true)
  }

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      if (activeTab === 'findings') {
        await templateService.deleteFindingTemplate(templateId, token)
      } else {
        await templateService.deleteRecommendationTemplate(templateId, token)
      }
      alert('Template deleted successfully')
      fetchTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.label.trim() || !formData.text.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      if (editingTemplate) {
        // Update existing template
        if (activeTab === 'findings') {
          await templateService.updateFindingTemplate(editingTemplate.id, formData, token)
        } else {
          await templateService.updateRecommendationTemplate(editingTemplate.id, formData, token)
        }
        alert('Template updated successfully')
      } else {
        // Create new template
        if (activeTab === 'findings') {
          await templateService.createFindingTemplate(formData, token)
        } else {
          await templateService.createRecommendationTemplate(formData, token)
        }
        alert('Template created successfully')
      }
      setShowForm(false)
      fetchTemplates()
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template. Please try again.')
    }
  }

  const currentTemplates = activeTab === 'findings' ? findingTemplates : recommendationTemplates

  console.log('🎨 TemplateManagement RENDERING - activeTab:', activeTab, 'loading:', loading, 'templates count:', currentTemplates.length)

  // If component renders but nothing shows, this will help debug
  if (!token) {
    console.error('❌ No token found in TemplateManagement!')
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 0, 0, 0.8)',
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '24px'
      }}>
        ERROR: No authentication token found!
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // Close on overlay click
        console.log('Overlay clicked, closing modal')
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Manage Templates</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'findings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('findings')}
          >
            Finding Templates
          </button>
          <button
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'recommendations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('recommendations')}
          >
            Recommendation Templates
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading templates...</div>
            </div>
          ) : showForm ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'Add New Template'}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., External - Coating condition"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="e.g., Generally, equipment was found fully painted with no significant paint breakdown."
                  rows="4"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-vertical"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'findings' ? 'Finding' : 'Recommendation'} Templates ({currentTemplates.length})
                </h3>
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add New Template
                </button>
              </div>

              {currentTemplates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-gray-500">No templates found. Click "Add New Template" to create one.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentTemplates.map((template) => (
                    <div key={template.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-base font-semibold text-gray-900">{template.label}</h4>
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              template.is_active === 'ACTIVE' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {template.is_active}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{template.text}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(template)}
                            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(template.id)}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplateManagement

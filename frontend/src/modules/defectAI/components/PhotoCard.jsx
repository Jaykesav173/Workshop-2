import React, { useState, useEffect } from 'react'
import { Save, X, Edit2 } from 'lucide-react'

/**
 * PhotoCard Component
 * Displays a photo with AI analysis results and allows editing/saving
 */
const PhotoCard = ({ item, index, onSave, onDiscard }) => {
  // Helper to extract findings from item (handles both structures)
  const extractFindings = (itemData) => {
    if (!itemData) return { description: '', recommendation: '', category: 'UNKNOWN', severity: 'MEDIUM', box_2d: [] }
    
    const findings = itemData.findings || {}
    const result = {
      description: String(findings.description || '').trim(),
      recommendation: String(findings.recommendation || '').trim(),
      category: String(findings.category || 'UNKNOWN').toUpperCase(),
      severity: String(findings.severity || 'MEDIUM').toUpperCase(),
      box_2d: Array.isArray(findings.box_2d) ? findings.box_2d : []
    }
    
    console.log(`PhotoCard ${index} extractFindings - itemData:`, itemData)
    console.log(`PhotoCard ${index} extractFindings - findings:`, findings)
    console.log(`PhotoCard ${index} extractFindings - result:`, result)
    
    return result
  }
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedFindings, setEditedFindings] = useState(() => extractFindings(item))

  // Update state whenever item.findings changes - use serialized findings as dependency
  const findingsKey = item.findings ? JSON.stringify(item.findings) : 'empty'
  
  useEffect(() => {
    const newFindings = extractFindings(item)
    console.log(`PhotoCard ${index} useEffect - Full item:`, item)
    console.log(`PhotoCard ${index} useEffect - Item.findings:`, item.findings)
    console.log(`PhotoCard ${index} useEffect - Extracted new findings:`, newFindings)
    
    // Always update using functional setState (React will optimize if values are the same)
    setEditedFindings(prevFindings => {
      console.log(`PhotoCard ${index} useEffect - Previous findings:`, prevFindings)
      console.log(`PhotoCard ${index} useEffect - New findings:`, newFindings)
      
      // Check if we need to update
      const needsUpdate = 
        newFindings.description !== prevFindings.description || 
        newFindings.recommendation !== prevFindings.recommendation ||
        newFindings.category !== prevFindings.category ||
        newFindings.severity !== prevFindings.severity ||
        (!prevFindings.description && newFindings.description) ||
        (!prevFindings.recommendation && newFindings.recommendation)
      
      if (needsUpdate) {
        console.log(`PhotoCard ${index} useEffect - UPDATING STATE!`, newFindings)
        return newFindings
      }
      
      console.log(`PhotoCard ${index} useEffect - No update needed (values match)`)
      return prevFindings
    })
  }, [findingsKey, index, item]) // Use findingsKey and item as dependencies

  const handleSave = () => {
    onSave(index, editedFindings)
    setIsEditing(false)
  }

  const handleSaveDirect = () => {
    // Direct save without entering edit mode
    onSave(index, editedFindings)
  }

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this result?')) {
      onDiscard(index)
    }
  }

  const isSaved = item.status === 'saved'

  // Validation: Check if all required fields are valid
  // Description and Recommendation must have content
  // Category and Severity must be selected (UNKNOWN and MEDIUM are valid if auto-selected)
  const isFormValid = () => {
    const desc = (editedFindings.description || '').trim()
    const rec = (editedFindings.recommendation || '').trim()
    const cat = editedFindings.category || ''
    const sev = editedFindings.severity || ''
    
    // Description must have at least 3 characters (meaningful content)
    // Recommendation must have at least 3 characters (meaningful content)
    // Category and Severity must be selected (not empty)
    return (
      desc.length >= 3 &&
      rec.length >= 3 &&
      cat !== '' &&
      sev !== ''
    )
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      {/* Photo Section */}
      <div className="relative h-64 overflow-hidden bg-slate-100">
        <img
          src={URL.createObjectURL(item.file)}
          alt={`Analysis ${index + 1}`}
          className="w-full h-full object-cover"
        />
        {isSaved && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            SAVED
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-slate-800 mb-1">Photo {index + 1}</h3>
            <p className="text-xs text-slate-500">{item.file.name}</p>
          </div>
          <div className="flex gap-2">
            {!isSaved && (
              <>
                {/* Save Button - Always visible, disabled when form is invalid */}
                <button
                  onClick={handleSaveDirect}
                  disabled={!isFormValid()}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isFormValid()
                      ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                  title={
                    !isFormValid()
                      ? 'Please ensure description and recommendation have at least 3 characters, and category and severity are selected'
                      : 'Save this defect to your saved defects'
                  }
                >
                  <Save size={16} />
                  Save
                </button>
                
                {/* Edit Button - Only shown when not editing */}
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                )}
                
                {/* Save Changes Button - Only shown when editing */}
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                )}
                
                {/* Discard Button */}
                <button
                  onClick={handleDiscard}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <X size={16} />
                  Discard
                </button>
              </>
            )}
          </div>
        </div>

        {/* Category and Severity Badges */}
        <div className="flex gap-2 mb-4">
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold uppercase">
            {editedFindings.category}
          </span>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
              editedFindings.severity === 'CRITICAL' || editedFindings.severity === 'HIGH'
                ? 'bg-red-100 text-red-600'
                : editedFindings.severity === 'MEDIUM'
                ? 'bg-orange-100 text-orange-600'
                : 'bg-green-100 text-green-600'
            }`}
          >
            {editedFindings.severity}
          </span>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Description
          </label>
          {isEditing ? (
            <textarea
              value={editedFindings.description || ''}
              onChange={(e) =>
                setEditedFindings({ ...editedFindings, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows="3"
              placeholder="Enter description..."
            />
          ) : (
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">
              {editedFindings.description || 'No description provided'}
            </p>
          )}
        </div>

        {/* Recommendation */}
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Recommendation
          </label>
          {isEditing ? (
            <textarea
              value={editedFindings.recommendation || ''}
              onChange={(e) =>
                setEditedFindings({ ...editedFindings, recommendation: e.target.value })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows="2"
              placeholder="Enter recommendation..."
            />
          ) : (
            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg italic">
              {editedFindings.recommendation || 'No recommendation provided'}
            </p>
          )}
        </div>

        {/* Category and Severity Selectors (when editing) */}
        {isEditing && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Category
              </label>
              <select
                value={editedFindings.category}
                onChange={(e) =>
                  setEditedFindings({ ...editedFindings, category: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="CRACK">Crack</option>
                <option value="CORROSION">Corrosion</option>
                <option value="DAMAGE">Damage</option>
                <option value="WEAR">Wear</option>
                <option value="DEFORMATION">Deformation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Severity
              </label>
              <select
                value={editedFindings.severity}
                onChange={(e) =>
                  setEditedFindings({ ...editedFindings, severity: e.target.value })
                }
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PhotoCard


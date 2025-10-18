import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../App'
import { useToast } from '../../../toast/Toast'

const RoleEdit = ({ role, company, isOpen, onClose, onSave }) => {
  const { theme } = useTheme()
  const showToast = useToast()
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    id: '',
    position: '',
    salary: '',
    contact: '',
    location: '',
    currentStage: 'applied'
  })

  // Update form data when role or company changes
  useEffect(() => {
    if (role) {
      setFormData({
        id: role.id || '',
        position: role.position || '',
        salary: role.salary || '',
        contact: role.contact || '',
        location: role.location || '',
        currentStage: role.currentStage || 'applied'
      })
    }
  }, [role, company])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.position.trim()) {
      showToast('Position title is required', 'error')
      return
    }
    
    setIsSaving(true)
    try {
      await onSave(formData)
      showToast('Role updated successfully!', 'success')
      onClose()
    } catch (error) {
      showToast('Failed to update role. Please try again.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const stages = [
    { value: 'applied', label: 'Applied' },
    { value: 'screening', label: 'Screening' },
    { value: 'interview1', label: '1st Round' },
    { value: 'interview2', label: '2nd Round' },
    { value: 'interview3', label: '3rd Round' },
    { value: 'interview4', label: '4th Round' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' }
  ]

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-40 transition-opacity backdrop-blur-sm"
        style={{ backgroundColor: `${theme.background.secondary}80` }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          style={{ backgroundColor: theme.background.primary }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 px-6 py-4 border-b flex items-center justify-between" style={{ 
            backgroundColor: theme.background.primary,
            borderColor: theme.border.light 
          }}>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: theme.text.primary }}>
                Edit Role
              </h2>
              <p className="text-sm mt-1" style={{ color: theme.text.secondary }}>
                {company?.company}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-opacity-10 transition-all"
              style={{ color: theme.text.tertiary, backgroundColor: theme.background.secondary }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-5">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                  Position Title
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.medium,
                    color: theme.text.primary
                  }}
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                  Salary Range
                </label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => handleChange('salary', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.medium,
                    color: theme.text.primary
                  }}
                  placeholder="e.g., $150k - $200k"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.medium,
                    color: theme.text.primary
                  }}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                  Recruiter / Contact
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.medium,
                    color: theme.text.primary
                  }}
                  placeholder="e.g., Sarah Chen (Recruiter)"
                />
              </div>

              {/* Current Stage */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.text.secondary }}>
                  Current Stage
                </label>
                <select
                  value={formData.currentStage}
                  onChange={(e) => handleChange('currentStage', e.target.value)}
                  disabled={isSaving}
                  className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.medium,
                    color: theme.text.primary
                  }}
                >
                  {stages.map(stage => (
                    <option key={stage.value} value={stage.value}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 px-6 py-3 rounded-lg font-medium border transition-all hover:bg-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  borderColor: theme.border.medium, 
                  color: theme.text.secondary,
                  backgroundColor: 'transparent'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  backgroundColor: theme.primary[600], 
                  color: theme.text.inverse 
                }}
              >
                {isSaving ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default RoleEdit


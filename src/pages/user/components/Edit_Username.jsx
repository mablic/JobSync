import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../App'
import { useAuth } from '../../../contexts/GlobalProvider'
import { useToast } from '../../../toast/Toast'
import { updateFullName } from '../../../lib/users'

const EditUsername = ({ isOpen, onClose }) => {
  const { theme } = useTheme()
  const { userData, refreshUserData } = useAuth()
  const showToast = useToast()
  const [newName, setNewName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Initialize name when modal opens
  useEffect(() => {
    if (isOpen && userData?.name) {
      setNewName(userData.name)
    }
  }, [isOpen, userData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return

    try {
      setIsUpdating(true)
      await updateFullName(newName.trim())
      showToast('Name updated successfully!', 'success')
      await refreshUserData()
      onClose()
    } catch (error) {
      showToast(error.message || 'Failed to update name', 'error')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClose = () => {
    if (!isUpdating) {
      setNewName(userData?.name || '')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur only */}
      <div 
        className="absolute inset-0 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full rounded-3xl max-w-md mx-auto transform transition-all"
        style={{ backgroundColor: theme.background.primary }}
      >
        <div className="rounded-3xl shadow-2xl border-2 overflow-hidden" style={{ borderColor: theme.border.light }}>
          {/* Header */}
          <div className="px-6 py-4 border-b rounded-t-3xl" style={{ borderColor: theme.border.light, backgroundColor: theme.background.primary }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: theme.primary[100] }}
                >
                  <svg className="w-5 h-5" style={{ color: theme.primary[600] }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: theme.text.primary }}>
                    Edit Full Name
                  </h3>
                  <p className="text-sm" style={{ color: theme.text.secondary }}>
                    Update your display name
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isUpdating}
                className="p-2 rounded-lg hover:bg-opacity-10 transition-all disabled:opacity-50"
                style={{ color: theme.text.tertiary }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold mb-2" style={{ color: theme.text.primary }}>
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2"
                  style={{ 
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.medium,
                    color: theme.text.primary,
                    focusRingColor: theme.primary[500]
                  }}
                  maxLength={100}
                  required
                  disabled={isUpdating}
                />
                <p className="text-xs mt-1" style={{ color: theme.text.tertiary }}>
                  {newName.length}/100 characters
                </p>
              </div>

              {/* Current name preview */}
              {userData?.name && (
                <div 
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: theme.background.secondary }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: theme.text.tertiary }}>
                    Current Name:
                  </p>
                  <p className="text-sm" style={{ color: theme.text.secondary }}>
                    {userData.name}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={isUpdating || !newName.trim()}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                style={{ 
                  backgroundColor: theme.primary[600],
                  color: theme.text.inverse
                }}
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Name'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isUpdating}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
                style={{ 
                  backgroundColor: theme.background.secondary,
                  color: theme.text.secondary,
                  border: `2px solid ${theme.border.medium}`
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditUsername

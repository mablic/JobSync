import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../App'
import { useAuth } from '../../../contexts/GlobalProvider'
import { useToast } from '../../../toast/Toast'
import { mergeCompanies } from '../../../lib/jobs'

const MergeCompany = ({ isOpen, onClose, sourceCompany, allCompanies, onMergeComplete }) => {
  const { theme } = useTheme()
  const { userData } = useAuth()
  const showToast = useToast()
  const [selectedTargetCompany, setSelectedTargetCompany] = useState('')
  const [isMerging, setIsMerging] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter out the source company from available options and sort alphabetically
  const availableCompanies = allCompanies
    .filter(company => 
      company.id !== sourceCompany?.id && 
      company.company.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.company.localeCompare(b.company))

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTargetCompany('')
      setSearchTerm('')
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTargetCompany || !sourceCompany) return

    try {
      setIsMerging(true)
      
      // Find the target company object
      const targetCompany = allCompanies.find(company => company.id === selectedTargetCompany)
      if (!targetCompany) {
        throw new Error('Target company not found')
      }

      // Merge the companies
      await mergeCompanies(sourceCompany.id, targetCompany.id, userData.emailCode)
      
      showToast(`Successfully merged ${sourceCompany.company} into ${targetCompany.company}`, 'success')
      
      // Refresh the dashboard data
      if (onMergeComplete) {
        await onMergeComplete()
      }
      
      onClose()
    } catch (error) {
      showToast(error.message || 'Failed to merge companies', 'error')
    } finally {
      setIsMerging(false)
    }
  }

  const handleClose = () => {
    if (!isMerging) {
      onClose()
    }
  }

  if (!isOpen || !sourceCompany) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur only */}
      <div 
        className="absolute inset-0 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full rounded-3xl max-w-lg mx-auto transform transition-all"
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: theme.text.primary }}>
                    Merge Companies
                  </h3>
                  <p className="text-sm" style={{ color: theme.text.secondary }}>
                    Combine applications from different company names
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isMerging}
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
            <div className="space-y-6">
              {/* Source Company Display */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: theme.text.primary }}>
                  Source Company (will be merged into target)
                </label>
                <div 
                  className="p-4 rounded-xl border-2"
                  style={{ 
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.medium
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ backgroundColor: theme.primary[600] }}
                    >
                      {sourceCompany.logo}
                    </div>
                    <div>
                      <h4 className="font-semibold" style={{ color: theme.text.primary }}>
                        {sourceCompany.company}
                      </h4>
                      <p className="text-sm" style={{ color: theme.text.secondary }}>
                        {sourceCompany.roles.length} {sourceCompany.roles.length === 1 ? 'application' : 'applications'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Company Selection */}
              <div>
                <label htmlFor="targetCompany" className="block text-sm font-semibold mb-2" style={{ color: theme.text.primary }}>
                  Merge into this company
                </label>
                
                {/* Search Input */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2.5 pl-10 rounded-lg border text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: theme.background.secondary,
                      borderColor: theme.border.medium,
                      color: theme.text.primary,
                      focusRingColor: theme.primary[500]
                    }}
                    disabled={isMerging}
                  />
                  <svg
                    className="absolute left-3 top-3 w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: theme.text.tertiary }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Company Dropdown */}
                <div className="max-h-48 overflow-y-auto border rounded-lg" style={{ borderColor: theme.border.medium }}>
                  {availableCompanies.length > 0 ? (
                    availableCompanies.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => setSelectedTargetCompany(company.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-opacity-50 transition-all ${
                          selectedTargetCompany === company.id ? 'ring-2' : ''
                        }`}
                        style={{
                          backgroundColor: selectedTargetCompany === company.id 
                            ? theme.primary[50] 
                            : 'transparent',
                          borderBottom: `1px solid ${theme.border.light}`,
                          ringColor: selectedTargetCompany === company.id ? theme.primary[600] : 'transparent'
                        }}
                        disabled={isMerging}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{ backgroundColor: theme.secondary[600] }}
                        >
                          {company.logo}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium" style={{ color: theme.text.primary }}>
                            {company.company}
                          </h5>
                          <p className="text-sm" style={{ color: theme.text.secondary }}>
                            {company.roles.length} {company.roles.length === 1 ? 'application' : 'applications'}
                          </p>
                        </div>
                        {selectedTargetCompany === company.id && (
                          <svg className="w-5 h-5" style={{ color: theme.primary[600] }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center" style={{ color: theme.text.tertiary }}>
                      <p className="text-sm">No companies found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning Message */}
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: theme.status.offer + '10' }}
              >
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: theme.status.offer }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium" style={{ color: theme.text.primary }}>
                      This action cannot be undone
                    </p>
                    <p className="text-xs mt-1" style={{ color: theme.text.secondary }}>
                      All applications from "{sourceCompany.company}" will be moved to the selected company. The source company will be removed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={isMerging || !selectedTargetCompany}
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
                style={{ 
                  backgroundColor: theme.primary[600],
                  color: theme.text.inverse
                }}
              >
                {isMerging ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Merging...
                  </div>
                ) : (
                  'Merge Companies'
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isMerging}
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

export default MergeCompany

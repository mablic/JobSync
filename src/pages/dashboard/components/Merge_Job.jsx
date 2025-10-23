import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../App'
import { useAuth } from '../../../contexts/GlobalProvider'
import { useToast } from '../../../toast/Toast'
import { mergeJobs } from '../../../lib/jobs'

const MergeJob = ({ isOpen, onClose, sourceJob, company, onMergeComplete }) => {
  const { theme } = useTheme()
  const { userData } = useAuth()
  const showToast = useToast()
  const [selectedTargetJob, setSelectedTargetJob] = useState('')
  const [isMerging, setIsMerging] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Get all jobs from the same company, excluding the source job
  const availableJobs = company?.roles
    ?.filter(job => 
      job.id !== sourceJob?.id && 
      job.position.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.position.localeCompare(b.position)) || []

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTargetJob('')
      setSearchTerm('')
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTargetJob || !sourceJob) return

    try {
      setIsMerging(true)
      
      // Find the target job object
      const targetJob = company.roles.find(job => job.id === selectedTargetJob)
      if (!targetJob) {
        throw new Error('Target job not found')
      }

      // Merge the jobs
      await mergeJobs(sourceJob.id, targetJob.id, userData.emailCode)
      
      showToast(`Successfully merged "${sourceJob.position}" into "${targetJob.position}"`, 'success')
      
      // Refresh the dashboard data
      if (onMergeComplete) {
        await onMergeComplete()
      }
      
      onClose()
    } catch (error) {
      showToast(error.message || 'Failed to merge jobs', 'error')
    } finally {
      setIsMerging(false)
    }
  }

  const handleClose = () => {
    if (!isMerging) {
      onClose()
    }
  }

  if (!isOpen || !sourceJob || !company) return null

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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: theme.text.primary }}>
                    Merge Jobs
                  </h3>
                  <p className="text-sm" style={{ color: theme.text.secondary }}>
                    Combine duplicate job applications
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
              {/* Source Job Display */}
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: theme.text.primary }}>
                  Source Job (will be merged into target)
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
                      📄
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold" style={{ color: theme.text.primary }}>
                        {sourceJob.position || 'Unknown Position'}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {sourceJob.location && (
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: theme.background.primary, color: theme.text.secondary }}>
                            📍 {sourceJob.location}
                          </span>
                        )}
                        {sourceJob.salary && (
                          <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: theme.background.primary, color: theme.text.secondary }}>
                            💰 {sourceJob.salary}
                          </span>
                        )}
                        <span 
                          className="text-xs px-2 py-1 rounded-full"
                          style={{ 
                            backgroundColor: theme.primary[100], 
                            color: theme.primary[600] 
                          }}
                        >
                          {sourceJob.currentStage}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Target Job Selection */}
              <div>
                <label htmlFor="targetJob" className="block text-sm font-semibold mb-2" style={{ color: theme.text.primary }}>
                  Merge into this job
                </label>
                
                {/* Search Input */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search job positions..."
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

                {/* Job Dropdown */}
                <div className="max-h-48 overflow-y-auto border rounded-lg" style={{ borderColor: theme.border.medium }}>
                  {availableJobs.length > 0 ? (
                    availableJobs.map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => setSelectedTargetJob(job.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-opacity-50 transition-all ${
                          selectedTargetJob === job.id ? 'ring-2' : ''
                        }`}
                        style={{
                          backgroundColor: selectedTargetJob === job.id 
                            ? theme.primary[50] 
                            : 'transparent',
                          borderBottom: `1px solid ${theme.border.light}`,
                          ringColor: selectedTargetJob === job.id ? theme.primary[600] : 'transparent'
                        }}
                        disabled={isMerging}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0"
                          style={{ backgroundColor: theme.secondary[600] }}
                        >
                          📄
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium" style={{ color: theme.text.primary }}>
                            {job.position || 'Unknown Position'}
                          </h5>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {job.location && (
                              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: theme.background.primary, color: theme.text.secondary }}>
                                📍 {job.location}
                              </span>
                            )}
                            <span 
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ 
                                backgroundColor: theme.primary[100], 
                                color: theme.primary[600] 
                              }}
                            >
                              {job.currentStage}
                            </span>
                          </div>
                        </div>
                        {selectedTargetJob === job.id && (
                          <svg className="w-5 h-5" style={{ color: theme.primary[600] }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center" style={{ color: theme.text.tertiary }}>
                      <p className="text-sm">No other jobs found in this company</p>
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
                      All data from "{sourceJob.position || 'Unknown Position'}" will be merged into the selected job. The source job will be removed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={isMerging || !selectedTargetJob}
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
                  'Merge Jobs'
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

export default MergeJob

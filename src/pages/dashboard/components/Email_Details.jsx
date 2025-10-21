import React, { useState, useEffect } from 'react'
import { useTheme } from '../../../App'
import { updateEmailStage, getEmailContent } from '../../../lib/jobs'
import TypeSelect from './Type_Select'

const EmailDetails = ({ email, emails, stageName, jobId, isOpen, onClose, onSaveStageChange }) => {
  const { theme } = useTheme()
  const [selectedEmailIndex, setSelectedEmailIndex] = useState(0)
  const [selectedStage, setSelectedStage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showTypeSelect, setShowTypeSelect] = useState(false)
  const [fullEmailContent, setFullEmailContent] = useState(null)
  const [isLoadingEmail, setIsLoadingEmail] = useState(false)

  // Support both single email and multiple emails
  const emailList = emails || (email ? [email] : [])
  const currentEmail = emailList[selectedEmailIndex] || emailList[0]

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Fetch full email content from mailin collection when email changes
  useEffect(() => {
    const fetchFullEmail = async () => {
      if (!currentEmail?.emailId || !isOpen) {
        setFullEmailContent(null)
        return
      }

      setIsLoadingEmail(true)
      try {
        const fullEmail = await getEmailContent(currentEmail.emailId)
        setFullEmailContent(fullEmail)
      } catch (error) {
        console.error('Error fetching full email:', error)
        setFullEmailContent(null)
      } finally {
        setIsLoadingEmail(false)
      }
    }

    fetchFullEmail()
  }, [currentEmail?.emailId, isOpen])

  // Reset selected stage when email changes
  useEffect(() => {
    setSelectedStage('')
  }, [selectedEmailIndex])

  // Early return AFTER all hooks
  if (!isOpen) return null

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

  // Handle stage selection from modal
  const handleStageSelect = async (newStage) => {
    if (!newStage || !currentEmail?.id) return
    
    setShowTypeSelect(false)
    setIsSaving(true)
    
    try {
      // Update the stage in Firebase
      await updateEmailStage(currentEmail.id, jobId, newStage)
      
      // Call parent callback to refresh data
      if (onSaveStageChange) {
        await onSaveStageChange()
      }
      
      // Reset and close
      setSelectedStage('')
      onClose()
    } catch (error) {
      console.error('Error updating email stage:', error)
      alert('Failed to update email stage. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop with Blur */}
      <div 
        className="fixed inset-0 z-40 transition-opacity backdrop-blur-sm overflow-hidden"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-1/2 lg:w-2/5 z-50 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          backgroundColor: theme.background.primary,
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 border-b" style={{ 
          backgroundColor: theme.background.primary,
          borderColor: theme.border.light 
        }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primary[600] }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div>
                <h2 className="text-xl font-bold" style={{ color: theme.text.primary }}>
                  Email Details
                </h2>
                {stageName && (
                  <p className="text-sm mt-0.5" style={{ color: theme.text.tertiary }}>
                    Current Stage: {stageName}
                  </p>
                )}
              </div>
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

          {/* Email Navigation (if multiple emails) */}
          {emailList.length > 1 && (
            <div className="flex items-center gap-3 pb-2">
              {/* Navigation Arrows */}
              <button
                onClick={() => setSelectedEmailIndex(Math.max(0, selectedEmailIndex - 1))}
                disabled={selectedEmailIndex === 0}
                className="p-2 rounded-lg transition-all"
                style={{
                  backgroundColor: selectedEmailIndex === 0 ? theme.background.secondary : theme.primary[100],
                  color: selectedEmailIndex === 0 ? theme.text.tertiary : theme.primary[600],
                  opacity: selectedEmailIndex === 0 ? 0.5 : 1,
                  cursor: selectedEmailIndex === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Email Selector Dropdown */}
              <div className="flex-1">
                <select
                  value={selectedEmailIndex}
                  onChange={(e) => setSelectedEmailIndex(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  style={{
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.medium,
                    color: theme.text.primary
                  }}
                >
                  {emailList.map((email, index) => (
                    <option key={index} value={index}>
                      Email {index + 1} of {emailList.length}: {email.subject?.substring(0, 40) || 'No Subject'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => setSelectedEmailIndex(Math.min(emailList.length - 1, selectedEmailIndex + 1))}
                disabled={selectedEmailIndex === emailList.length - 1}
                className="p-2 rounded-lg transition-all"
                style={{
                  backgroundColor: selectedEmailIndex === emailList.length - 1 ? theme.background.secondary : theme.primary[100],
                  color: selectedEmailIndex === emailList.length - 1 ? theme.text.tertiary : theme.primary[600],
                  opacity: selectedEmailIndex === emailList.length - 1 ? 0.5 : 1,
                  cursor: selectedEmailIndex === emailList.length - 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Email Content - Scrollable */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="p-6 pb-32">
            {/* No Emails Available */}
            {emailList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.background.secondary }}>
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.text.tertiary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: theme.text.primary }}>
                  No Email Information
                </h3>
                <p className="text-base mb-4 max-w-md" style={{ color: theme.text.secondary }}>
                  There are no email details available for this stage. This might happen when emails haven't been processed yet or the stage doesn't have associated email communications.
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg font-medium text-sm border transition-all hover:bg-opacity-10"
                  style={{
                    borderColor: theme.border.medium,
                    color: theme.text.secondary
                  }}
                >
                  Close
                </button>
              </div>
            )}

            {/* Loading State */}
            {emailList.length > 0 && isLoadingEmail && (
              <div className="flex items-center justify-center py-12">
                <div 
                  className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: theme.primary[600], borderTopColor: 'transparent' }}
                />
              </div>
            )}

            {/* Email Content */}
            {emailList.length > 0 && !isLoadingEmail && fullEmailContent && (
              <>
                {/* Email Metadata */}
                <div className="mb-6 p-4 rounded-lg border" style={{ 
                  backgroundColor: theme.background.secondary,
                  borderColor: theme.border.light 
                }}>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: theme.text.tertiary }}>
                        From
                      </label>
                      <p className="text-sm mt-1" style={{ color: theme.text.primary }}>
                        {fullEmailContent.Original_Sender || 'No sender information'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: theme.text.tertiary }}>
                        Date
                      </label>
                      <p className="text-sm mt-1" style={{ color: theme.text.primary }}>
                        {fullEmailContent.Original_Sent_At || 'Unknown date'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Subject */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: theme.text.primary }}>
                    {fullEmailContent.Subject || 'No Subject'}
                  </h3>
                </div>

                {/* Email Body */}
                <div className="prose prose-sm max-w-none">
                  <div 
                    className="whitespace-pre-wrap leading-relaxed text-base"
                    style={{ color: theme.text.secondary }}
                  >
                    {fullEmailContent.Content_Details || 'No content available'}
                  </div>
                </div>
              </>
            )}

            {/* No Email Content State */}
            {emailList.length > 0 && !isLoadingEmail && !fullEmailContent && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.background.secondary }}>
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.text.tertiary }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ color: theme.text.primary }}>
                  Email Content Unavailable
                </h3>
                <p className="text-base mb-4 max-w-md" style={{ color: theme.text.secondary }}>
                  We couldn't load the full email content for this message. This might be due to the email being processed or temporarily unavailable.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-80"
                    style={{
                      backgroundColor: theme.primary[600],
                      color: '#ffffff'
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg font-medium text-sm border transition-all hover:bg-opacity-10"
                    style={{
                      borderColor: theme.border.medium,
                      color: theme.text.secondary
                    }}
                  >
                    Close
                  </button>
                </div>
                
                {/* Show basic email info if available from currentEmail */}
                {currentEmail && (
                  <div className="mt-8 w-full max-w-md p-4 rounded-lg border" style={{ 
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.light 
                  }}>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: theme.text.primary }}>
                      Available Information
                    </h4>
                    <div className="space-y-2 text-sm">
                      {currentEmail.subject && (
                        <div>
                          <span className="font-medium" style={{ color: theme.text.secondary }}>Subject: </span>
                          <span style={{ color: theme.text.primary }}>{currentEmail.subject}</span>
                        </div>
                      )}
                      {currentEmail.from && (
                        <div>
                          <span className="font-medium" style={{ color: theme.text.secondary }}>From: </span>
                          <span style={{ color: theme.text.primary }}>{currentEmail.from}</span>
                        </div>
                      )}
                      {currentEmail.date && (
                        <div>
                          <span className="font-medium" style={{ color: theme.text.secondary }}>Date: </span>
                          <span style={{ color: theme.text.primary }}>
                            {currentEmail.date instanceof Date 
                              ? currentEmail.date.toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : currentEmail.date
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attachments (if any) */}
            {fullEmailContent?.Attachments && fullEmailContent.Attachments.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-3" style={{ color: theme.text.primary }}>
                  Attachments
                </h4>
                <div className="space-y-2">
                  {fullEmailContent.Attachments.map((attachment, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-opacity-50 cursor-pointer transition-all"
                      style={{ 
                        backgroundColor: theme.background.secondary,
                        borderColor: theme.border.light 
                      }}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primary[600] }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm flex-1" style={{ color: theme.text.primary }}>
                        {attachment.name || attachment.filename}
                      </span>
                      <span className="text-xs" style={{ color: theme.text.tertiary }}>
                        {attachment.size}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons - Only show if there are emails */}
        {emailList.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t" style={{ 
            backgroundColor: theme.background.primary,
            borderColor: theme.border.light 
          }}>
          {/* Reclassify Button */}
          {jobId && currentEmail?.id && !isSaving && (
            <button
              onClick={() => setShowTypeSelect(true)}
              className="w-full mb-4 px-4 py-3.5 rounded-lg font-semibold text-base transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{
                background: theme.gradients.primary,
                color: '#ffffff',
                boxShadow: `0 4px 16px ${theme.primary[600]}40`
              }}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span>Reclassify Email Stage</span>
              </div>
            </button>
          )}

          {/* Saving State */}
          {isSaving && (
            <div 
              className="w-full mb-4 px-4 py-3.5 rounded-lg flex items-center justify-center gap-2"
              style={{
                backgroundColor: theme.primary[100],
                color: theme.primary[700]
              }}
            >
              <div 
                className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                style={{ borderColor: theme.primary[600] }}
              />
              <span className="font-medium">Updating stage...</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="flex-1 px-4 py-3 rounded-lg font-medium border-2 transition-all hover:bg-opacity-10"
              style={{ 
                borderColor: theme.border.medium, 
                color: theme.text.secondary,
                backgroundColor: 'transparent'
              }}
              onClick={onClose}
              disabled={isSaving}
            >
              Close
            </button>
          </div>
          </div>
        )}
      </div>

      {/* Type Select Modal */}
      <TypeSelect
        isOpen={showTypeSelect}
        onClose={() => setShowTypeSelect(false)}
        onSelect={handleStageSelect}
        currentStage={stageName}
      />
    </>
  )
}

export default EmailDetails


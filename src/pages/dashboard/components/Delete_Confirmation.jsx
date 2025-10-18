import React from 'react'
import { useTheme } from '../../../App'

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, jobData, isDeleting }) => {
  const { theme } = useTheme()

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div 
        className="rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 animate-scale-in"
        style={{ 
          backgroundColor: theme.background.primary,
          borderColor: theme.status.rejected
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning Icon */}
        <div className="flex justify-center mb-6">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.status.rejected + '20' }}
          >
            <svg 
              className="w-10 h-10" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: theme.status.rejected }}
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-3" style={{ color: theme.text.primary }}>
          Delete Application?
        </h2>

        {/* Description */}
        <p className="text-center mb-6" style={{ color: theme.text.secondary }}>
          Are you sure you want to delete this job application? This action cannot be undone.
        </p>

        {/* Job Details */}
        <div 
          className="p-4 rounded-xl mb-6"
          style={{ backgroundColor: theme.background.secondary }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold flex-shrink-0"
              style={{ 
                backgroundColor: theme.primary[600],
                color: theme.text.inverse 
              }}
            >
              {jobData?.company?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate mb-1" style={{ color: theme.text.primary }}>
                {jobData?.position || 'Unknown Position'}
              </h3>
              <p className="text-sm truncate" style={{ color: theme.text.secondary }}>
                {jobData?.company || 'Unknown Company'}
              </p>
              {jobData?.location && (
                <p className="text-xs mt-1 truncate" style={{ color: theme.text.tertiary }}>
                  📍 {jobData.location}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div 
          className="p-3 rounded-lg mb-6 flex items-start gap-2"
          style={{ 
            backgroundColor: theme.status.rejected + '10',
            border: `1px solid ${theme.status.rejected}40`
          }}
        >
          <svg 
            className="w-5 h-5 flex-shrink-0 mt-0.5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ color: theme.status.rejected }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-xs" style={{ color: theme.status.rejected }}>
            All associated emails and timeline data will be permanently deleted.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl font-semibold transition-all hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: theme.background.secondary,
              color: theme.text.primary,
              border: `2px solid ${theme.border.medium}`
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 rounded-xl font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: theme.status.rejected,
              color: theme.text.inverse
            }}
          >
            {isDeleting ? (
              <div className="flex items-center justify-center gap-2">
                <div 
                  className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ 
                    borderColor: theme.text.inverse,
                    borderTopColor: 'transparent'
                  }}
                ></div>
                Deleting...
              </div>
            ) : (
              'Delete Application'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmation


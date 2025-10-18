import React, { useState } from 'react'
import { useTheme } from '../../../App'

const TypeSelect = ({ isOpen, onClose, onSelect, currentStage }) => {
  const { theme } = useTheme()
  const [selectedStage, setSelectedStage] = useState('')

  if (!isOpen) return null

  const stages = [
    { 
      value: 'applied', 
      label: 'Applied', 
      icon: '📝',
      description: 'Initial application submitted',
      color: theme.status.applied
    },
    { 
      value: 'screening', 
      label: 'Screening', 
      icon: '👁️',
      description: 'Under review or phone screening',
      color: theme.primary[500]
    },
    { 
      value: 'interview1', 
      label: '1st Round', 
      icon: '💬',
      description: 'First interview scheduled or completed',
      color: theme.status.interview
    },
    { 
      value: 'interview2', 
      label: '2nd Round', 
      icon: '🎯',
      description: 'Second interview round',
      color: theme.status.interview
    },
    { 
      value: 'interview3', 
      label: '3rd Round', 
      icon: '🎯',
      description: 'Third interview round',
      color: theme.status.interview
    },
    { 
      value: 'interview4', 
      label: '4th Round', 
      icon: '🎯',
      description: 'Fourth interview round',
      color: theme.status.interview
    },
    { 
      value: 'offer', 
      label: 'Offer', 
      icon: '🎉',
      description: 'Offer received',
      color: theme.status.offer
    },
    { 
      value: 'rejected', 
      label: 'Rejected', 
      icon: '❌',
      description: 'Application rejected',
      color: theme.status.rejected
    }
  ]

  const handleStageClick = (stageValue) => {
    setSelectedStage(stageValue)
  }

  const handleConfirm = () => {
    if (selectedStage) {
      onSelect(selectedStage)
      setSelectedStage('')
    }
  }

  const handleClose = () => {
    setSelectedStage('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 transition-opacity backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <div 
          className="w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all"
          style={{ backgroundColor: theme.background.primary }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b" style={{ borderColor: theme.border.light }}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold" style={{ color: theme.text.primary }}>
                  Select Application Stage
                </h3>
                <p className="text-sm mt-1" style={{ color: theme.text.tertiary }}>
                  Choose the current status of this application
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-opacity-10 transition-all"
                style={{ color: theme.text.tertiary, backgroundColor: theme.background.secondary }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stages.map((stage) => {
                const isSelected = selectedStage === stage.value
                const isCurrent = currentStage === stage.value
                
                return (
                  <button
                    key={stage.value}
                    onClick={() => handleStageClick(stage.value)}
                    className="relative p-4 rounded-xl border-2 text-left transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: isSelected 
                        ? `${stage.color}15` 
                        : theme.background.secondary,
                      borderColor: isSelected 
                        ? stage.color 
                        : theme.border.light,
                      boxShadow: isSelected 
                        ? `0 4px 12px ${stage.color}30` 
                        : 'none'
                    }}
                  >
                    {/* Current badge */}
                    {isCurrent && (
                      <div 
                        className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ 
                          backgroundColor: stage.color,
                          color: '#ffffff'
                        }}
                      >
                        Current
                      </div>
                    )}

                    {/* Stage content */}
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ 
                          backgroundColor: isSelected ? stage.color : `${stage.color}20`
                        }}
                      >
                        {stage.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 
                          className="font-semibold text-base mb-1"
                          style={{ color: theme.text.primary }}
                        >
                          {stage.label}
                        </h4>
                        <p 
                          className="text-xs leading-relaxed"
                          style={{ color: theme.text.tertiary }}
                        >
                          {stage.description}
                        </p>
                      </div>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: stage.color }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="#ffffff" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t" style={{ borderColor: theme.border.light }}>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-3 rounded-lg font-medium border-2 transition-all hover:bg-opacity-10"
                style={{ 
                  borderColor: theme.border.medium, 
                  color: theme.text.secondary,
                  backgroundColor: 'transparent'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedStage}
                className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{
                  background: selectedStage ? theme.gradients.primary : theme.border.medium,
                  color: '#ffffff',
                  boxShadow: selectedStage ? `0 4px 16px ${theme.primary[600]}40` : 'none'
                }}
              >
                {selectedStage ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirm Selection</span>
                  </div>
                ) : (
                  'Select a stage'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default TypeSelect


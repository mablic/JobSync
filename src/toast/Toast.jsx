import React, { createContext, useContext, useState, useCallback } from 'react'
import { useTheme } from '../App'

// Toast Context
const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

// Toast Component
const ToastItem = ({ id, message, type, onClose }) => {
  const { theme } = useTheme()

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.status.offer,
          icon: '✓',
          color: '#ffffff'
        }
      case 'error':
        return {
          backgroundColor: theme.status.rejected,
          icon: '✕',
          color: '#ffffff'
        }
      case 'warning':
        return {
          backgroundColor: theme.status.underReview,
          icon: '⚠',
          color: '#ffffff'
        }
      case 'info':
        return {
          backgroundColor: theme.primary[600],
          icon: 'ℹ',
          color: '#ffffff'
        }
      default:
        return {
          backgroundColor: theme.primary[600],
          icon: '✓',
          color: '#ffffff'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <div
      className="mb-3 animate-slideInRight flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl min-w-[300px] max-w-[400px]"
      style={{
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
      >
        {styles.icon}
      </div>
      <p className="font-medium text-sm flex-1">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now()
    
    setToasts(prev => [...prev, { id, message, type }])

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div 
          className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse"
          style={{ pointerEvents: 'none' }}
        >
          <div style={{ pointerEvents: 'auto' }}>
            {toasts.map(toast => (
              <ToastItem
                key={toast.id}
                id={toast.id}
                message={toast.message}
                type={toast.type}
                onClose={removeToast}
              />
            ))}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

// Add CSS animations to document
if (typeof document !== 'undefined') {
  const styleId = 'toast-animations'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }
}

export default ToastProvider

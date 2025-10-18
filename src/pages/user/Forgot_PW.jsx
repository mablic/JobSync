import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../../App'
import { useToast } from '../../toast/Toast'

const Forgot_PW = () => {
  const { theme } = useTheme()
  const showToast = useToast()
  const [formData, setFormData] = useState({
    email: '',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const { resetPassword } = await import('../../lib/users.js')
      
      // Send password reset email
      await resetPassword(formData.email)
      
      console.log('Password reset email sent to:', formData.email)
      setIsSubmitted(true)
      showToast('Password reset email sent! Check your inbox.', 'success')
      
    } catch (error) {
      console.error('Error sending password reset:', error)
      
      if (error.code === 'auth/user-not-found') {
        showToast('No account found with this email address.', 'error')
      } else if (error.code === 'auth/invalid-email') {
        showToast('Please enter a valid email address.', 'warning')
      } else {
        showToast('Error sending reset email: ' + error.message, 'error')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: theme.gradients.subtle }}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-6">
            <div 
              className="flex items-center justify-center w-12 h-12 rounded-xl"
              style={{ background: theme.gradients.primary }}
            >
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
          </Link>
          <h2 className="text-3xl font-extrabold" style={{ color: theme.text.primary }}>
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme.text.secondary }}>
            No worries, we'll send you reset instructions
          </p>
        </div>

        {/* Form */}
        <div 
          className="rounded-2xl shadow-xl p-8 border"
          style={{ 
            backgroundColor: theme.background.primary,
            borderColor: theme.border.light
          }}
        >
          {!isSubmitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: theme.text.primary }}>
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-lg relative block w-full px-4 py-3 border placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{
                    backgroundColor: theme.background.secondary,
                    borderColor: theme.border.medium,
                    color: theme.text.primary,
                    focusRingColor: theme.primary[500]
                  }}
                  placeholder="you@example.com"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg"
                style={{ 
                  background: theme.gradients.primary,
                  focusRingColor: theme.primary[500]
                }}
              >
                Send Reset Instructions
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: `${theme.status.offer}20` }}
              >
                <svg 
                  className="w-8 h-8" 
                  style={{ color: theme.status.offer }}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                  />
                </svg>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: theme.text.primary }}>
                  Check your email
                </h3>
                <p className="text-sm" style={{ color: theme.text.secondary }}>
                  We've sent password reset instructions to <strong>{formData.email}</strong>
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs" style={{ color: theme.text.tertiary }}>
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-sm font-medium"
                  style={{ color: theme.primary[600] }}
                >
                  Try another email
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back to Sign In */}
        <div className="text-center">
          <p className="text-sm" style={{ color: theme.text.secondary }}>
            Remember your password?{' '}
            <Link 
              to="/Sign_In" 
              className="font-medium hover:opacity-80 transition-opacity"
              style={{ color: theme.primary[600] }}
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Help Section */}
        <div 
          className="rounded-xl p-4 border"
          style={{ 
            backgroundColor: theme.background.secondary,
            borderColor: theme.border.light
          }}
        >
          <div className="flex items-start space-x-3">
            <svg 
              className="w-5 h-5 flex-shrink-0 mt-0.5" 
              style={{ color: theme.primary[600] }}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium mb-1" style={{ color: theme.text.primary }}>
                Need help?
              </h4>
              <p className="text-xs" style={{ color: theme.text.secondary }}>
                If you're having trouble accessing your account, contact our support team at{' '}
                <a 
                  href="mailto:support@jobflow.com" 
                  className="font-medium hover:opacity-80 transition-opacity"
                  style={{ color: theme.primary[600] }}
                >
                  support@jobflow.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Forgot_PW
